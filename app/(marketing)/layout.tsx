import type { ReactNode } from "react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { AvisosTicker } from "@/components/marketing/AvisosTicker";
import { listAvisosAtivos } from "@/lib/services/avisos";

/**
 * Layout do grupo (marketing) — landing pública e páginas estáticas.
 * Herda o tema do root (dark por padrão, togglável pelo usuário).
 */
export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const avisos = await listAvisosAtivos();

  return (
    <div data-theme="light" className="min-h-screen">
      <AvisosTicker avisos={avisos} />
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
