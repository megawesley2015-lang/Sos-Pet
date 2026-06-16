// app/achados-e-perdidos/cadastrar/page.tsx

import Link         from 'next/link'
import { TopBar }   from '@/components/layout/TopBar'
import { PetForm }  from '@/components/pets/PetFormWithUpload'

export const metadata = {
  title:       'Cadastrar Pet — SOS Pet Aumigo',
  description: 'Cadastre um alerta de pet perdido ou encontrado. Grátis, sem login.',
}

export default function CadastrarPage() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <nav className="mb-6 flex items-center gap-2 text-xs text-fg-subtle">
          <Link href="/achados-e-perdidos" className="hover:text-brand-600 transition-colors">
            Achados &amp; Perdidos
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-fg-muted">Cadastrar</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-fg">
            Cadastrar <span className="text-brand-500">alerta</span>
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            100% gratuito · sem login obrigatório · visível em segundos
          </p>
        </div>

        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-warm-card sm:p-8">
          <PetForm />
        </div>
      </main>
    </>
  )
}
