import type { Metadata } from "next";
import { RegistroForm } from "./RegistroForm";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta gratuita no Pet Aumigo e gerencie seus registros de pets perdidos e encontrados.",
};

/**
 * /registro — Server Component wrapper.
 *
 * O RegistroForm usa useActionState (client), então fica separado.
 * Aqui só exportamos metadata e renderizamos o form.
 */
export default function RegistroPage() {
  return <RegistroForm />;
}
