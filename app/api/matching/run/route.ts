import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateMatchScore } from '@/lib/matching/score'
import type { PetForMatching } from '@/lib/matching/score'

const MATCH_SECRET = process.env.MATCH_RUN_SECRET
const MIN_SCORE = 0.55

export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization')
  if (MATCH_SECRET && auth !== `Bearer ${MATCH_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: lostPets } = await supabase
    .from('pets')
    .select('id, species, city, color, breed, latitude, longitude, created_at')
    .eq('kind', 'lost')
    .eq('status', 'active')
    .gte('created_at', cutoff)

  const { data: foundPets } = await supabase
    .from('pets')
    .select('id, species, city, color, breed, latitude, longitude, created_at')
    .eq('kind', 'found')
    .eq('status', 'active')
    .gte('created_at', cutoff)

  if (!lostPets?.length || !foundPets?.length) {
    return NextResponse.json({ success: true, data: { matches_created: 0, pairs_evaluated: 0 } })
  }

  let matchesCreated = 0
  let pairsEvaluated = 0

  for (const lost of lostPets as PetForMatching[]) {
    for (const found of foundPets as PetForMatching[]) {
      pairsEvaluated++
      const score = calculateMatchScore(lost, found)
      if (score < MIN_SCORE) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { error } = await db.from('pet_matches').upsert({
        lost_pet_id: lost.id,
        found_pet_id: found.id,
        confidence_score: score,
        status: 'pending',
        matched_by: 'system',
      }, { onConflict: 'lost_pet_id,found_pet_id', ignoreDuplicates: true })

      if (!error) matchesCreated++
    }
  }

  return NextResponse.json({
    success: true,
    data: { matches_created: matchesCreated, pairs_evaluated: pairsEvaluated },
  })
}
