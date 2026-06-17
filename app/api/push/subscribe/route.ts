import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  cidade: z.string().optional(),
});

// Helper: acessa tabela push_subscriptions que ainda não está nos tipos gerados
function pushSubs(supabase: SupabaseClient) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from("push_subscriptions");
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message },
      { status: 422 }
    );
  }

  const { error } = await pushSubs(supabase).upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      keys: parsed.data.keys,
      cidade: parsed.data.cidade ?? null,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  const { endpoint } = await request.json().catch(() => ({ endpoint: null }));
  if (!endpoint) {
    return NextResponse.json(
      { success: false, error: "endpoint obrigatório" },
      { status: 422 }
    );
  }

  await pushSubs(supabase).delete().eq("user_id", user.id).eq("endpoint", endpoint);

  return NextResponse.json({ success: true });
}
