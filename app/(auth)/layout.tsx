import type { ReactNode } from "react";

/**
 * Layout do grupo (auth) — sem TopBar, página inteira é o card.
 * Tema dark herdado do root layout.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
