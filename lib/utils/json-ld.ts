/**
 * Serializa um objeto JSON-LD de forma segura para injeção em <script>.
 *
 * `JSON.stringify` NÃO escapa `<`, `>` nem `&`. Se o objeto contém dados
 * controlados pelo usuário (nome/descrição de pet, descrição de prestador),
 * uma string como `</script><script>...` quebraria o bloco e executaria JS
 * arbitrário (XSS).
 *
 * Escapamos esses três caracteres pelos seus escapes unicode — o JSON continua
 * válido e o navegador renderiza o conteúdo original, mas o parser de HTML
 * nunca enxerga uma tag `</script>`.
 */
const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
};

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&]/g, (char) => ESCAPES[char] ?? char);
}
