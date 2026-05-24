import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrar avistamento",
  description: "Viu um pet perdido? Registre o avistamento e ajude o tutor a encontrá-lo.",
};

export default function NovoAvistamentoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
