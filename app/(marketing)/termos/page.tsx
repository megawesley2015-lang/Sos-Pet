import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata = {
  title: "Termos de Uso — SOS Pet",
  description:
    "Termos e condições de uso da plataforma SOS Pet — Achados e Perdidos.",
};

/**
 * Termos de uso — placeholder do MVP.
 *
 * AVISO: Este texto é um placeholder. Antes de ir pra produção,
 * substituir por documento revisado por advogado especializado em LGPD
 * e e-commerce/SaaS. Pontos a cobrir formalmente:
 *  - Limitação de responsabilidade
 *  - Política de moderação e remoção de conteúdo
 *  - Foro / lei aplicável
 *  - Direitos sobre conteúdo enviado (fotos)
 */
export default function TermosPage() {
  const updatedAt = "25 de abril de 2026";

  return (
    <>
      <PageHeader
        eyebrow="Documentos"
        title="Termos de Uso"
        description={`Última atualização: ${updatedAt}`}
      />

      <article className="py-16">
        <div className="mx-auto max-w-2xl px-4">
          <Section title="1. Sobre a plataforma">
            O SOS Pet é uma plataforma colaborativa para registro e
            divulgação de pets perdidos e encontrados. Os registros são feitos
            por usuários e a plataforma serve como intermediária técnica para
            facilitar o reencontro entre pets e tutores.
          </Section>

          <Section title="2. Cadastro de pets">
            Qualquer pessoa pode cadastrar um pet (perdido ou encontrado),
            mesmo sem conta. Usuários autenticados podem editar e remover seus
            próprios registros. O conteúdo cadastrado é de responsabilidade do
            usuário que o publicou.
          </Section>

          <Section title="3. Conteúdo do usuário">
            Você é responsável pela veracidade das informações que publica
            (descrição, foto, contato, localização). É proibido cadastrar pets
            de terceiros sem autorização, usar fotos com direitos autorais ou
            publicar informações falsas.
          </Section>

          <Section title="4. Contato e privacidade">
            Ao cadastrar um pet, você concorda em exibir publicamente o nome
            de contato e telefone informados, exclusivamente na página do
            registro. Esses dados não são compartilhados com terceiros nem
            usados para outros fins. Veja mais na nossa{" "}
            <a href="/privacidade" className="text-brand-600 underline">
              Política de Privacidade
            </a>
            .
          </Section>

          <Section title="5. Moderação">
            Reservamos o direito de remover, sem aviso prévio, qualquer
            registro que: (a) viole estes Termos, (b) use linguagem ofensiva,
            (c) seja claramente falso ou (d) infrinja direitos de terceiros.
          </Section>

          <Section title="6. Limitação de responsabilidade">
            O SOS Pet é uma ferramenta de intermediação. Não nos
            responsabilizamos pela conduta dos usuários, pela autenticidade
            das informações publicadas, nem por eventuais negociações,
            promessas de recompensa ou conflitos entre tutor e encontrante.
          </Section>

          <Section title="7. Mudanças nos termos">
            Estes termos podem ser atualizados. Mudanças relevantes serão
            comunicadas por e-mail (para usuários cadastrados) e aviso na
            home. O uso continuado da plataforma após mudanças implica
            aceite.
          </Section>

          <Section title="8. Contato">
            Dúvidas, denúncias ou solicitações de remoção: contato@sospet.app
            (placeholder — substituir pelo canal real antes do go-live).
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
      <p className="text-sm leading-relaxed text-ink-700">{children}</p>
    </section>
  );
}
