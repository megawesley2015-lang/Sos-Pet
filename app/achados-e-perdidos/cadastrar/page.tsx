// app/achados-e-perdidos/cadastrar/page.tsx

import Link      from 'next/link'
import { PetForm } from '@/components/pets/PetFormWithUpload'

export const metadata = {
  title:       'Cadastrar Pet — SOS Pet',
  description: 'Cadastre um alerta de pet perdido ou encontrado. Grátis, sem login.',
}

export default function CadastrarPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-2 text-xs text-[rgb(var(--color-fg-subtle))]">
        <Link href="/achados-e-perdidos" className="hover:text-[rgb(var(--color-primary))] transition-colors">
          Achados & Perdidos
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[rgb(var(--color-fg-muted))]">Cadastrar</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-[rgb(var(--color-fg))]">
          Cadastrar{' '}
          <span className="text-[rgb(var(--color-primary))]">alerta</span>
        </h1>
        <p className="mt-2 text-sm text-[rgb(var(--color-fg-muted))]">
          100% gratuito · sem login obrigatório · visível em segundos
        </p>
      </div>

      <PetForm />
    </main>
  )
}
