/**
 * Geração e compartilhamento de cards de alerta SOS.
 *
 * Usa html-to-image (lazy import — economia de bundle inicial).
 *
 * Importante: o nó precisa estar no DOM (mesmo offscreen com position:absolute,
 * top:-9999px). html-to-image NÃO renderiza nodes detached.
 */

export async function generateAlertImage(node: HTMLElement): Promise<Blob> {
  // Lazy import — só carrega html-to-image quando o user dispara o SOS
  const { toPng } = await import("html-to-image");

  // pixelRatio 2 = retina-quality (~1200×1800 do card 600×900)
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    // Some images de Storage são CORS-controlled — esse skipFonts evita
    // tentar embed de fontes que não estão acessíveis
    skipFonts: true,
  });

  // dataURL → Blob
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Faz download local do PNG (fallback quando Web Share não disponível).
 */
export function downloadAlertImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
