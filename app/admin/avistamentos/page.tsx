import Image from "next/image";
import Link from "next/link";
import { Eye, MapPin, ExternalLink, Trash2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SightingRow, PetRow } from "@/lib/types/database";
import { formatRelativeDate } from "@/lib/utils/format";
import { deletarAvistamentoAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Avistamentos" };

interface SightingWithPet extends SightingRow {
  pets: Pick<PetRow, "id" | "name" | "city" | "neighborhood"> | null;
}

export default async function AdminAvistamentosPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("sightings")
    .select("*, pets(id, name, city, neighborhood)")
    .order("created_at", { ascending: false })
    .limit(100);

  const lista = (data ?? []) as SightingWithPet[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Avistamentos</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {lista.length} {lista.length === 1 ? "avistamento registrado" : "avistamentos registrados"}
        </p>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-ink-700/40 p-10 text-center text-sm text-fg-muted">
          Nenhum avistamento registrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((s) => (
            <AvistamentoCard key={s.id} sighting={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function AvistamentoCard({ sighting: s }: { sighting: SightingWithPet }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink-700/40 p-3">
      {/* Foto do avistamento */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-800">
        {s.photo_url ? (
          <Image
            src={s.photo_url}
            alt="Avistamento"
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Eye className="h-5 w-5 text-fg-subtle/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-fg">
            {s.pets?.name ?? "Pet sem nome"}
          </span>
          {s.pets && (
            <span className="text-xs text-fg-muted">
              · {s.pets.neighborhood}, {s.pets.city}
            </span>
          )}
        </div>

        <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-muted">
          <MapPin className="h-3 w-3 shrink-0 text-brand-400" />
          <span className="line-clamp-1">
            {s.address
              ? s.address.split(",").slice(0, 3).join(",")
              : `${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}`}
          </span>
        </p>

        {s.description && (
          <p className="mt-1 line-clamp-1 text-xs text-fg-subtle italic">
            "{s.description}"
          </p>
        )}

        <p className="mt-1 text-[10px] text-fg-subtle">
          {formatRelativeDate(s.created_at)}
        </p>
      </div>

      {/* Ações */}
      <div className="flex shrink-0 flex-col gap-1.5">
        {s.pets && (
          <Link
            href={`/pets/${s.pets.id}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded border border-white/10 px-2.5 py-1 text-xs text-fg-muted hover:text-fg"
          >
            <ExternalLink className="h-3 w-3" />
            Ver pet
          </Link>
        )}

        <form
          action={async () => {
            "use server";
            await deletarAvistamentoAction(s.id);
          }}
        >
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1 rounded bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger-fg hover:bg-danger/25"
          >
            <Trash2 className="h-3 w-3" />
            Excluir
          </button>
        </form>
      </div>
    </div>
  );
}
