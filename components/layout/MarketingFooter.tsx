import Link from "next/link";
import { PawPrint, Heart } from "lucide-react";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-warm-200/80 bg-warm-100/40 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-100">
              <PawPrint className="h-4 w-4 text-brand-600" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold text-ink-900">
                SOS <span className="text-brand-500">Pet</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-brand-700/70">
                Achados &amp; Perdidos
              </span>
            </div>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-ink-700">
            Uma rede colaborativa para reencontrar pets perdidos com seus
            tutores — rápido, simples e gratuito.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-700/70">
            Plataforma
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-800">
            <li>
              <Link href="/pets" className="hover:text-brand-600">
                Pets ativos
              </Link>
            </li>
            <li>
              <Link href="/pets/novo" className="hover:text-brand-600">
                Cadastrar pet
              </Link>
            </li>
            <li>
              <Link href="/prestadores" className="hover:text-brand-600">
                Prestadores
              </Link>
            </li>
            <li>
              <Link href="/dicas" className="hover:text-brand-600">
                Dicas para tutores
              </Link>
            </li>
            <li>
              <Link href="/parcerias" className="hover:text-brand-600">
                Parcerias
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-700/70">
            Legal
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-800">
            <li>
              <Link href="/termos" className="hover:text-brand-600">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-brand-600">
                Política de privacidade
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-warm-200/80 px-4 pt-6 text-xs text-ink-700 sm:flex-row">
        <p>© {year} SOS Pet — Feito no Brasil.</p>
        <p className="flex items-center gap-1">
          Construído com <Heart className="h-3 w-3 text-brand-500" /> para
          quem ama bichos.
        </p>
      </div>
    </footer>
  );
}
