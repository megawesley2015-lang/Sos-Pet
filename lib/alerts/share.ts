/**
 * Web Share API com fallback de download.
 *
 * Suporte: iOS Safari ✓, Chrome Android ✓, Chrome desktop parcial.
 * Fallback baixa o PNG e instrui o user a compartilhar manualmente.
 */
import { downloadAlertImage } from "./generateImage";

export interface ShareAlertOptions {
  blob: Blob;
  filename: string;
  title?: string;
  text?: string;
}

export type ShareResult =
  | { method: "share"; ok: true }
  | { method: "download"; ok: true }
  | { method: "share"; ok: false; reason: string }
  | { method: "download"; ok: false; reason: string };

export async function shareAlertImage({
  blob,
  filename,
  title,
  text,
}: ShareAlertOptions): Promise<ShareResult> {
  const file = new File([blob], filename, { type: "image/png" });

  // navigator.canShare nem sempre existe (Safari antigo, Firefox)
  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: title ?? "SOS Pet",
        text: text ?? "Ajude a encontrar este pet!",
      });
      return { method: "share", ok: true };
    } catch (err) {
      // AbortError = user cancelou — não é falha real
      const reason = (err as Error)?.name ?? "unknown";
      if (reason === "AbortError") {
        return { method: "share", ok: false, reason: "cancelled" };
      }
      // Falhou por outra razão — tenta download
    }
  }

  try {
    downloadAlertImage(blob, filename);
    return { method: "download", ok: true };
  } catch (err) {
    return {
      method: "download",
      ok: false,
      reason: (err as Error)?.message ?? "unknown",
    };
  }
}
