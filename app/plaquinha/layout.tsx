/**
 * Layout de /plaquinha — passthrough.
 *
 * Cada sub-página (page.tsx, sucesso/page.tsx, pendente/page.tsx)
 * gerencia seu próprio header (TopBar) e estrutura visual.
 * Um layout com MarketingHeader causava dupla barra de navegação.
 */
export default function PlaquinhaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
