import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Quanto custa pra cadastrar um pet perdido?",
    a: "Nada. Cadastrar e buscar é gratuito pra sempre. O SOS Pet nunca cobra de quem está procurando o pet — a plataforma se sustenta com prestadores parceiros e a loja de plaquinhas.",
  },
  {
    q: "Preciso criar conta pra avisar que vi um pet na rua?",
    a: "Não. Quem encontra um pet pode registrar um avistamento em segundos, sem login. Criar conta é só pra quem quer gerenciar os próprios anúncios.",
  },
  {
    q: "Meu telefone vai ficar exposto pra qualquer um?",
    a: "Não. Seu contato nunca aparece na listagem — só na página do pet, pra quem clica pra ajudar. Nada de número exposto pra robô coletar.",
  },
  {
    q: "Como funciona o cartaz SOS?",
    a: "Com a conta criada, você gera um cartaz pronto (formato story) com a foto, descrição e seu contato — pronto pra mandar no WhatsApp, Instagram ou imprimir e colar no bairro.",
  },
  {
    q: "O SOS Pet atende a minha cidade?",
    a: "A rede cobre as 9 cidades da Baixada Santista: Santos, Guarujá, São Vicente, Praia Grande, Cubatão, Bertioga, Mongaguá, Itanhaém e Peruíbe.",
  },
  {
    q: "Alguém pediu dinheiro pra devolver meu pet. É golpe?",
    a: "Quase sempre, sim. Quem realmente achou seu pet não exige pagamento antecipado. Nunca pague por PIX ou recarga, e exija foto/vídeo provando que está com o animal. Veja a página de Segurança pra todos os sinais de alerta.",
  },
];

export function FaqHome() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">
            Dúvidas frequentes
          </span>
          <h2 className="mt-4 font-display text-3xl font-black text-fg sm:text-4xl">
            Perguntas que todo mundo faz.
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-warm-200 bg-white px-5 py-4 shadow-warm-card transition-[border-color] open:border-brand-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-bold text-fg [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200 group-open:rotate-180"
                  strokeWidth={2.4}
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
