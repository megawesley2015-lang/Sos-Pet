/**
 * Funções auxiliares de manipulação de strings.
 * Usadas em páginas de SEO, URLs, etc.
 */

/**
 * Converte slug de URL (ex: "sao-paulo") em nome de cidade (ex: "São Paulo").
 */
export function slugToCity(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Converte nome de cidade (ex: "São Paulo") em slug de URL (ex: "sao-paulo").
 */
export function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Espaços para hífens
    .replace(/-+/g, "-"); // Múltiplos hífens para um único
}

/**
 * Capitaliza primeira letra de cada palavra (Title Case).
 */
export function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Capitaliza apenas a primeira letra de uma string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
