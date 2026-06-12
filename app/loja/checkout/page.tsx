'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingCart, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'

export default function CheckoutPage() {
  const { items, removeItem, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [form, setForm] = useState({
    nome: '', cep: '', logradouro: '', numero: '',
    bairro: '', cidade: '', estado: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    router.replace('/loja')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, shipping_address: form }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.error ?? 'Erro ao processar pedido')
      setLoading(false)
      return
    }

    clearCart()
    if (data.data.init_point) {
      window.location.href = data.data.init_point
    } else {
      router.push(`/loja/sucesso?order_id=${data.data.order_id}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-fg">Finalizar pedido</h1>

      <div className="mb-6 space-y-2">
        {items.map(item => (
          <div
            key={`${item.product_id}-${item.variant_id}`}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-700/40 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-fg">{item.name}</p>
              <p className="text-xs text-fg-muted">Qtd: {item.quantity} × R$ {item.price_brl.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-fg">
                R$ {(item.price_brl * item.quantity).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.product_id, item.variant_id)}
                className="text-fg-muted hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-between px-4 py-2 text-base font-bold text-fg">
          <span>Total</span>
          <span>R$ {totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-base font-semibold text-fg">Endereço de entrega</h2>

        {[
          { name: 'nome', label: 'Nome completo' },
          { name: 'cep', label: 'CEP (apenas números)' },
          { name: 'logradouro', label: 'Rua/Avenida' },
          { name: 'numero', label: 'Número' },
          { name: 'bairro', label: 'Bairro' },
          { name: 'cidade', label: 'Cidade' },
          { name: 'estado', label: 'Estado (UF)' },
        ].map(field => (
          <div key={field.name}>
            <label className="mb-1 block text-xs font-medium text-fg-muted">{field.label}</label>
            <input
              required
              value={(form as any)[field.name]}
              onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-500"
            />
          </div>
        ))}

        {error && <p className="text-sm text-danger-fg">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          {loading ? 'Processando...' : 'Pagar com Mercado Pago'}
        </button>
      </form>

      <Link href="/loja" className="mt-4 block text-center text-xs text-fg-muted hover:text-fg">
        ← Continuar comprando
      </Link>
    </div>
  )
}
