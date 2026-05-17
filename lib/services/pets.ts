/**
 * Service layer — queries de pets reutilizáveis em Server Components/Actions.
 *
 * Princípio: nenhuma página fala SQL direto. Todas passam aqui.
 * Isso facilita refatorar (cache, joins futuros, instrumentação).
 *
 * `React.cache` — dedup automático dentro do mesmo request. Quando uma página
 * chama getPetById em generateMetadata + na page render, vira 1 round-trip só.
 */
import { cache } from "react";
import {
  createSupabaseServerClient,
  createServiceClient,
} from "@/lib/supabase/server";
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

/**
 * Lista pets para visualização. Estratégia (B-05):
 *   - Sem ownerId  → usa view `pets_public` (sem contact_*) — público, scrape-resistant.
 *   - Com ownerId  → usa tabela `pets` direto (RLS deixa owner ver tudo dele,
 *                    incluindo contato pra editar).
 *
 * Listagens públicas chegam até com `contact_phone === ""` se a página tentar
 * exibir contato — por isso a página de detalhe usa `getPetContact` separado.
 */
export async function listPets(filters: PetFilters = {}): Promise<{
  pets: PetRow[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();

  // Branches separadas pro TS conseguir inferir o shape correto.
  // Owner → tabela `pets` (RLS libera dono).
  // Público → view `pets_public` (sem contact_*, anti-scraping).
  if (filters.ownerId) {
    let q = supabase
      .from("pets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 48)
      .eq("owner_id", filters.ownerId);

    if (filters.kind) q = q.eq("kind", filters.kind);
    if (filters.species) q = q.eq("species", filters.species);
    if (filters.city) q = q.ilike("city", `%${filters.city}%`);

    const { data, error } = await q;
    return {
      pets: (data as PetRow[] | null) ?? [],
      error: error?.message ?? null,
    };
  }

  let q = supabase
    .from("pets_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 48)
    .eq("status", "active");

  if (filters.kind) q = q.eq("kind", filters.kind);
  if (filters.species) q = q.eq("species", filters.species);
  if (filters.city) q = q.ilike("city", `%${filters.city}%`);

  const { data, error } = await q;

  // View não tem contact_* — preenche com strings vazias pra preservar shape PetRow.
  // Quem precisar do contato (página de detalhe) chama getPetContact separadamente.
  const pets: PetRow[] = (
    (data as Omit<PetRow, "contact_name" | "contact_phone" | "contact_whatsapp">[] | null) ?? []
  ).map((row) => ({
    ...row,
    contact_name: "",
    contact_phone: "",
    contact_whatsapp: false,
  }));

  return {
    pets,
    error: error?.message ?? null,
  };
}

/**
 * Carrega o pet para a página de detalhe.
 *
 * Tenta primeiro a tabela `pets` direto (RLS deixa owner/admin enxergar com
 * contact_* preenchido). Se anônimo, RLS retorna null — fallback para
 * `pets_public` (sem contato) + RPC `get_pet_contact` em paralelo.
 *
 * Resultado tem `contact_*` SEMPRE preenchido (string vazia em fallback se a
 * RPC falhar — improvável, mas defensivo).
 */
export const getPetById = cache(async (id: string): Promise<PetRow | null> => {
  const supabase = await createSupabaseServerClient();

  // Caminho rápido: owner/admin acessa tabela direto
  const { data: ownerRow } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (ownerRow) return ownerRow as PetRow;

  // Anônimo: monta a partir da view pública + RPC de contato
  const [pubRes, contactRes] = await Promise.all([
    supabase.from("pets_public").select("*").eq("id", id).maybeSingle(),
    supabase
      .rpc("get_pet_contact", { pet_id: id })
      .maybeSingle(),
  ]);

  if (!pubRes.data) return null;

  const contact = contactRes.data as
    | { contact_name: string; contact_phone: string; contact_whatsapp: boolean }
    | null;

  return {
    ...(pubRes.data as Partial<PetRow>),
    contact_name: contact?.contact_name ?? "",
    contact_phone: contact?.contact_phone ?? "",
    contact_whatsapp: contact?.contact_whatsapp ?? false,
  } as PetRow;
});

/**
 * Resolve apenas o contato de um pet (RPC `get_pet_contact`).
 * Útil pra páginas que já têm o pet básico mas precisam só do contato sob demanda.
 */
export async function getPetContact(id: string): Promise<{
  contact_name: string;
  contact_phone: string;
  contact_whatsapp: boolean;
} | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .rpc("get_pet_contact", { pet_id: id })
    .maybeSingle();
  return (data as {
    contact_name: string;
    contact_phone: string;
    contact_whatsapp: boolean;
  } | null) ?? null;
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
 *
 * SEGURANÇA (B-04): Usa SERVICE ROLE para bypassar RLS do Storage.
 * Por quê: a partir da migration `20260504_hardening`, o bucket pet-photos
 * NÃO aceita mais upload anônimo via REST direto — só service role.
 * Toda foto chega via Server Action, que validou Turnstile + mime/size antes.
 * Vetor de spam direto na REST do Supabase fechado.
 */
export async function uploadPetPhoto(
  file: File,
  ownerId: string | null
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createServiceClient();
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

    // Usa service role pra alinhar com upload (B-04).
    const supabase = createServiceClient();
    await supabase.storage.from("pet-photos").remove([path]);
  } catch {
    // ignora — limpeza de storage não é crítica
  }
}
