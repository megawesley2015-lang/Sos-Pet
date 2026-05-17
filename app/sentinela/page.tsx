import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { createServiceClient } from "@/lib/supabase/server";
import { Camera, MapPin, Phone, ShieldCheck, Plus } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rede Sentinela | SOS Pet",
  description:
    "Estabelecimentos parceiros da Rede Sentinela — pontos de apoio para localizar pets perdidos.",
};

const TYPE_LABELS: Record<string, string> = {
  pet_shop:    "Pet Shop",
  vet:         "Clínica Veterinária",
  condo:       "Condomínio",
  market:      "Mercado",
  pharmacy:    "Farmácia",
  gas_station: "Posto de Gasolina",
  school:      "Escola",
  park:        "Parque",
  other:       "Outro",
};

export default async function SentinelaPage() {
  const supabase = createServiceClient();

  const { data: sentinels } = await supabase
    .from("sentinel_partners")
    .select("id, name, type, address, neighborhood, city, has_cameras, verified, contact_phone, created_at")
    .eq("is_active", true)
    .order("verified", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const partners = sentinels ?? [];
  const verified   = partners.filter((p) => p.verified);
  const unverified = partners.filter((p) => !p.verified);

  return (
    <div className="min-h-screen bg-ink-800 bg-radial-brand">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-fg">
              Rede <span className="text-cyan-400">Sentinela</span>
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              {partners.length} estabelecimento{partners.length !== 1 ? "s" : ""} na rede ·{" "}
              {verified.length} verificado{verified.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/sentinela/novo"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Cadastrar estabelecimento
          </Link>
        </div>

        {partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-ink-700/60 p-16 text-center">
            <Camera className="mb-4 h-12 w-12 text-fg-subtle" />
            <h2 className="font-display text-xl font-bold text-fg mb-2">
              Nenhum parceiro ainda
            </h2>
            <p className="mb-6 text-sm text-fg-muted max-w-sm">
              Seja o primeiro estabelecimento a integrar a Rede Sentinela na sua cidade!
            </p>
            <Link
              href="/sentinela/novo"
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
            >
              Cadastrar agora
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/8 bg-ink-700/60 px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  {/* Ícone câmera */}
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    p.has_cameras
                      ? "border-cyan-500/40 bg-cyan-500/10"
                      : "border-white/10 bg-ink-800"
                  }`}>
                    <Camera className={`h-4 w-4 ${p.has_cameras ? "text-cyan-400" : "text-fg-subtle"}`} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-fg">{p.name}</span>
                      {p.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                          <ShieldCheck className="h-3 w-3" /> Verificado
                        </span>
                      )}
                      {p.has_cameras && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          📷 Câmeras
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-fg-muted">
                      {TYPE_LABELS[p.type] ?? p.type}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-fg-subtle">
                      {(p.neighborhood || p.city) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.neighborhood ? `${p.neighborhood}, ` : ""}{p.city}
                        </span>
                      )}
                      {p.address && <span>{p.address}</span>}
                    </div>
                  </div>
                </div>

                {p.contact_phone && (
                  <a
                    href={`tel:${p.contact_phone}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs font-medium text-fg-muted hover:text-fg"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {p.contact_phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA rodapé */}
        {partners.length > 0 && (
          <div className="mt-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 text-center">
            <p className="text-sm text-fg-muted mb-3">
              Seu estabelecimento ainda não está na rede?
            </p>
            <Link
              href="/sentinela/novo"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
            >
              <Plus className="h-4 w-4" />
              Cadastrar agora — é gratuito
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
