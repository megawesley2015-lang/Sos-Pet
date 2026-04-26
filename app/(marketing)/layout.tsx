import type { ReactNode } from "react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { AvisosTicker } from "@/components/marketing/AvisosTicker";
import { listAvisosAtivos } from "@/lib/services/avisos";

/**
 * Layout do grupo (marketing) — landing pública e páginas estáticas.
 *
 * Usa data-theme="light" no wrapper pra ativar a paleta warm
 * (CSS vars trocam dinamicamente via globals.css).
 *
 * O app autenticado e a listagem /pets continuam dark.
 */
export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const avisos = await listAvisosAtivos();

  return (
    <div data-theme="light" className="min-h-screen bg-warm-50 text-ink-900">
      <AvisosTicker avisos={avisos} />
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
