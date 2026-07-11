import { MarketingHeader } from "./MarketingHeader";

/**
 * TopBar — alias do header unificado (claro/warm, igual ao mockup).
 *
 * Antes era um header dark separado e quase idêntico ao MarketingHeader.
 * Foi unificado para que o site inteiro use um único header consistente com o
 * mockup. Mantido como nome para não quebrar os ~30 imports existentes.
 */
export async function TopBar() {
  return <MarketingHeader />;
}
