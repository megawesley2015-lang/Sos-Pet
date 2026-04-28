import Link from "next/link";
import Image from "next/image";
import { PawPrint, ExternalLink, Trash2, RotateCcw } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PetRow } from "@/lib/types/database";
import { KIND_LABEL, SPECIES_LABEL, formatRelativeDate } from "@/lib/utils/format";
import { removerPetAction, reativarPetAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Pets" };

const STATUS_CLASSES: Record<string, string> = {
  active:   "bg-success/15 text-success",
  resolved: "bg-cyan-500/15 text-cyan-400",
  removed:  "bg-danger/15 text-danger-fg",
};

export default async function AdminPetsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const lista = (pets ?? []) as PetRow[];
  const removidos = lista.filter((p) => p.status === "removed");
  const ativos = lista.filter((p) => p.status !== "removed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Pets</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {lista.length} registros · {removidos.length} removidos
        </p>
      </div>

      {/* Ativos */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-fg-subtle">
          Ativos e resolvidos ({ativos.length})
        </h2>
        <div className="space-y-2">
          {ativos.map((p) => (
            <PetAdminCard key={p.id} pet={p} />
          ))}
          {ativos.length === 0 && (
            <p className="text-sm text-fg-muted">Nenhum pet ativo.</p>
          )}
        </div>
      </section>

      {/* Removidos */}
      {removidos.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-danger-fg">
            Removidos ({removidos.length})
          </h2>
          <div className="space-y-2">
            {removidos.map((p) => (
              <PetAdminCard key={p.id} pet={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PetAdminCard({ pet: p }: { pet: PetRow }) {
  const statusClass = STATUS_CLASSES[p.status] ?? STATUS_CLASSES.active;
  const isRemoved = p.status === "removed";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 ${
        isRemoved
          ? "border-danger/20 bg-danger/5 opacity-60"
          : "border-white/10 bg-ink-700/40"
      }`}
    >
      {/* Foto */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-800">
        {p.photo_url ? (
          <Image
            src={p.photo_url}
            alt={p.name ?? "Pet"}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawPrint className="h-5 w-5 text-brand-500/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-fg">
            {p.name ?? "Sem nome"}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${statusClass}`}
          >
            {p.status}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-fg-subtle">
            {KIND_LABEL[p.kind]} · {SPECIES_LABEL[p.species]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-fg-muted">
          {p.neighborhood}, {p.city} · {formatRelativeDate(p.created_at)}
        </p>
        {p.contact_phone && (
          <p className="mt-0.5 text-xs text-fg-subtle">
            Contato: {p.contact_phone}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex shrink-0 flex-col gap-1.5">
        <Link
          href={`/pets/${p.id}`}
          target="_blank"
          className="inline-flex items-center gap-1 rounded border border-white/10 px-2.5 py-1 text-xs text-fg-muted hover:text-fg"
        >
          <ExternalLink className="h-3 w-3" />
          Ver
        </Link>

        {!isRemoved ? (
          <form
            action={async () => {
              "use server";
              await removerPetAction(p.id);
            }}
          >
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1 rounded bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger-fg hover:bg-danger/25"
            >
              <Trash2 className="h-3 w-3" />
              Remover
            </button>
          </form>
        ) : (
          <form
            action={async () => {
              "use server";
              await reativarPetAction(p.id);
            }}
          >
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1 rounded bg-success/15 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/25"
            >
              <RotateCcw className="h-3 w-3" />
              Reativar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
