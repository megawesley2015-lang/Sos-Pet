import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";

export const dynamic = "force-dynamic";

type MatchRow = {
  id: string;
  score: number;
  status: string;
  created_at: string;
  lost_id: string;
  lost_name: string | null;
  lost_species: string;
  lost_color: string;
  lost_breed: string | null;
  lost_photo: string | null;
  lost_city: string;
  lost_owner_id: string | null;
  lost_at: string;
  found_id: string;
  found_name: string | null;
  found_species: string;
  found_color: string;
  found_breed: string | null;
  found_photo: string | null;
  found_city: string;
  found_owner_id: string | null;
  found_at: string;
};

/**
 * GET /api/pets/[id]/matches
 * Retorna possíveis matches de um pet (perdido↔encontrado).
 * Apenas o dono do pet pode ver os matches.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  const { data: pet, error: petErr } = await supabase
    .from("pets")
    .select("id, owner_id, kind")
    .eq("id", id)
    .maybeSingle();

  if (petErr || !pet) {
    return NextResponse.json(
      { success: false, error: "Pet não encontrado" },
      { status: 404 }
    );
  }

  if (pet.owner_id !== user.id) {
    return NextResponse.json(
      { success: false, error: "Acesso negado" },
      { status: 403 }
    );
  }

  // Usa cast pois pet_matches_view ainda não está nos tipos gerados
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (col: string, val: string) => {
          neq: (col: string, val: string) => {
            order: (col: string, opts: object) => {
              limit: (n: number) => Promise<{ data: MatchRow[] | null; error: unknown }>;
            };
          };
        };
      };
    };
  };

  const lostCol = pet.kind === "lost" ? "lost_id" : "found_id";
  const { data: matches, error } = await db
    .from("pet_matches_view")
    .select("*")
    .eq(lostCol, id)
    .neq("status", "dismissed")
    .order("score", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar matches" },
      { status: 500 }
    );
  }

  const normalized = (matches ?? []).map((m) => ({
    matchId:    m.id,
    score:      m.score,
    status:     m.status,
    matchedAt:  m.created_at,
    candidate:
      pet.kind === "lost"
        ? {
            id:         m.found_id,
            name:       m.found_name,
            species:    m.found_species,
            color:      m.found_color,
            breed:      m.found_breed,
            photo:      m.found_photo,
            city:       m.found_city,
            reportedAt: m.found_at,
          }
        : {
            id:         m.lost_id,
            name:       m.lost_name,
            species:    m.lost_species,
            color:      m.lost_color,
            breed:      m.lost_breed,
            photo:      m.lost_photo,
            city:       m.lost_city,
            reportedAt: m.lost_at,
          },
  }));

  return NextResponse.json({ success: true, data: normalized });
}

/**
 * PATCH /api/pets/[id]/matches
 * Body: { matchId: string, action: "confirmed" | "dismissed" }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const { matchId, action } = body ?? {};

  if (!matchId || !["confirmed", "dismissed"].includes(action as string)) {
    return NextResponse.json(
      { success: false, error: "Parâmetros inválidos" },
      { status: 400 }
    );
  }

  const { data: pet } = await supabase
    .from("pets")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (!pet || pet.owner_id !== user.id) {
    return NextResponse.json(
      { success: false, error: "Acesso negado" },
      { status: 403 }
    );
  }

  // Cast para pet_matches (não está nos tipos gerados ainda)
  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      update: (v: object) => {
        eq: (col: string, val: string) => Promise<{ error: unknown }>;
      };
    };
  })
    .from("pet_matches")
    .update({
      status: action,
      ...(action === "confirmed"
        ? { confirmed_at: new Date().toISOString() }
        : { dismissed_at: new Date().toISOString() }),
    })
    .eq("id", matchId as string);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar match" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
