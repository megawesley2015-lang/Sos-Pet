import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ payment_id?: string; order_id?: string }>
}

export const metadata = { title: 'Pedido confirmado — SOS Pet Aumigo' }

export default async function LojaSuccessPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const orderId = sp.order_id ?? sp.payment_id

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-8 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-400" />
        <h1 className="mb-2 text-2xl font-bold text-fg">Pedido confirmado!</h1>
        <p className="mb-4 text-sm text-fg-muted">
          Seu pagamento foi aprovado. Você receberá um email de confirmação em breve.
        </p>
        {orderId && (
          <p className="mb-6 rounded-lg bg-ink-700 px-4 py-2 text-xs text-fg-muted">
            Pedido: <span className="font-mono text-fg">{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Link
            href="/loja"
            className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-400"
          >
            Continuar comprando
          </Link>
          <Link href="/" className="text-sm text-fg-muted hover:text-fg">
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  )
}
