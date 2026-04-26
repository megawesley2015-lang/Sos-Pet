import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata = {
  title: "Política de Privacidade — SOS Pet",
  description:
    "Como coletamos, usamos e protegemos seus dados na plataforma SOS Pet.",
};

/**
 * Política de privacidade — placeholder do MVP.
 *
 * AVISO: Substituir por documento revisado por especialista em LGPD antes
 * de campanha pública / processamento de dados em larga escala.
 */
export default function PrivacidadePage() {
  const updatedAt = "25 de abril de 2026";

  return (
    <>
      <PageHeader
        eyebrow="Documentos"
        title="Política de Privacidade"
        description={`Última atualização: ${updatedAt}`}
      />

      <article className="py-16">
        <div className="mx-auto max-w-2xl px-4">
          <Section title="Resumo (TL;DR)">
            Você publica informações sobre um pet (nome, foto, descrição,
            contato). Quem visita o site vê essas informações pra te ajudar a
            reencontrar o bicho. A gente armazena os dados no Supabase
            (servidor seguro), não vende pra ninguém e você pode pedir pra
            apagar a qualquer momento.
          </Section>

          <Section title="1. Dados que coletamos">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Cadastro de pet:</strong> nome do pet (opcional),
                espécie, descrição, foto, bairro, cidade, data, nome do
                contato e telefone.
              </li>
              <li>
                <strong>Conta de usuário:</strong> e-mail, senha (criptografada),
                nome, e opcionalmente avatar.
              </li>
              <li>
                <strong>Logs técnicos:</strong> endereço IP e user-agent dos
                acessos (mantidos por até 90 dias para segurança e prevenção
                de abuso).
              </li>
            </ul>
          </Section>

          <Section title="2. Como usamos">
            Usamos os dados <strong>exclusivamente</strong> para o propósito
            da plataforma: exibir registros publicamente para facilitar
            reencontros. O contato (nome + telefone) é exibido na página
            individual do pet, não em listagens nem em buscadores externos.
          </Section>

          <Section title="3. Quem tem acesso">
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Você:</strong> seus registros podem ser editados e
                removidos a qualquer momento na sua área logada.
              </li>
              <li>
                <strong>Visitantes:</strong> qualquer pessoa pode visualizar
                pets ativos. Esse é o ponto.
              </li>
              <li>
                <strong>Terceiros:</strong> não compartilhamos, vendemos ou
                cedemos seus dados para anunciantes, parceiros comerciais ou
                qualquer outra entidade — exceto se exigido por ordem
                judicial.
              </li>
            </ul>
          </Section>

          <Section title="4. Onde os dados são armazenados">
            Banco de dados, autenticação e storage de imagens em{" "}
            <strong>Supabase</strong> (infraestrutura na AWS, regiões US/EU).
            Hospedagem da aplicação na <strong>Vercel</strong>. Ambos são
            provedores compatíveis com GDPR/LGPD.
          </Section>

          <Section title="5. Cookies">
            Usamos apenas cookies essenciais para manter sua sessão de login.
            Não usamos cookies de tracking, analytics agressivos ou
            publicidade.
          </Section>

          <Section title="6. Seus direitos (LGPD)">
            Você tem direito a: acessar seus dados, corrigi-los, solicitar
            exclusão, exportá-los e revogar consentimento. Para qualquer
            solicitação, escreva pra contato@sospet.app (placeholder).
            Respondemos em até 15 dias úteis.
          </Section>

          <Section title="7. Mudanças nesta política">
            Quando essa política mudar, comunicamos por e-mail (usuários
            cadastrados) e mostramos um aviso no site. A versão vigente
            sempre fica acessível neste endereço.
          </Section>

          <Section title="8. Contato do controlador">
            Responsável pelo tratamento: SOS Pet (placeholder — substituir
            por razão social e CNPJ reais quando constituir a entidade).
            E-mail de contato: contato@sospet.app
          </Section>
        </div>
      </article>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 font-display text-xl font-bold text-ink-900">
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-ink-700">{children}</div>
    </section>
  );
}
