import Link from "next/link";
import { ArrowRight, Bell, MapPin } from "lucide-react";

/**
 * Alerta por bairro — seção de engajamento.
 *
 * Honesto por design: não promete push que ainda não roda. Convida a criar
 * conta e escolher a cidade pra acompanhar os pets perdidos perto de você.
 * O backend de notificação geográfica é uma fase posterior dedicada.
 */
export function AlertaBairro() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-warm-50 p-8 sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">
                <Bell className="h-3 w-3" />
                Fique de olho no seu bairro
              </span>
              <h2 className="mt-4 font-display text-2xl font-black leading-tight text-fg sm:text-3xl">
                Um pet sumiu perto de você?
                <br />
                <span className="text-brand-600">Quanto mais olhos, melhor.</span>
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-fg-muted">
                Crie sua conta, escolha sua cidade e acompanhe os pets perdidos
                da sua região. Vizinho que fica atento é o que mais faz pet
                voltar pra casa.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/registro"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 active:scale-95"
                >
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/mapa"
                  className="inline-flex items-center gap-2 rounded-xl border border-warm-200 bg-white px-5 py-3 text-sm font-bold text-fg transition-all hover:border-brand-200 hover:text-brand-600 active:scale-95"
                >
                  <MapPin className="h-4 w-4" strokeWidth={2.2} />
                  Ver o mapa
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <span className="ping-teal absolute inset-0" aria-hidden />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 text-accent-text">
                  <MapPin className="h-12 w-12" strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
