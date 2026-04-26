/**
 * Service layer — prestadores.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PrestadorCategoria,
  PrestadorRow,
  PrestadorStatsRow,
  PrestadorUpdate,
} from "@/lib/types/database";
import { slugify } from "@/lib/validation/provider";

export interface ProviderFilters {
  categoria?: PrestadorCategoria;
  cidade?: string;
  busca?: string; // buscar em nome/descricao
  emergencia24h?: boolean;
  delivery?: boolean;
  ownerId?: string;
  limit?: number;
}

export async function listProviders(
  filters: ProviderFilters = {}
): Promise<{ providers: PrestadorRow[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("prestadores")
    .select("*")
    .order("destaque", { ascending: false })
    .order("media_avaliacoes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 60);

  if (filters.ownerId) {
    query = query.eq("user_id", filters.ownerId);
  } else {
    query = query.eq("status", "ativo");
  }
  if (filters.categoria) query = query.eq("categoria", filters.categoria);
  if (filters.cidade) query = query.ilike("cidade", `%${filters.cidade}%`);
  if (filters.emergencia24h) query = query.eq("emergencia24h", true);
  if (filters.delivery) query = query.eq("delivery", true);
  if (filters.busca) {
    // OR em nome OU descricao (case-insensitive)
    const term = `%${filters.busca}%`;
    query = query.or(`nome.ilike.${term},descricao.ilike.${term}`);
  }

  const { data, error } = await query;
  return {
    providers: (data as PrestadorRow[] | null) ?? [],
    error: error?.message ?? null,
  };
}

export async function getProviderBySlug(
  slug: string
): Promise<PrestadorRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("prestadores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as PrestadorRow | null) ?? null;
}

export async function getProviderForOwner(
  id: string,
  userId: string
): Promise<PrestadorRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("prestadores")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as PrestadorRow | null) ?? null;
}

export async function getProviderStats(
  prestadorId: string
): Promise<PrestadorStatsRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("prestador_stats")
    .select("*")
    .eq("prestador_id", prestadorId)
    .maybeSingle();
  return (data as PrestadorStatsRow | null) ?? null;
}

/**
 * Gera slug único — appendiando "-2", "-3" etc se já existir.
 * Retorna o slug que pode ser usado no INSERT.
 */
export async function generateUniqueSlug(nome: string): Promise<string> {
  const base = slugify(nome) || "prestador";
  const supabase = await createSupabaseServerClient();
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data } = await supabase
      .from("prestadores")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix++}`;
    if (suffix > 50) return `${base}-${Date.now()}`; // fallback duro
  }
}

export async function updateProvider(
  id: string,
  patch: PrestadorUpdate
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("prestadores")
    .update(patch)
    .eq("id", id);
  return { ok: !error, error: error?.message ?? null };
}

export async function deleteProvider(
  id: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("prestadores").delete().eq("id", id);
  return { ok: !error, error: error?.message ?? null };
}

/**
 * Upload de foto (logo ou capa) — bucket provider-photos.
 * Path: <auth.uid()>/<kind>-<timestamp>-<rand>.<ext>
 *   - RLS exige que o primeiro segmento bata com auth.uid()
 *   - kind = "logo" | "capa" pra facilitar housekeeping futuro
 */
export async function uploadProviderPhoto(
  file: File,
  ownerId: string,
  kind: "logo" | "capa"
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${ownerId}/${kind}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("provider-photos")
    .upload(filename, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (upErr) return { url: null, error: upErr.message };

  const { data } = supabase.storage
    .from("provider-photos")
    .getPublicUrl(filename);
  return { url: data.publicUrl, error: null };
}

export async function deleteProviderPhotoByUrl(publicUrl: string): Promise<void> {
  try {
    const url = new URL(publicUrl);
    const marker = "/storage/v1/object/public/provider-photos/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return;
    const path = url.pathname.slice(idx + marker.length);
    if (!path) return;

    const supabase = await createSupabaseServerClient();
    await supabase.storage.from("provider-photos").remove([path]);
  } catch {
    /* best effort */
  }
}

/**
 * RPCs de incremento — chamadas via Server Action no click do user.
 * Não bloqueamos a navegação se falhar (best effort).
 */
export async function incrementProviderView(prestadorId: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("incrementar_visualizacao_prestador", { p_id: prestadorId });
  } catch {
    /* ignore */
  }
}

export async function incrementWhatsappClick(
  prestadorId: string
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("incrementar_clique_whatsapp", { p_id: prestadorId });
  } catch {
    /* ignore */
  }
}

export async function incrementPhoneClick(
  prestadorId: string
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("incrementar_clique_telefone", { p_id: prestadorId });
  } catch {
    /* ignore */
  }
}

export const CATEGORIA_LABEL: Record<PrestadorCategoria, string> = {
  veterinario: "Veterinário",
  petshop: "Pet Shop",
  adestrador: "Adestrador",
  hospedagem: "Hospedagem",
  banho_tosa: "Banho & Tosa",
  outro: "Outro",
};
