import { createServiceClient } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Camera, CheckCircle2, XCircle, MapPin, Phone, RefreshCw } from "lucide-react";
import {
  verificarSentinelaAction,
  desativarSentinelaAction,
  reativarSentinelaAction,
} from "./actions";
import type { Metadata } from "next";

export const revalidate = 30;
export const metadata: Metadata = { title: "Admin — Rede Sentinela" };

const TYPE_LABELS: Record<string, string> = {
  pet_shop:    "Pet Shop",
  vet:         "Clínica Vet",
  condo:       "Condomínio",
  market:      "Mercado",
  pharmacy:    "Farmácia",
  gas_station: "Posto",
  school:      "Escola",
  park:        "Parque",
  other:       "Outro",
};

export default async function AdminSentinelaPage() {
  // Guard admin
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await authClient
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "admin") redirect("/");

  const supabase = createServiceClient();
  const { data: partners } = await supabase
    .from("sentinel_partners")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const lista = partners ?? [];
  const pendentes  = lista.filter((p) => !p.verified && p.is_active);
  const verificados = lista.filter((p) => p.verified && p.is_active);
  const inativos   = lista.filter((p) => !p.is_active);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Rede Sentinela</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {lista.length} cadastros · {pendentes.length} aguardando verificação ·{" "}
          {verificados.length} verificados
        </p>
      </div>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-400">
            Aguardando verificação ({pendentes.length})
          </h2>
          <div className="space-y-3">
            {pendentes.map((p) => (
              <SentinelaCard key={p.id} partner={p} showVerify showDeactivate />
            ))}
          </div>
        </section>
      )}

      {/* Verificados */}
      {verificados.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-success">
            Verificados ({verificados.length})
          </h2>
          <div className="space-y-2">
            {verificados.map((p) => (
              <SentinelaCard key={p.id} partner={p} showDeactivate />
            ))}
          </div>
        </section>
      )}

      {/* Inativos */}
      {inativos.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-fg-subtle">
            Desativados ({inativos.length})
          </h2>
          <div className="space-y-2">
            {inativos.map((p) => (
              <SentinelaCard key={p.id} partner={p} showReactivate />
            ))}
          </div>
        </section>
      )}

      {lista.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-ink-800 p-8 text-center text-fg-muted">
          Nenhum cadastro ainda.
        </div>
      )}
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────

type Partner = {
  id: string;
  name: string;
  type: string;
  city: string;
  neighborhood?: string | null;
  address?: string | null;
  contact_phone?: string | null;
  has_cameras: boolean;
  verified: boolean;
  is_active: boolean;
  latitude: number;
  longitude: number;
  created_at: string;
};

function SentinelaCard({
  partner: p,
  showVerify,
  showDeactivate,
  showReactivate,
}: {
  partner: Partner;
  showVerify?: boolean;
  showDeactivate?: boolean;
  showReactivate?: boolean;
}) {
  const date = new Date(p.created_at).toLocaleDateString("pt-BR");

  return (
    <div className="rounded-xl border border-white/10 bg-ink-800 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-fg">{p.name}</span>
            <span className="rounded-full bg-ink-700 px-2 py-0.5 text-[11px] text-fg-subtle">
              {TYPE_LABELS[p.type] ?? p.type}
            </span>
            {p.has_cameras && (
              <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300">
                <Camera className="h-3 w-3" /> Câmeras
              </span>
            )}
            {p.verified && (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] text-success">
                <CheckCircle2 className="h-3 w-3" /> Verificado
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-fg-muted">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[p.neighborhood, p.city].filter(Boolean).join(", ")}
            </span>
            {p.contact_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {p.contact_phone}
              </span>
            )}
            <span className="font-mono text-[11px] text-fg-subtle">
              {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
            </span>
            <span className="text-fg-subtle">{date}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {showVerify && (
            <form action={verificarSentinelaAction.bind(null, p.id)}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success hover:bg-success/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Verificar
              </button>
            </form>
          )}
          {showDeactivate && (
            <form action={desativarSentinelaAction.bind(null, p.id)}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-700 px-3 py-1.5 text-xs font-bold text-fg-muted hover:text-red-400"
              >
                <XCircle className="h-3.5 w-3.5" /> Desativar
              </button>
            </form>
          )}
          {showReactivate && (
            <form action={reativarSentinelaAction.bind(null, p.id)}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reativar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
