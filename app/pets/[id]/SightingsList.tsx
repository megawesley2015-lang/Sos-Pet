import Image from "next/image";
import { MapPin, Eye } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SightingRow } from "@/lib/types/database";
import { formatRelativeDate } from "@/lib/utils/format";
import SightingButton from "./SightingButton";

interface Props {
  petId: string;
  petName: string;
}

export default async function SightingsList({ petId, petName }: Props) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("sightings")
    .select("*")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false })
    .limit(10);

  const sightings = (data ?? []) as SightingRow[];

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-fg-muted">
            Avistamentos
          </h2>
          {sightings.length > 0 && (
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-400">
              {sightings.length}
            </span>
          )}
        </div>

        <SightingButton petId={petId} petName={petName} />
      </div>

      {sightings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-ink-800/30 p-6 text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-fg-subtle/40" />
          <p className="text-sm text-fg-muted">Nenhum avistamento ainda.</p>
          <p className="mt-1 text-xs text-fg-subtle">
            Se você viu este pet, clique em &quot;Reportar avistamento&quot; e ajude no resgate!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sightings.map((s) => (
            <SightingCard key={s.id} sighting={s} />
          ))}
        </div>
      )}
    </section>
  );
}

function SightingCard({ sighting: s }: { sighting: SightingRow }) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/8 bg-ink-800/40 p-3">
      {/* Foto */}
      {s.photo_url && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-700">
          <Image
            src={s.photo_url}
            alt="Foto do avistamento"
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-xs text-fg-muted">
          <MapPin className="h-3 w-3 shrink-0 text-brand-400" />
          <span className="line-clamp-1">
            {s.address
              ? s.address.split(",").slice(0, 3).join(",")
              : `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`}
          </span>
        </p>

        {s.description && (
          <p className="mt-1 line-clamp-2 text-xs text-fg">{s.description}</p>
        )}

        <p className="mt-1 text-[10px] text-fg-subtle">
          {formatRelativeDate(s.created_at)}
        </p>
      </div>
    </div>
  );
}
