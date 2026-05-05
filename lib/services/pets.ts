/**
 * Service layer — queries de pets reutilizáveis em Server Components/Actions.
 *
 * Princípio: nenhuma página fala SQL direto. Todas passam aqui.
 * Isso facilita refatorar (cache, joins futuros, instrumentação).
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PetKind,
  PetRow,
  PetSpecies,
  PetUpdate,
} from "@/lib/types/database";

export interface PetFilters {
  kind?: PetKind;
  species?: PetSpecies;
  city?: string;
  ownerId?: string;
  limit?: number;
}

export async function listPets(filters: PetFilters = {}): Promise<{
  pets: PetRow[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("pets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 48);

  if (filters.ownerId) {
    // Quando filtrando por owner, mostramos active + resolved (dono vê tudo dele)
    query = query.eq("owner_id", filters.ownerId);
  } else {
    query = query.eq("status", "active");
  }
  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.species) query = query.eq("species", filters.species);
  if (filters.city) {
    const safeCity = filters.city.slice(0, 80);
    query = query.ilike("city", `%${safeCity}%`);
  }

  const { data, error } = await query;
  return {
    pets: (data as PetRow[] | null) ?? [],
    error: error?.message ?? null,
  };
}

export async function getPetById(id: string): Promise<PetRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as PetRow | null) ?? null;
}

/**
 * Carrega o pet apenas se o user logado for o dono.
 * Usado nas páginas de edição (defesa em profundidade — RLS já bloqueia,
 * mas isso dá um 404/forbidden cedo em vez de form vazio).
 */
export async function getPetForOwner(
  id: string,
  userId: string
): Promise<PetRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  return (data as PetRow | null) ?? null;
}

export async function updatePet(
  id: string,
  patch: PetUpdate
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  // RLS faz o gate: só passa se owner_id = auth.uid()
  const { error } = await supabase.from("pets").update(patch).eq("id", id);
  return { ok: !error, error: error?.message ?? null };
}

export async function deletePet(
  id: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pets").delete().eq("id", id);
  return { ok: !error, error: error?.message ?? null };
}

/**
 * Upload da foto pro bucket pet-photos.
 * Retorna a URL pública (bucket é public).
 *
 * Path: <ownerId|anon>/<timestamp>-<random>.<ext>
 *   - agrupa por owner pra facilitar housekeeping futuro
 *   - prefixo "anon" pra cadastros sem login
 */
export async function uploadPetPhoto(
  file: File,
  ownerId: string | null
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const folder = ownerId ?? "anon";
  const filename = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("pet-photos")
    .upload(filename, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from("pet-photos").getPublicUrl(filename);
  return { url: data.publicUrl, error: null };
}

/**
 * Deleta uma foto do Storage a partir da URL pública.
 * Best-effort (não falha o request se der erro).
 */
export async function deletePetPhotoByUrl(publicUrl: string): Promise<void> {
  try {
    const url = new URL(publicUrl);
    const marker = "/storage/v1/object/public/pet-photos/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return;
    const path = url.pathname.slice(idx + marker.length);
    if (!path) return;

    const supabase = await createSupabaseServerClient();
    await supabase.storage.from("pet-photos").remove([path]);
  } catch {
    // ignora — limpeza de storage não é crítica
  }
}
