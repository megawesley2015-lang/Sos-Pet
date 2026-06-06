// components/HallRreencontros.server.tsx — Server Component wrapper
//
// Busca pets resolvidos reais do banco.
// Fallback: quando não há dados (banco vazio / projeto pausado),
// exibe mocks com as 4 histórias de prova social da Baixada Santista.
// Substituir os mocks quando os primeiros reencontros reais forem registrados.

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import HallRreencontros, { type PetReencontrado } from './HallRreencontros'

interface Props {
  limite?: number
  resolvedCount?: number
}

// ── Mock data — prova social enquanto não há casos reais ─────────────────────
// Datas relativas ao momento do render (Server Component com force-dynamic).

function getMocks(): PetReencontrado[] {
  const now = Date.now()
  const h   = (n: number) => new Date(now - n * 60 * 60 * 1000).toISOString()

  return [
    {
      id: 'mock-mel',
      name: 'Mel',
      species: 'dog',
      breed: 'Golden Retriever',
      city: 'Guarujá, SP',
      photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop&auto=format',
      event_date: h(13),
      resolved_at: h(1),
      testimonial: 'Em menos de 12 horas um vizinho reconheceu pela foto e entrou em contato.',
    },
    {
      id: 'mock-bolinha',
      name: 'Bolinha',
      species: 'dog',
      breed: 'SRD',
      city: 'Santos, SP',
      photo_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop&auto=format',
      event_date: h(21),
      resolved_at: h(1),
      testimonial: null,
    },
    {
      id: 'mock-thor',
      name: 'Thor',
      species: 'dog',
      breed: 'Labrador',
      city: 'São Vicente, SP',
      photo_url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600&h=400&fit=crop&auto=format',
      event_date: h(49),
      resolved_at: h(1),
      testimonial: null,
    },
    {
      id: 'mock-luna',
      name: 'Luna',
      species: 'cat',
      breed: 'Siamês',
      city: 'Praia Grande, SP',
      photo_url: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd049?w=600&h=400&fit=crop&auto=format',
      event_date: h(7),
      resolved_at: h(1),
      testimonial: null,
    },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default async function HallRreencontrosServer({
  limite = 5,
  resolvedCount,
}: Props) {
  let pets: PetReencontrado[] = []
  let usandoMocks = false

  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('pets')
      .select('id, name, species, breed, city, photo_url, event_date, updated_at')
      .eq('status', 'resolved')
      .order('updated_at', { ascending: false })
      .limit(limite)

    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pets = (data as any[]).map((p) => ({
        id: p.id as string,
        name: p.name as string | null,
        species: (p.species as 'dog' | 'cat' | 'other') ?? 'other',
        breed: p.breed as string | null,
        city: p.city as string,
        photo_url: p.photo_url as string | null,
        event_date: p.event_date as string,
        resolved_at: p.updated_at as string,
        testimonial: null,
      }))
    } else {
      usandoMocks = true
      pets = getMocks()
    }
  } catch {
    // Supabase indisponível (projeto pausado, etc.) → fallback para mocks
    usandoMocks = true
    pets = getMocks()
  }

  if (pets.length === 0) return null

  // Contador: usa resolvedCount do banco se disponível, senão mock
  const contador = usandoMocks ? undefined : (resolvedCount ?? pets.length)

  return (
    <HallRreencontros
      pets={pets}
      resolvedCount={contador}
      verTodos={!usandoMocks}
    />
  )
}
