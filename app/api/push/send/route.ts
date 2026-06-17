import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const sendSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(200),
  url: z.string().optional().default("/"),
  tag: z.string().optional(),
  user_ids: z.array(z.string().uuid()).optional(),
  cidade: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pushSubs(supabase: SupabaseClient) { return (supabase as any).from("push_subscriptions"); }

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const expectedToken = process.env.PUSH_SEND_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { success: false, error: "Acesso negado" },
      { status: 401 }
    );
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { success: false, error: "VAPID keys não configuradas" },
      { status: 500 }
    );
  }

  webpush.setVapidDetails("mailto:contato@aumigo.com.br", vapidPublic, vapidPrivate);

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message },
      { status: 422 }
    );
  }

  const supabase = createServiceClient();
  let query = pushSubs(supabase).select("endpoint, keys");

  if (parsed.data.user_ids?.length) {
    query = query.in("user_id", parsed.data.user_ids);
  } else if (parsed.data.cidade) {
    query = query.eq("cidade", parsed.data.cidade);
  }

  const { data: subs } = await query;
  if (!subs?.length) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  const payload = JSON.stringify({
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url,
    tag: parsed.data.tag,
  });

  const results = await Promise.allSettled(
    (subs as Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>).map(
      (sub) => webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  return NextResponse.json({ success: true, sent, failed });
}
