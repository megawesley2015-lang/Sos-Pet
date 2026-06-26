import Link from "next/link";
import { Heart } from "lucide-react";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-warm-200/80 bg-warm-100/40 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="SOS Pet Aumigo — Achados e Perdidos"
              className="h-11 w-auto"
            />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-fg-muted">
            Uma rede colaborativa para reencontrar pets perdidos com seus
            tutores — rápido, simples e gratuito.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-700/70">
            Plataforma
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li>
              <Link href="/pets" className="hover:text-brand-600">
                Pets ativos
              </Link>
            </li>
            <li>
              <Link href="/adotar" className="hover:text-brand-600">
                ❤️ Adoção
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
            <li>
              <Link href="/loja" className="hover:text-brand-600">
                🛍️ Loja
              </Link>
            </li>
            <li>
              <Link href="/plaquinha" className="hover:text-brand-600">
                🐾 Plaquinha com QR Code
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-700/70">
            Sobre
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li>
              <Link href="/quem-somos" className="hover:text-brand-600">
                Quem somos
              </Link>
            </li>
            <li>
              <Link href="/seguranca" className="hover:text-brand-600">
                Segurança
              </Link>
            </li>
            <li>
              <Link href="/para-prestadores" className="hover:text-brand-600">
                Planos para prestadores
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-700/70">
            Legal
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
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

      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-warm-200/80 px-4 pt-6 text-xs text-fg-muted sm:flex-row">
        <p>© {year} SOS Pet Aumigo — Feito no Brasil.</p>
        <p className="flex items-center gap-1">
          Construído com <Heart className="h-3 w-3 text-brand-500" /> para
          quem ama bichos.
        </p>
      </div>
    </footer>
  );
}
