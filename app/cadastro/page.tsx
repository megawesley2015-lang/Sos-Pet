import { redirect } from "next/navigation";

/**
 * /cadastro — redirect permanente para a nova rota de cadastro de prestador.
 *
 * A v2 usava /cadastro para o fluxo de registro de prestador.
 * O projeto atual usa /prestadores/novo — este redirect garante
 * que links antigos, bookmarks e referências externas não quebrem.
 */
export default function CadastroPage() {
  redirect("/prestadores/novo");
}
