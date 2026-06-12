function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function baseLayout(content: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px">
  <tr>
    <td style="background:#121214;padding:24px 32px">
      <span style="color:#FF851B;font-size:20px;font-weight:bold">🐾 SOS Pet Amigo</span>
    </td>
  </tr>
  <tr><td style="padding:32px">${content}</td></tr>
  <tr>
    <td style="background:#f4f4f5;padding:16px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#6b7280">
        Você recebeu este email porque possui um cadastro no SOS Pet Amigo.<br>
        <a href="${escapeHtml(siteUrl)}/perfil/configuracoes" style="color:#FF851B">Gerenciar alertas</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function ctaButton(text: string, url: string): string {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;background:#FF851B;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">${escapeHtml(text)}</a>`
}

interface PetConfirmationParams {
  petName: string
  petId: string
  photoUrl?: string
  species: string
  siteUrl: string
}

export function petConfirmationTemplate(p: PetConfirmationParams): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827">Pet cadastrado com sucesso!</h1>
    <p style="margin:0 0 16px;color:#374151;font-size:15px">
      <strong>${escapeHtml(p.petName)}</strong> (${escapeHtml(p.species)}) foi cadastrado na plataforma.
      Nossa rede de voluntários já foi notificada.
    </p>
    ${p.photoUrl ? `<img src="${escapeHtml(p.photoUrl)}" alt="${escapeHtml(p.petName)}" width="200" style="border-radius:8px;margin-bottom:16px">` : ''}
    <p style="margin:0 0 24px;color:#374151;font-size:15px">
      Compartilhe a postagem nas redes sociais para aumentar as chances de reencontro.
    </p>
    ${ctaButton('Ver postagem', `${p.siteUrl}/pets/${p.petId}`)}
  `
  return baseLayout(content, p.siteUrl)
}

interface MatchFoundParams {
  petName: string
  matchPetName: string
  matchCity: string
  matchPhotoUrl?: string
  matchId: string
  score: number
  siteUrl: string
}

export function matchFoundTemplate(p: MatchFoundParams): string {
  const pct = Math.round(p.score * 100)
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827">Possível match encontrado!</h1>
    <p style="margin:0 0 8px;color:#374151;font-size:15px">
      Encontramos um pet que pode ser <strong>${escapeHtml(p.petName)}</strong>.
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px">
      <strong>${escapeHtml(p.matchPetName)}</strong> foi avistado em <strong>${escapeHtml(p.matchCity)}</strong>
      — compatibilidade de <strong>${pct}%</strong>.
    </p>
    ${p.matchPhotoUrl ? `<img src="${escapeHtml(p.matchPhotoUrl)}" alt="${escapeHtml(p.matchPetName)}" width="200" style="border-radius:8px;margin-bottom:16px">` : ''}
    <p style="margin:0 0 24px;color:#374151;font-size:15px">
      Verifique se é o seu pet e entre em contato com quem o encontrou.
    </p>
    ${ctaButton('Ver match', `${p.siteUrl}/pets/${p.matchId}`)}
  `
  return baseLayout(content, p.siteUrl)
}

interface AdoptionConfirmationParams {
  petName: string
  petId: string
  photoUrl?: string
  adopterName: string
  siteUrl: string
}

export function adoptionConfirmationTemplate(p: AdoptionConfirmationParams): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827">Adoção confirmada!</h1>
    <p style="margin:0 0 16px;color:#374151;font-size:15px">
      <strong>${escapeHtml(p.petName)}</strong> foi adotado por <strong>${escapeHtml(p.adopterName)}</strong>.
      Parabéns pela nova família!
    </p>
    ${p.photoUrl ? `<img src="${escapeHtml(p.photoUrl)}" alt="${escapeHtml(p.petName)}" width="200" style="border-radius:8px;margin-bottom:16px">` : ''}
    ${ctaButton('Ver perfil do pet', `${p.siteUrl}/pets/${p.petId}`)}
  `
  return baseLayout(content, p.siteUrl)
}

interface PetFollowUpParams {
  petName: string
  petId: string
  daysSinceLost: number
  siteUrl: string
}

export function petFollowUpTemplate(p: PetFollowUpParams): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827">${escapeHtml(p.petName)} ainda está desaparecido</h1>
    <p style="margin:0 0 16px;color:#374151;font-size:15px">
      Faz <strong>${p.daysSinceLost} dia${p.daysSinceLost !== 1 ? 's' : ''}</strong> que
      <strong>${escapeHtml(p.petName)}</strong> está desaparecido. Não desista!
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px">
      Compartilhe a postagem novamente nas redes sociais para manter a busca ativa.
    </p>
    ${ctaButton('Atualizar postagem', `${p.siteUrl}/pets/${p.petId}`)}
  `
  return baseLayout(content, p.siteUrl)
}
