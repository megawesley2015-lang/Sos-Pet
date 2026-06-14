import crypto from 'crypto'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  templateName: string
}

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const client = getResend()
  if (!client) {
    console.warn('[sendEmail] RESEND_API_KEY não configurado — email não enviado')
    return
  }

  const from = process.env.RESEND_FROM ?? 'Pet Aumigo <noreply@aumigo.com.br>'
  const toHash = hashEmail(params.to)
  const supabase = createServiceClient()

  let resendId: string | null = null
  let status: 'sent' | 'failed' = 'failed'
  let errorMessage: string | null = null

  try {
    const result = await client.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (result.error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = result.error as any
      if (err.statusCode === 429) {
        await sleep(1000)
        const retry = await client.emails.send({
          from,
          to: params.to,
          subject: params.subject,
          html: params.html,
        })
        if (!retry.error) {
          resendId = retry.data?.id ?? null
          status = 'sent'
        } else {
          errorMessage = String(retry.error)
        }
      } else {
        errorMessage = String(result.error)
      }
    } else {
      resendId = result.data?.id ?? null
      status = 'sent'
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  await supabase.from('email_logs' as never).insert({
    to_email_hash: toHash,
    template_name: params.templateName,
    status,
    error_message: errorMessage,
    resend_id: resendId,
  } as never)
}

export async function hasEmailBeenSent(toEmail: string, templateName: string): Promise<boolean> {
  const supabase = createServiceClient()
  const hash = hashEmail(toEmail)

  const { count } = await supabase
    .from('email_logs' as never)
    .select('*', { count: 'exact', head: true })
    .eq('to_email_hash' as never, hash)
    .eq('template_name' as never, templateName)
    .eq('status' as never, 'sent')

  return (count ?? 0) > 0
}
