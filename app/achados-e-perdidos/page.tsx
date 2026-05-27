// src/app/achados-e-perdidos/page.tsx
// Server Component — busca direto no Supabase, sem fetch client

import Link                from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PetFiltrosSchema } from '@/lib/schemas/pet'
import type { PetCard }    from '@/types'

// Revalida a cada 60 segundos (ISR)
export const revalidate = 60

interface PageProps {
  searchParams: {
    tipo?:    string
    especie?: string
    cidade?:  string
    page?:    string
  }
}

export default async function AchadosEPerdidosPage({ searchParams }: PageProps) {
  const parsed = PetFiltrosSchema.safeParse({
    tipo:    searchParams.tipo,
    especie: searchParams.especie,
    cidade:  searchParams.cidade,
    page:    searchParams.page,
    limit:   20,
  })

  const filtros = parsed.success ? parsed.data : { page: 1, limit: 20 }
  const offset  = (filtros.page - 1) * filtros.limit

  const supabase = await createSupabaseServerClient()

  // Seleção explícita — SEM "contato"
  let query = supabase
    .from('achados_perdidos')
    .select('id, tipo, nome, especie, raca, cor, porte, sexo, bairro, cidade, data_ocorrencia, foto_url, status, created_at', { count: 'exact' })
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
    .range(offset, offset + filtros.limit - 1)

  if (filtros.tipo)    query = query.eq('tipo', filtros.tipo as 'perdido' | 'encontrado')
  if (filtros.especie) query = query.eq('especie', filtros.especie as 'cao' | 'gato' | 'outro')
  if (filtros.cidade)  query = query.ilike('cidade', `%${filtros.cidade}%`)

  const { data: pets, count, error } = await query

  if (error) {
    console.error('[AchadosEPerdidosPage]', error.message)
  }

  const total    = count ?? 0
  const hasNext  = offset + filtros.limit < total
  const hasPrev  = filtros.page > 1

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🐾 Achados e Perdidos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/achados-e-perdidos/novo"
          className="bg-[#FF6B35] hover:bg-[#E85A2A] text-white font-semibold
                     px-5 py-2.5 rounded-lg transition-colors duration-200"
        >
          + Registrar Pet
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 mb-8">
        <select
          name="tipo"
          defaultValue={filtros.tipo ?? ''}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:border-[#20B2AA] focus:outline-none focus:ring-2
                     focus:ring-[#20B2AA]/20 transition-colors"
        >
          <option value="">Todos os tipos</option>
          <option value="perdido">Perdido</option>
          <option value="encontrado">Encontrado</option>
        </select>

        <select
          name="especie"
          defaultValue={filtros.especie ?? ''}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:border-[#20B2AA] focus:outline-none focus:ring-2
                     focus:ring-[#20B2AA]/20 transition-colors"
        >
          <option value="">Todas as espécies</option>
          <option value="cao">Cão</option>
          <option value="gato">Gato</option>
          <option value="outro">Outro</option>
        </select>

        <input
          type="text"
          name="cidade"
          defaultValue={filtros.cidade ?? ''}
          placeholder="Filtrar por cidade..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:border-[#20B2AA] focus:outline-none focus:ring-2
                     focus:ring-[#20B2AA]/20 transition-colors flex-1 min-w-[160px]"
        />

        <button
          type="submit"
          className="bg-[#20B2AA] hover:bg-[#1A9E97] text-white font-semibold
                     px-4 py-2 rounded-lg text-sm transition-colors duration-200"
        >
          Filtrar
        </button>

        <Link
          href="/achados-e-perdidos"
          className="border border-gray-200 hover:bg-gray-50 text-gray-600
                     font-medium px-4 py-2 rounded-lg text-sm transition-colors duration-200"
        >
          Limpar
        </Link>
      </form>

      {/* Grid de cards */}
      {!pets || pets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🐾</p>
          <p className="text-lg font-medium">Nenhum registro encontrado</p>
          <p className="text-sm mt-1">Tente remover os filtros ou cadastre um pet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pets.map((pet) => (
            <PetCardItem key={pet.id} pet={pet as PetCard} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {(hasPrev || hasNext) && (
        <div className="flex justify-center gap-3 mt-10">
          {hasPrev && (
            <Link
              href={`/achados-e-perdidos?page=${filtros.page - 1}&tipo=${filtros.tipo ?? ''}&especie=${filtros.especie ?? ''}&cidade=${filtros.cidade ?? ''}`}
              className="border border-gray-200 hover:bg-gray-50 px-5 py-2 rounded-lg text-sm transition-colors"
            >
              ← Anterior
            </Link>
          )}
          {hasNext && (
            <Link
              href={`/achados-e-perdidos?page=${filtros.page + 1}&tipo=${filtros.tipo ?? ''}&especie=${filtros.especie ?? ''}&cidade=${filtros.cidade ?? ''}`}
              className="bg-[#20B2AA] hover:bg-[#1A9E97] text-white px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </main>
  )
}

// ─── Card inline (sem contato!) ──────────────────────────────────────────────

function PetCardItem({ pet }: { pet: PetCard }) {
  const isPerdido = pet.tipo === 'perdido'
  const foto      = pet.foto_url ?? '/placeholder-pet.svg'

  return (
    <Link
      href={`/achados-e-perdidos/${pet.id}`}
      className="group block bg-white rounded-xl border border-gray-100
                 shadow-sm hover:shadow-md hover:-translate-y-0.5
                 transition-all duration-200 overflow-hidden"
    >
      {/* Foto */}
      <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
        <img
          src={foto}
          alt={pet.nome ?? `${pet.especie} ${pet.tipo}`}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/placeholder-pet.svg'
          }}
        />
        {/* Badge de status */}
        <span
          className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full
            ${isPerdido
              ? 'bg-[#FF6B35] text-white'
              : 'bg-[#20B2AA] text-white'
            }`}
        >
          {isPerdido ? '🔍 Perdido' : '✅ Encontrado'}
        </span>
      </div>

      {/* Informações — SEM contato */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 truncate">
          {pet.nome ?? `${pet.especie === 'cao' ? 'Cão' : pet.especie === 'gato' ? 'Gato' : 'Pet'} desconhecido`}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {pet.bairro ? `${pet.bairro}, ` : ''}{pet.cidade}
        </p>
        {pet.cor && (
          <p className="text-xs text-gray-400 mt-1">Cor: {pet.cor}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(pet.data_ocorrencia).toLocaleDateString('pt-BR')}
        </p>
        <span className="inline-block mt-3 text-xs font-semibold text-[#20B2AA]
                         group-hover:underline">
          Ver detalhes e contato →
        </span>
      </div>
    </Link>
  )
}
