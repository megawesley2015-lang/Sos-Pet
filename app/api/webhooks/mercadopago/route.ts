import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'

function verifySignature(request: NextRequest, body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // skip in dev

  const signature = request.headers.get('x-signature') ?? ''
  const ts = request.headers.get('x-request-id') ?? Date.now().toString()
  const manifest = `id:${ts};request-id:${ts};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(request: NextRequest) {
  const body = await request.text()

  if (!verifySignature(request, body)) {
    return NextResponse.json({ success: false, error: 'Assinatura inválida' }, { status: 401 })
  }

  const payload = JSON.parse(body)
  const { action, data } = payload

  if (!['payment.created', 'payment.updated'].includes(action)) {
    return NextResponse.json({ success: true })
  }

  const paymentId = data?.id
  if (!paymentId) return NextResponse.json({ success: true })

  const mpToken = process.env.MP_ACCESS_TOKEN
  if (!mpToken) return NextResponse.json({ success: true })

  const paymentRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${mpToken}` } }
  ).catch(() => null)

  if (!paymentRes?.ok) return NextResponse.json({ success: true })

  const payment = await paymentRes.json()
  if (payment.status !== 'approved') return NextResponse.json({ success: true })

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = service as any

  const { data: orders } = await db
    .from('store_orders')
    .select('id, items, shipping_address, user_id')
    .eq('mp_preference_id', payment.preference_id)
    .eq('status', 'pending')
    .limit(1)

  const order = orders?.[0]
  if (!order) return NextResponse.json({ success: true })

  await db.from('store_orders').update({
    status: 'paid',
    mp_payment_id: String(paymentId),
  }).eq('id', order.id)

  // Create Printful order
  const printfulKey = process.env.PRINTFUL_API_KEY
  if (printfulKey) {
    try {
      const pfRes = await fetch('https://api.printful.com/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${printfulKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: order.shipping_address,
          items: (order.items ?? []).map((i: any) => ({
            variant_id: i.variant_id,
            quantity: i.quantity,
          })),
        }),
      })
      if (pfRes.ok) {
        const pfData = await pfRes.json()
        await db.from('store_orders').update({
          printful_order_id: String(pfData.result?.id ?? ''),
        }).eq('id', order.id)
      } else {
        const pfErr = await pfRes.text()
        await db.from('store_orders').update({ printful_error: pfErr }).eq('id', order.id)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await db.from('store_orders').update({ printful_error: msg }).eq('id', order.id)
    }
  }

  if (order.user_id) {
    const { data: userData } = await service.auth.admin.getUserById(order.user_id)
    const email = userData?.user?.email
    if (email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aumigo.com.br'
      void sendEmail({
        to: email,
        subject: 'Pedido confirmado — Pet Aumigo',
        html: `<p>Seu pedido foi confirmado! Número: <strong>${order.id.slice(0, 8)}</strong></p>
               <p><a href="${siteUrl}/loja/sucesso?payment_id=${paymentId}">Ver detalhes</a></p>`,
        templateName: 'order_confirmation',
      })
    }
  }

  return NextResponse.json({ success: true })
}
