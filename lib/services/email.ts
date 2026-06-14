/**
 * Email Service — Pet Aumigo
 * Usa a API REST do Resend diretamente (sem pacote extra).
 *
 * Configuração necessária em .env.local / Vercel:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   RESEND_FROM=Pet Aumigo <noreply@aumigo.com.br>
 *
 * Se RESEND_API_KEY não estiver configurada, as funções retornam
 * { success: false } silenciosamente — não quebra o fluxo principal.
 *
 * DÍVIDA TÉCNICA: Em produção real, adicionar fila de emails (retry)
 * e um domínio verificado no Resend para evitar cair em spam.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM ?? "Pet Aumigo <noreply@aumigo.com.br>";
// Prioridade: NEXT_PUBLIC_SITE_URL (setada na Vercel) > NEXT_PUBLIC_BASE_URL (legado) > fallback local
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "http://localhost:3000";

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeText(value: string | null | undefined): string {
  return escapeHtml(value?.trim() ?? "");
}

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
      <div class="header"><h1>🐾 Pet Aumigo</h1></div>
      <div class="body">${content}</div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Pet Aumigo — Baixada Santista</p>
      <p><a href="${BASE_URL}">aumigo.com.br</a> · Você recebeu este email por ter um registro ativo.</p>
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
  const nome = sanitizeText(opts.tutorNome ?? "Tutor");
  const pet = sanitizeText(opts.petNome ?? "seu pet");
  const local = opts.address
    ? sanitizeText(opts.address.split(",").slice(0, 3).join(",").trim())
    : "localização registrada";
  const observacao = opts.description ? sanitizeText(opts.description) : "";
  const data = new Date(opts.createdAt).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const petId = encodeURIComponent(opts.petId);

  const html = wrap(
    `<h2>👀 Novo avistamento de ${pet}!</h2>
     <p>Olá, <strong>${nome}</strong>!</p>
     <p>Alguém acabou de reportar um avistamento do seu pet na plataforma Pet Aumigo.</p>
     <div class="info-box">
       <p>📍 <strong>Local:</strong> ${local}</p>
       ${observacao ? `<p style="margin-top:8px">💬 <strong>Observação:</strong> ${observacao}</p>` : ""}
       <p style="margin-top:8px">🕐 <strong>Data:</strong> ${data}</p>
     </div>
     <p>Acesse a página do pet para ver todos os detalhes e o mapa com a localização exata.</p>
     <a href="${BASE_URL}/pets/${petId}" class="btn">Ver avistamento →</a>`,
    "#06b6d4"
  );

  return sendEmail({
    to: opts.tutorEmail,
    subject: `👀 Avistamento de ${pet} registrado no Pet Aumigo`,
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
  const nome = sanitizeText(opts.tutorNome ?? "Tutor");
  const pet = sanitizeText(opts.petNome ?? "seu pet");
  const isLost = opts.kind === "lost";
  const petId = encodeURIComponent(opts.petId);

  const html = wrap(
    `<h2>${isLost ? "🔴 Pet perdido cadastrado" : "🟢 Pet encontrado cadastrado"}</h2>
     <p>Olá, <strong>${nome}</strong>!</p>
     <p>O registro de <strong>${pet}</strong> foi publicado com sucesso na rede Pet Aumigo.</p>
     ${isLost
       ? `<p>Não desanime! Compartilhe o link abaixo nas suas redes sociais e grupos de WhatsApp para aumentar as chances de reencontro.</p>`
       : `<p>Obrigado por ajudar! O tutor poderá entrar em contato pelo telefone que você informou.</p>`
     }
     <a href="${BASE_URL}/pets/${petId}" class="btn">Ver registro →</a>`,
    isLost ? "#ef4444" : "#22c55e"
  );

  return sendEmail({
    to: opts.tutorEmail,
    subject: `${isLost ? "🔴 Pet perdido" : "🟢 Pet encontrado"} cadastrado — Pet Aumigo`,
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
  const nome = sanitizeText(opts.nome);
  const nomeNegocio = sanitizeText(opts.nomeNegocio);

  const html = wrap(
    `<h2>🎉 Cadastro recebido!</h2>
     <p>Olá, <strong>${nome}</strong>!</p>
     <p>Recebemos o cadastro de <strong>${nomeNegocio}</strong> com sucesso!</p>
     <div class="info-box">
       <p>📋 <strong>Próximos passos:</strong></p>
       <p style="margin-top:8px">1. Nossa equipe analisará os dados</p>
       <p style="margin-top:4px">2. Entraremos em contato se necessário</p>
       <p style="margin-top:4px">3. Seu perfil será ativado em até <strong>48 horas úteis</strong></p>
     </div>
     <p>Obrigado por fazer parte do Pet Aumigo!</p>`,
    "#f97316"
  );

  return sendEmail({
    to: opts.email,
    subject: "🎉 Cadastro recebido — Pet Aumigo",
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
  const nome = sanitizeText(opts.nome);
  const nomeNegocio = sanitizeText(opts.nomeNegocio);
  const slug = encodeURIComponent(opts.slug);

  const html = wrap(
    `<h2>✅ Cadastro aprovado!</h2>
     <p>Olá, <strong>${nome}</strong>!</p>
     <p>Ótima notícia! O cadastro de <strong>${nomeNegocio}</strong> foi <strong>aprovado</strong> e já está visível na plataforma Pet Aumigo.</p>
     <p>Agora tutores da Baixada Santista podem encontrar e entrar em contato com seu negócio.</p>
     <a href="${BASE_URL}/prestadores/${slug}" class="btn">Ver meu perfil →</a>`,
    "#22c55e"
  );

  return sendEmail({
    to: opts.email,
    subject: "✅ Cadastro aprovado — Pet Aumigo",
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
  const nome = sanitizeText(opts.nome);
  const nomeNegocio = sanitizeText(opts.nomeNegocio);

  const html = wrap(
    `<h2>Cadastro não aprovado</h2>
     <p>Olá, <strong>${nome}</strong>.</p>
     <p>Infelizmente o cadastro de <strong>${nomeNegocio}</strong> não foi aprovado nesta análise.</p>
     <p>Se acredita que houve um engano ou deseja mais informações, entre em contato pelo email abaixo respondendo esta mensagem.</p>
     <p>Agradecemos o interesse!</p>`,
    "#6b7280"
  );

  return sendEmail({
    to: opts.email,
    subject: "Atualização do seu cadastro — Pet Aumigo",
    html,
    text: `O cadastro de ${opts.nomeNegocio} não foi aprovado. Responda este email para mais informações.`,
  });
}

/**
 * Notifica o parceiro (lead form em /parcerias) que sua solicitação foi aprovada.
 * Aprovação aqui = "vamos seguir conversando" — não cria conta, apenas marca status.
 */
export async function notificarParceiroAprovado(opts: {
  email: string;
  nome: string;
  empresa: string | null;
}): Promise<SendResult> {
  const nome = sanitizeText(opts.nome);
  const empresa = sanitizeText(opts.empresa ?? "");

  const html = wrap(
    `<h2>✅ Sua solicitação de parceria foi aprovada!</h2>
     <p>Olá, <strong>${nome}</strong>!</p>
     <p>Boa notícia: a solicitação de parceria${empresa ? ` da <strong>${empresa}</strong>` : ""} foi aprovada e vamos seguir conversando.</p>
     <p>Em breve nossa equipe entra em contato pelo email cadastrado para alinhar os próximos passos da parceria.</p>
     <p>Obrigado pelo interesse no Pet Aumigo!</p>`,
    "#22c55e"
  );

  return sendEmail({
    to: opts.email,
    subject: "✅ Solicitação de parceria aprovada — Pet Aumigo",
    html,
    text: `Olá ${opts.nome}, sua solicitação de parceria foi aprovada. Vamos entrar em contato em breve.`,
  });
}

/**
 * Notifica o parceiro que sua solicitação não foi aprovada.
 */
export async function notificarParceiroRejeitado(opts: {
  email: string;
  nome: string;
  empresa: string | null;
}): Promise<SendResult> {
  const nome = sanitizeText(opts.nome);
  const empresa = sanitizeText(opts.empresa ?? "");

  const html = wrap(
    `<h2>Solicitação de parceria não aprovada</h2>
     <p>Olá, <strong>${nome}</strong>.</p>
     <p>Infelizmente a solicitação${empresa ? ` da <strong>${empresa}</strong>` : ""} não foi aprovada neste momento.</p>
     <p>Isso pode mudar no futuro conforme o Pet Aumigo evolui — se quiser saber mais ou esclarecer algo, basta responder este email.</p>
     <p>Obrigado pelo interesse!</p>`,
    "#6b7280"
  );

  return sendEmail({
    to: opts.email,
    subject: "Atualização sobre sua solicitação de parceria — Pet Aumigo",
    html,
    text: `Olá ${opts.nome}, sua solicitação de parceria não foi aprovada. Responda este email para mais informações.`,
  });
}

/**
 * Notifica o tutor do pet PERDIDO quando um pet "encontrado" tem ≥ 60% de
 * compatibilidade com o dele.
 *
 * Sempre chamada com newPetKind === "found" (regra de negócio do matching.ts).
 * Recipient = tutor que perdeu o pet.
 * CTA principal → pet encontrado recém-cadastrado (newPetUrl).
 * Link secundário → próprio pet do tutor (matchPetUrl) para comparação.
 */
export async function notificarMatchPet(opts: {
  recipientEmail: string;
  matchScore: number;
  /** Sempre "found" — pet recém-cadastrado que disparou o matching */
  newPetKind: "lost" | "found";
  newPetName: string;
  newPetCity: string;
  matchReasons: string[];
  /** URL do pet encontrado (destino principal do CTA) */
  newPetUrl: string;
  /** URL do pet perdido do tutor (link secundário de referência) */
  matchPetUrl: string;
}): Promise<SendResult> {
  // Recipient é sempre o tutor do pet PERDIDO; newPetKind === "found" por design.
  // Mensagem: informar que alguém achou um pet parecido com o dele.
  const actionText = "Alguém encontrou um pet que pode ser o seu! 🐾";

  const scoreColor =
    opts.matchScore >= 85 ? "#22c55e" :
    opts.matchScore >= 70 ? "#f97316" :
    "#06b6d4";

  const reasonsHtml = opts.matchReasons.length
    ? opts.matchReasons.map((r) => `<li style="margin: 4px 0;">${sanitizeText(r)}</li>`).join("")
    : "<li>Características similares detectadas</li>";

  const newPetName = sanitizeText(opts.newPetName);
  const newPetCity = sanitizeText(opts.newPetCity);

  const html = wrap(
    `<h2>🎉 Possível match encontrado!</h2>
     <p style="font-size: 15px; font-weight: 600; color: #f9fafb; margin-bottom: 8px;">${actionText}</p>

     <!-- Badge de compatibilidade -->
     <div style="text-align: center; margin: 20px 0;">
       <div style="display: inline-block; background: ${scoreColor}22; border: 2px solid ${scoreColor}; border-radius: 50px; padding: 10px 28px;">
         <span style="font-size: 28px; font-weight: 800; color: ${scoreColor};">${opts.matchScore}%</span>
         <span style="display: block; font-size: 11px; color: #9ca3af; margin-top: 2px; text-transform: uppercase; letter-spacing: .05em;">de compatibilidade</span>
       </div>
     </div>

     <!-- Razões do match -->
     <div style="background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; padding: 16px; margin: 16px 0;">
       <p style="font-weight: 700; color: #f9fafb; margin-bottom: 8px;">Por que este match é promissor:</p>
       <ul style="margin: 0 0 0 18px; font-size: 13px; color: #d1d5db; line-height: 1.8;">
         ${reasonsHtml}
       </ul>
     </div>

     <!-- Info do pet encontrado -->
     <div style="background: rgba(34, 197, 94, 0.08); border-left: 3px solid #22c55e; border-radius: 4px; padding: 12px 16px; margin: 16px 0;">
       <p style="font-size: 13px; color: #9ca3af; margin: 0;">
         🟢 Pet encontrado: <strong style="color: #f9fafb;">${newPetName}</strong> — visto em <strong style="color: #f9fafb;">${newPetCity}</strong>
       </p>
     </div>

     <p>Acesse o perfil do pet encontrado para ver a foto, descrição completa e o contato de quem o encontrou:</p>

     <!-- CTA principal → pet encontrado -->
     <p style="text-align: center; margin: 24px 0;">
       <a href="${BASE_URL}${opts.newPetUrl}"
          style="display: inline-block; background: #22c55e; color: white; padding: 14px 32px;
                 border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
         Ver pet encontrado →
       </a>
     </p>

     <!-- Link secundário → pet do tutor -->
     <p style="text-align: center; font-size: 12px; color: #6b7280; margin-top: -8px;">
       <a href="${BASE_URL}${opts.matchPetUrl}" style="color: #9ca3af; text-decoration: underline;">
         Ver registro do meu pet perdido
       </a>
     </p>

     <p style="font-size: 12px; color: #6b7280; margin-top: 20px; border-top: 1px solid rgba(255,255,255,.06); padding-top: 16px;">
       ⚠️ Este é um match automático baseado em características similares (espécie, cor, porte, localização).
       Sempre verifique pessoalmente antes de confirmar que é o pet certo.
     </p>`,
    "#22c55e"
  );

  return sendEmail({
    to: opts.recipientEmail,
    subject: `🎉 ${opts.matchScore}% de compatibilidade — ${newPetName} pode ser o seu pet!`,
    html,
    text: [
      `Alguém encontrou um pet que pode ser o seu! Compatibilidade: ${opts.matchScore}%.`,
      `Pet encontrado: ${newPetName} em ${newPetCity}.`,
      `Razões: ${opts.matchReasons.join(", ")}.`,
      `Ver pet encontrado: ${BASE_URL}${opts.newPetUrl}`,
    ].join("\n"),
  });
}
