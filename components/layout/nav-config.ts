/**
 * Fonte única da navegação pública do SOS Pet.
 * Importado por NavLinks (desktop) e MobileNav (drawer) — manter aqui evita
 * divergência de itens/ordem entre as duas navegações.
 */

export interface NavLink {
  href: string;
  label: string;
}

/** Itens centrais — sempre visíveis no topo (desktop) e no topo do drawer. */
export const PRIMARY_LINKS: NavLink[] = [
  { href: "/pets",        label: "Achados & Perdidos" },
  { href: "/adotar",      label: "Adoção" },
  { href: "/mapa",        label: "Mapa" },
  { href: "/prestadores", label: "Prestadores" },
  { href: "/dicas",       label: "Dicas" },
];

/** Itens secundários — agrupados em "Mais" (desktop) e abaixo da divisória (drawer). */
export const SECONDARY_LINKS: NavLink[] = [
  { href: "/avistamentos", label: "Avistamentos" },
  { href: "/sentinela",    label: "Rede Sentinela" },
  { href: "/loja",         label: "Loja" },
  { href: "/parcerias",    label: "Parcerias" },
];

/** Verdadeiro quando href é a rota atual ou um prefixo dela. */
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || (href.length > 1 && pathname.startsWith(href + "/"));
}
