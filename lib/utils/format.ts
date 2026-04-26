/**
 * Helpers de formatação — i18n pt-BR.
 */

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH} ${diffH === 1 ? "hora" : "horas"}`;
  if (diffD < 30) return `há ${diffD} ${diffD === 1 ? "dia" : "dias"}`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export function whatsappLink(phone: string, message?: string): string {
  const clean = phone.replace(/\D/g, "");
  const brPhone = clean.startsWith("55") ? clean : `55${clean}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${brPhone}${text}`;
}

export const SPECIES_LABEL: Record<string, string> = {
  dog: "Cão",
  cat: "Gato",
  other: "Outro",
};

export const KIND_LABEL: Record<string, string> = {
  lost: "Perdido",
  found: "Encontrado",
};

export const SIZE_LABEL: Record<string, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
};

export const SEX_LABEL: Record<string, string> = {
  male: "Macho",
  female: "Fêmea",
  unknown: "Não sei",
};
