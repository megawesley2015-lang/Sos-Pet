import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PawPrint, Plus, ClipboardList, Filter } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pets Resgatados — ONG SOS Pet" };

const SAUDE_COLOR: Record<string, string> = {
  critica:   "border-danger/50 bg-danger/10 text-danger",
  regular:   "border-yellow-400/50 bg-yellow-400/10 text-yellow-300",
  boa:       "border-green-400/50 bg-green-400/10 text-green-300",
  excelente: "border-cyan-400/50 bg-cyan-400/10 text-cyan-300",
};
const SAUDE_LABEL: Record<string, string> = {
  critica: "Crítica", regular: "Regular", boa: "Boa", excelente: "Excelente",
};
const SPECIES: Record<string, string> = { dog: "🐕", cat: "🐈", other: "🐾" };
const SPECIES_LABEL: Record<string, string> = { dog: "Cão", cat: "Gato", other: "Outro" };

interface PageProps {
  searchParams: Promise<{
    saude?: string;
    especie?: string;
    castrado?: string;
    ordem?: string;
  }>;
}

export default async function OngPetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  // Busca prontuários com dados do pet
  let query = supabase
    .from("prontuarios")
    .select(`
      id, data_resgate, situacao_saude, peso_kg, castrado, microchip,
      pets ( id, name, species, photo_url, city, neighborhood )
    `)
    .eq("ong_id", user.id)
    .order(
      params.ordem === "saude" ? "situacao_saude" : "data_resgate",
      { ascending: false }
    );

  if (params.saude) query = query.eq("situacao_saude", params.saude);
  if (params.castrado === "sim") query = query.eq("castrado", true);
  if (params.castrado === "nao") query = query.eq("castrado", false);

  const { data: rawProntuarios } = await query.limit(100);

  type PetLite = { id: string; name: string | null; species: string; photo_url: string | null; city: string; neighborhood: string };
  type ProntuarioRow = { id: string; data_resgate: string; situacao_saude: string; peso_kg: number | null; castrado: boolean; microchip: string | null; pets: PetLite | null };

  let prontuarios = (rawProntuarios ?? []) as ProntuarioRow[];

  // Filtro de espécie (client-side, pois está em join)
  if (params.especie) {
    prontuarios = prontuarios.filter((p) => p.pets?.species === params.especie);
  }

  function filterLink(key: string, value: string | null) {
    const next = new URLSearchParams(params as Record<string, string>);
    if (value === null) next.delete(key);
    else next.set(key, value);
    return `/ong/pets?${next.toString()}`;
  }

  const Chip = ({ label, active, href }: { label: string; active: boolean; href: string }) => (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition ${
        active
          ? "border-brand-500 bg-brand-500/20 text-brand-200"
          : "border-white/10 text-fg-muted hover:border-white/25 hover:text-fg"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-fg">Pets Resgatados</h1>
          <p className="text-sm text-fg-muted">{prontuarios.length} registro(s)</p>
        </div>
        <Link
          href="/ong/prontuarios/novo"
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-bold text-white hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Novo prontuário
        </Link>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-white/10 bg-ink-700/40 p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-fg-muted">
          <Filter className="h-3.5 w-3.5" />
          Filtros
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-fg-subtle">Saúde:</span>
            <Chip label="Todos" active={!params.saude} href={filterLink("saude", null)} />
            {["critica", "regular", "boa", "excelente"].map((s) => (
              <Chip key={s} label={SAUDE_LABEL[s]} active={params.saude === s} href={filterLink("saude", s)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-fg-subtle">Espécie:</span>
            <Chip label="Todas" active={!params.especie} href={filterLink("especie", null)} />
            {["dog", "cat", "other"].map((s) => (
              <Chip key={s} label={SPECIES_LABEL[s]} active={params.especie === s} href={filterLink("especie", s)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-fg-subtle">Castrado:</span>
            <Chip label="Todos" active={!params.castrado} href={filterLink("castrado", null)} />
            <Chip label="Sim" active={params.castrado === "sim"} href={filterLink("castrado", "sim")} />
            <Chip label="Não" active={params.castrado === "nao"} href={filterLink("castrado", "nao")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-fg-subtle">Ordenar:</span>
            <Chip label="Data de resgate" active={params.ordem !== "saude"} href={filterLink("ordem", null)} />
            <Chip label="Situação de saúde" active={params.ordem === "saude"} href={filterLink("ordem", "saude")} />
          </div>
        </div>
      </div>

      {/* Lista */}
      {!prontuarios.length ? (
        <div className="py-16 text-center">
          <PawPrint className="mx-auto mb-3 h-10 w-10 text-fg-subtle" />
          <p className="text-fg-muted">Nenhum pet cadastrado com esses filtros.</p>
          <Link href="/ong/prontuarios/novo" className="mt-3 inline-block text-sm text-brand-400 hover:underline">
            Abrir primeiro prontuário →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prontuarios.map((p) => {
            const pet = p.pets;
            return (
              <Link
                key={p.id}
                href={`/ong/prontuarios/${p.id}`}
                className="flex gap-3 rounded-xl border border-white/10 bg-ink-700/40 p-4 transition hover:border-brand-500/30 hover:bg-ink-700/60"
              >
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-600 text-2xl">
                  {pet?.photo_url
                    ? <img src={pet.photo_url} alt="" className="h-full w-full object-cover" />
                    : (SPECIES[pet?.species ?? "other"] ?? "🐾")}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-display text-sm font-bold text-fg">
                      {pet?.name ?? "Sem nome"}
                    </p>
                    <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase ${SAUDE_COLOR[p.situacao_saude] ?? ""}`}>
                      {SAUDE_LABEL[p.situacao_saude]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {SPECIES_LABEL[pet?.species ?? "other"]} · {pet?.city}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.castrado && (
                      <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400">
                        Castrado
                      </span>
                    )}
                    {p.peso_kg && (
                      <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-fg-subtle">
                        {p.peso_kg} kg
                      </span>
                    )}
                    {p.microchip && (
                      <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-fg-subtle">
                        Microchip
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-fg-subtle">
                    <ClipboardList className="h-2.5 w-2.5" />
                    Resgate: {new Date(p.data_resgate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
