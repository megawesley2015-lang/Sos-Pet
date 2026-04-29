/**
 * Email Service — SOS Pet
 * Usa a API REST do Resend diretamente (sem pacote extra).
 *
 * Configuração necessária em .env.local / Vercel:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   RESEND_FROM=SOS Pet <noreply@sospet.com.br>
 *
 * Se RESEND_API_KEY não estiver configurada, as funções retornam
 * { success: false } silenciosamente — não quebra o fluxo principal.
 *
 * DÍVIDA TÉCNICA: Em produção real, adicionar fila de emails (retry)
 * e um domínio verificado no Resend para evitar cair em spam.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM ?? "SOS Pet <noreply@project-uobep.vercel.app>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://project-uobep.vercel.app";

// ─── Base ────────────────────────────────────────────────────

interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(opts: SendOptions): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY não configurada — email ignorado.");
    return { success: false, error: "API key ausente" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] Erro ao enviar:", msg);
    return { success: false, error: msg };
  }
}

// ─── Helpers de layout ────────────────────────────────────────

function wrap(content: string, accentColor = "#f97316"): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f1117; font-family: system-ui, -apple-system, sans-serif; color: #e5e7eb; }
    .wrap { max-width: 580px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #1a1d27; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,.08); }
    .header { background: ${accentColor}; padding: 28px 32px; text-align: center; }
    .header h1 { font-size: 22px; font-weight: 800; color: white; letter-spacing: -.3px; }
    .body { padding: 32px; }
    .body h2 { font-size: 18px; font-weight: 700; color: #f9fafb; margin-bottom: 12px; }
    .body p { font-size: 14px; line-height: 1.7; color: #9ca3af; margin-bottom: 12px; }
    .body strong { color: #f9fafb; }
    .btn { display: inline-block; background: ${accentColor}; color: white; padding: 12px 28px;
           text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;
           margin-top: 20px; }
    .info-box { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
                border-radius: 10px; padding: 16px; margin: 16px 0; }
    .info-box p { margin: 0; }
    .footer { text-align: center; padding: 20px 32px; font-size: 12px; color: #6b7280; }
    .footer a { color: #f97316; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header"><h1>🐾 SOS Pet</h1></div>
      <div class="body">${content}</div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOS Pet — Baixada Santista</p>
      <p><a href="${BASE_URL}">sospet.com.br</a> · Você recebeu este email por ter um registro ativo.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Templates ────────────────────────────────────────────────

/**
 * Notifica o tutor que alguém avistou seu pet perdido.
 */
export async function notificarAvistamento(opts: {
  tutorEmail: string;
  tutorNome: string | null;
  petNome: string | null;
  petId: string;
  address: string | null;
  description: string | null;
  createdAt: string;
}): Promise<SendResult> {
  const nome = opts.tutorNome ?? "Tutor";
  const pet = opts.petNome ?? "seu pet";
  const local = opts.address
    ? opts.address.split(",").slice(0, 3).join(",").trim()
    : "localização registrada";
  const data = new Date(opts.createdAt).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const html = wrap(
    `<h2>👀 Novo avistamento de ${pet}!</h2>
     <p>Olá, <strong>${nome}</strong>!</p>
     <p>Alguém acabou de reportar um avistamento do seu pet na plataforma SOS Pet.</p>
     <div class="info-box">
       <p>📍 <strong>Local:</strong> ${local}</p>
       ${opts.description ? `<p style="margin-top:8px">💬 <strong>Observação:</strong> ${opts.description}</p>` : ""}
       <p style="margin-top:8px">🕐 <strong>Data:</strong> ${data}</p>
     </div>
     <p>Acesse a página do pet para ver todos os detalhes e o mapa com a localização exata.</p>
     <a href="${BASE_URL}/pets/${opts.petId}" class="btn">Ver avistamento →</a>`,
    "#06b6d4"
  );

  return sendEmail({
    to: opts.tutorEmail,
    subject: `👀 Avistamento de ${pet} registrado no SOS Pet`,
    html,
    text: `Novo avistamento de ${pet} em ${local} em ${data}. Acesse: ${BASE_URL}/pets/${opts.petId}`,
  });
}

/**
 * Confirma para o tutor que o pet foi cadastrado com sucesso.
 */
export async function confirmarCadastroPet(opts: {
  tutorEmail: string;
  tutorNome: string | null;
  petNome: string | null;
  petId: string;
  kind: "lost" | "found";
}): Promise<SendResult> {
  const nome = opts.tutorNome ?? "Tutor";
  const pet = opts.petNome ?? "seu pet";
  const isLost = opts.kind === "lost";

  const html = wrap(
    `<h2>${isLost ? "🔴 Pet perdido cadastrado" : "🟢 Pet encontrado cadastrado"}</h2>
     <p>Olá, <strong>${nome}</strong>!</p>
     <p>O registro de <strong>${pet}</strong> foi publicado com sucesso na rede SOS Pet.</p>
     ${isLost
       ? `<p>Não desanime! Compartilhe o link abaixo nas suas redes sociais e grupos de WhatsApp para aumentar as chances de reencontro.</p>`
       : `<p>Obrigado por ajudar! O tutor poderá entrar em contato pelo telefone que você informou.</p>`
     }
     <a href="${BASE_URL}/pets/${opts.petId}" class="btn">Ver registro →</a>`,
    isLost ? "#ef4444" : "#22c55e"
  );

  return sendEmail({
    to: opts.tutorEmail,
    subject: `${isLost ? "🔴 Pet perdido" : "🟢 Pet encontrado"} cadastrado — SOS Pet`,
    html,
    text: `${pet} foi cadastrado com sucesso. Acesse: ${BASE_URL}/pets/${opts.petId}`,
  });
}

/**
 * Notifica o prestador que seu cadastro foi recebido e está em análise.
 */
export async function notificarCadastroPrestadorRecebido(opts: {
  email: string;
  nome: string;
  nomeNegocio: string;
}): Promise<SendResult> {
  const html = wrap(
    `<h2>🎉 Cadastro recebido!</h2>
     <p>Olá, <strong>${opts.nome}</strong>!</p>
     <p>Recebemos o cadastro de <strong>${opts.nomeNegocio}</strong> com sucesso!</p>
     <div class="info-box">
       <p>📋 <strong>Próximos passos:</strong></p>
       <p style="margin-top:8px">1. Nossa equipe analisará os dados</p>
       <p style="margin-top:4px">2. Entraremos em contato se necessário</p>
       <p style="margin-top:4px">3. Seu perfil será ativado em até <strong>48 horas úteis</strong></p>
     </div>
     <p>Obrigado por fazer parte do SOS Pet!</p>`,
    "#f97316"
  );

  return sendEmail({
    to: opts.email,
    subject: "🎉 Cadastro recebido — SOS Pet",
    html,
    text: `Recebemos o cadastro de ${opts.nomeNegocio}. Análise em até 48 horas úteis.`,
  });
}

/**
 * Notifica o prestador que seu cadastro foi aprovado.
 */
export async function notificarPrestadorAprovado(opts: {
  email: string;
  nome: string;
  nomeNegocio: string;
  slug: string;
}): Promise<SendResult> {
  const html = wrap(
    `<h2>✅ Cadastro aprovado!</h2>
     <p>Olá, <strong>${opts.nome}</strong>!</p>
     <p>Ótima notícia! O cadastro de <strong>${opts.nomeNegocio}</strong> foi <strong>aprovado</strong> e já está visível na plataforma SOS Pet.</p>
     <p>Agora tutores da Baixada Santista podem encontrar e entrar em contato com seu negócio.</p>
     <a href="${BASE_URL}/prestadores/${opts.slug}" class="btn">Ver meu perfil →</a>`,
    "#22c55e"
  );

  return sendEmail({
    to: opts.email,
    subject: "✅ Cadastro aprovado — SOS Pet",
    html,
    text: `${opts.nomeNegocio} foi aprovado! Veja seu perfil: ${BASE_URL}/prestadores/${opts.slug}`,
  });
}

/**
 * Notifica o prestador que seu cadastro foi rejeitado.
 */
export async function notificarPrestadorRejeitado(opts: {
  email: string;
  nome: string;
  nomeNegocio: string;
}): Promise<SendResult> {
  const html = wrap(
    `<h2>Cadastro não aprovado</h2>
     <p>Olá, <strong>${opts.nome}</strong>.</p>
     <p>Infelizmente o cadastro de <strong>${opts.nomeNegocio}</strong> não foi aprovado nesta análise.</p>
     <p>Se acredita que houve um engano ou deseja mais informações, entre em contato pelo email abaixo respondendo esta mensagem.</p>
     <p>Agradecemos o interesse!</p>`,
    "#6b7280"
  );

  return sendEmail({
    to: opts.email,
    subject: "Atualização do seu cadastro — SOS Pet",
    html,
    text: `O cadastro de ${opts.nomeNegocio} não foi aprovado. Responda este email para mais informações.`,
  });
}
