import { Instagram, Siren, Heart, ArrowRight } from "lucide-react";

const INSTAGRAM_URL = "https://instagram.com/sospetaumigo";

/**
 * Comunidade no Instagram — dois "atalhos" da rede.
 *
 * Honesto por design: não inventa posts. Apresenta os dois fluxos da comunidade
 * (Pets perdidos / Momento fofura) e convida a marcar @sospetaumigo. A ingestão
 * automática das marcações (via n8n) é uma fase posterior.
 */
export function ComunidadeIG() {
  const streams = [
    {
      icon: Siren,
      teal: false,
      tag: "Pets perdidos",
      title: "Perdeu o pet? Marque a gente.",
      desc: "Poste a foto e marque @sospetaumigo. A gente ajuda a espalhar e o pet também entra na busca aqui na plataforma.",
    },
    {
      icon: Heart,
      teal: true,
      tag: "Momento fofura",
      title: "Reencontro, adoção, dia a dia.",
      desc: "As histórias felizes da rede: pets que voltaram pra casa, adoções e a fofura de sempre. Marque @sospetaumigo e apareça.",
    },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent-text">
            <Instagram className="h-3 w-3" />
            Comunidade
          </span>
          <h2 className="mt-4 font-display text-3xl font-black text-fg sm:text-4xl">
            A rede também vive no Instagram.
          </h2>
          <p className="mt-3 text-sm text-fg-muted">
            Dois fluxos, uma comunidade. Marque{" "}
            <span className="font-semibold text-accent-text">@sospetaumigo</span>{" "}
            e participe.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {streams.map((s) => (
            <div
              key={s.tag}
              className="rounded-2xl border border-warm-200 bg-white p-7 shadow-warm-card transition-[box-shadow,transform] duration-200 hover:shadow-warm-hover motion-safe:hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    s.teal
                      ? "bg-accent/10 text-accent-text"
                      : "bg-brand-500/10 text-brand-600"
                  }`}
                >
                  <s.icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                    s.teal
                      ? "bg-accent/10 text-accent-text"
                      : "bg-brand-100 text-brand-700"
                  }`}
                >
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-fg">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-white px-5 py-3 text-sm font-bold text-accent-text transition-all hover:bg-accent/5 active:scale-95"
          >
            <Instagram className="h-4 w-4" strokeWidth={2.2} />
            Seguir @sospetaumigo
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
