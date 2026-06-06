// components/HeroSection.server.tsx — busca dados e passa ao HeroSection client

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import HeroSection, { type AlertaRecente } from './HeroSection'

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(min / 60)
  const d    = Math.floor(h / 24)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min atrás`
  if (h < 24)   return `${h}h atrás`
  if (d === 1)  return 'ontem'
  return `${d} dias atrás`
}

// Mapeia kind (schema real) → status (interface do componente)
function kindParaStatus(kind: string): 'perdido' | 'encontrado' {
  return kind === 'lost' ? 'perdido' : 'encontrado'
}

// Mapeia species (schema real: dog/cat/other) → especie (interface)
function speciesPtBR(species: string): string {
  const map: Record<string, string> = { dog: 'cachorro', cat: 'gato', other: 'outro' }
  return map[species] ?? species
}

export default async function HeroSectionServer() {
  let alertas: AlertaRecente[] = []
  let totalAtivos = 0

  try {
    const supabase = await createClient()

    const [alertasResult, countResult] = await Promise.all([
      // Schema real: name, species, kind ('lost'|'found'), status ('active'), city
      supabase
        .from('pets')
        .select('id, name, species, kind, city, photo_url, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ])

    alertas = (alertasResult.data ?? []).map((p) => ({
      id:            p.id as string,
      nome:          (p.name as string | null) ?? undefined,
      especie:       speciesPtBR(p.species as string),
      status:        kindParaStatus(p.kind as string),
      cidade:        p.city as string,
      foto_url:      (p.photo_url as string | null) ?? undefined,
      tempoRelativo: tempoRelativo(p.created_at as string),
    }))

    totalAtivos = countResult.count ?? 0
  } catch {
    // Supabase indisponível — componente renderiza com estado vazio (CTA)
  }

  return (
    <HeroSection
      alertasRecentes={alertas}
      totalAtivos={totalAtivos}
    />
  )
}
