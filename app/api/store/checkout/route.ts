import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createServiceClient } from '@/lib/supabase/server'

const CartItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().min(1),
  quantity: z.number().int().positive(),
  name: z.string().min(1),
})

const ShippingSchema = z.object({
  nome: z.string().min(2),
  cep: z.string().regex(/^\d{8}$/),
  logradouro: z.string().min(3),
  numero: z.string().min(1),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2),
})

const BodySchema = z.object({
  items: z.array(CartItemSchema).min(1),
  shipping_address: ShippingSchema,
})

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const { items, shipping_address } = parsed.data

  const service = createServiceClient()
  const productIds = [...new Set(items.map(i => i.product_id))]

  const { data: products } = await service
    .from('store_products')
    .select('id, price_cents, active, name')
    .in('id', productIds)

  const productMap = new Map((products ?? []).map(p => [p.id, p]))

  for (const item of items) {
    const p = productMap.get(item.product_id)
    if (!p || p.active === false) {
      return NextResponse.json(
        { success: false, error: `Produto ${item.name} está indisponível` },
        { status: 422 }
      )
    }
  }

  const enrichedItems = items.map(item => {
    const p = productMap.get(item.product_id)!
    return {
      ...item,
      price_brl: (p.price_cents ?? 0) / 100,
    }
  })

  const subtotal_brl = enrichedItems.reduce((sum, i) => sum + i.price_brl * i.quantity, 0)

  const mpAccessToken = process.env.MP_ACCESS_TOKEN
  let preference_id = ''
  let init_point = ''

  if (mpAccessToken) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sospetamigo.com.br'
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: enrichedItems.map(i => ({
          id: i.product_id,
          title: i.name,
          quantity: i.quantity,
          unit_price: i.price_brl,
          currency_id: 'BRL',
        })),
        back_urls: {
          success: `${siteUrl}/loja/sucesso`,
          failure: `${siteUrl}/loja/checkout`,
          pending: `${siteUrl}/loja/checkout`,
        },
        auto_return: 'approved',
      }),
    }).catch(() => null)

    if (mpRes?.ok) {
      const mpData = await mpRes.json()
      preference_id = mpData.id
      init_point = mpData.init_point
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = service as any
  const { data: order, error } = await db.from('store_orders').insert({
    user_id: user.id,
    items: enrichedItems,
    subtotal_brl,
    status: 'pending',
    mp_preference_id: preference_id || null,
    shipping_address,
  }).select('id').single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: { order_id: order.id, preference_id, init_point },
  }, { status: 201 })
}
