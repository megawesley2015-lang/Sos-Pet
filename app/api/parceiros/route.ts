import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { partnershipRequestSchema } from '@/lib/validation/parceiros'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/send'
import { partnershipWelcomeTemplate, partnershipAdminAlertTemplate } from '@/lib/email/templates'

const PARCEIRO_RATE = { limit: 3, windowMs: 3_600_000 }

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // skip in dev without key

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }),
  }).catch(() => null)

  if (!res?.ok) return false
  const data = await res.json()
  return data.success === true
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await checkRateLimit(`parceiros:${ip}`, PARCEIRO_RATE)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = partnershipRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 422 }
    )
  }

  const valid = await verifyTurnstile(parsed.data.turnstile_token)
  if (!valid) {
    return NextResponse.json(
      { success: false, error: 'Verificação de segurança falhou' },
      { status: 422 }
    )
  }

  const supabase = createServiceClient()

  const { count } = await supabase
    .from('parceiros')
    .select('*', { count: 'exact', head: true })
    .eq('email', parsed.data.email)
    .in('status', ['pendente', 'aprovado'])

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { success: false, error: 'Já existe uma solicitação com este email. Aguarde nosso contato.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('parceiros').insert({
    nome: parsed.data.nome,
    email: parsed.data.email,
    empresa: parsed.data.tipo_negocio,
    mensagem: parsed.data.mensagem ?? null,
    status: 'pendente',
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sospetamigo.com.br'
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@sospetamigo.com.br'

  void sendEmail({
    to: parsed.data.email,
    subject: 'Bem-vindo à rede SOS Pet Amigo!',
    html: partnershipWelcomeTemplate({
      nome: parsed.data.nome,
      tipoNegocio: parsed.data.tipo_negocio,
      cidade: parsed.data.cidade,
      siteUrl,
    }),
    templateName: 'partnership_welcome',
  })

  void sendEmail({
    to: adminEmail,
    subject: `Nova solicitação de parceria — ${parsed.data.nome}`,
    html: partnershipAdminAlertTemplate({
      nome: parsed.data.nome,
      email: parsed.data.email,
      telefone: parsed.data.telefone,
      tipoNegocio: parsed.data.tipo_negocio,
      cidade: parsed.data.cidade,
      mensagem: parsed.data.mensagem,
      adminUrl: siteUrl,
    }),
    templateName: 'partnership_admin_alert',
  })

  return NextResponse.json(
    { success: true, data: { message: 'Solicitação recebida! Entraremos em contato em até 48h.' } },
    { status: 201 }
  )
}
