import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility para concatenar classes do Tailwind de forma segura.
 * Resolve conflitos (ex: "p-2 p-4" → "p-4") e aceita condicionais.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
