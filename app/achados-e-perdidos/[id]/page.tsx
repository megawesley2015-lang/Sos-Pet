// src/app/achados-e-perdidos/[id]/page.tsx
// Detalhe do pet — ÚNICO lugar onde o contato é exibido

import { notFound }     from 'next/navigation'
import Link             from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface PageProps {
  params: { id: string }
}

export default async function DetalhesPetPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient()

  // Aqui incluímos "contato" — apenas na página de detalhe
  const { data: pet, error } = await supabase
    .from('achados_perdidos')
    .select('id, tipo, nome, especie, raca, cor, porte, sexo, idade_aprox, descricao, comportamento, bairro, cidade, data_ocorrencia, foto_url, contato, status, created_at')
    .eq('id', params.id)
    .single()

  if (error || !pet) {
    notFound()
  }

  const isPerdido   = pet.tipo === 'perdido'
  const whatsappUrl = `https://wa.me/55${pet.contato.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá! Vi seu anúncio no SOS Pet sobre um ${pet.especie} ${isPerdido ? 'perdido' : 'encontrado'}. Posso ajudar!`
  )}`

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">

      {/* Voltar */}
      <Link
        href="/achados-e-perdidos"
        className="text-sm text-[#20B2AA] hover:underline mb-6 inline-block"
      >
        ← Voltar para listagem
      </Link>

      {/* Badge de status */}
      <span
        className={`inline-block text-sm font-bold px-3 py-1 rounded-full mb-4
          ${isPerdido ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'bg-[#20B2AA]/10 text-[#20B2AA]'}`}
      >
        {isPerdido ? '🔍 Perdido' : '✅ Encontrado'}
      </span>

      {/* Foto */}
      {pet.foto_url && (
        <div className="rounded-xl overflow-hidden mb-6 aspect-video bg-gray-50">
          <img
            src={pet.foto_url}
            alt={pet.nome ?? `${pet.especie} ${pet.tipo}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Nome */}
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        {pet.nome ?? `${pet.especie === 'cao' ? 'Cão' : pet.especie === 'gato' ? 'Gato' : 'Pet'} sem nome`}
      </h1>

      {/* Localização e data */}
      <p className="text-gray-500 mb-6">
        📍 {pet.bairro ? `${pet.bairro}, ` : ''}{pet.cidade} ·{' '}
        📅 {new Date(pet.data_ocorrencia).toLocaleDateString('pt-BR')}
      </p>

      {/* Características */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Espécie',  value: pet.especie === 'cao' ? 'Cão' : pet.especie === 'gato' ? 'Gato' : 'Outro' },
          { label: 'Raça',     value: pet.raca },
          { label: 'Cor',      value: pet.cor },
          { label: 'Porte',    value: pet.porte },
          { label: 'Sexo',     value: pet.sexo },
          { label: 'Idade',    value: pet.idade_aprox },
        ]
          .filter((item) => item.value)
          .map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
              <p className="text-gray-700 font-medium capitalize mt-0.5">{value}</p>
            </div>
          ))
        }
      </section>

      {/* Descrição */}
      {pet.descricao && (
        <div className="mb-4">
          <h2 className="font-semibold text-gray-700 mb-1">Descrição</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{pet.descricao}</p>
        </div>
      )}

      {/* Comportamento */}
      {pet.comportamento && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-1">Comportamento</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{pet.comportamento}</p>
        </div>
      )}

      {/* CONTATO — exibido apenas aqui */}
      <div className="border border-[#20B2AA]/30 bg-[#20B2AA]/5 rounded-xl p-5">
        <h2 className="font-bold text-gray-800 mb-3">📞 Entrar em Contato</h2>
        <p className="text-gray-600 text-sm mb-4">
          Telefone / WhatsApp: <span className="font-semibold text-gray-800">{pet.contato}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#25D366] hover:bg-[#1ebe58] text-white font-semibold
                       text-center py-3 rounded-lg transition-colors duration-200"
          >
            💬 Chamar no WhatsApp
          </a>
          <a
            href={`tel:${pet.contato.replace(/\D/g, '')}`}
            className="flex-1 bg-[#20B2AA] hover:bg-[#1A9E97] text-white font-semibold
                       text-center py-3 rounded-lg transition-colors duration-200"
          >
            📱 Ligar agora
          </a>
        </div>
      </div>

    </main>
  )
}
