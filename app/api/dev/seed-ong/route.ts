// app/api/dev/seed-ong/route.ts
// Endpoint de seed APENAS em desenvolvimento — bloqueia em produção.
// Cria shelter + pets + adoção de teste para o usuário autenticado.
// Uso: GET /api/dev/seed-ong (com sessão ativa no browser)

import { NextResponse }                        from 'next/server'
import { createSupabaseServerClient }          from '@/lib/supabase/server'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Disponível apenas em desenvolvimento.' }, { status: 403 })
  }

  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Faça login em /auth/login primeiro, depois acesse esta rota.' },
      { status: 401 }
    )
  }

  const log: string[] = []

  try {
    // ── 1. Shelter ──────────────────────────────────────────────────────────
    const { data: existingShelter } = await supabase
      .from('shelters')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let shelterId: string

    if (existingShelter) {
      shelterId = existingShelter.id
      log.push(`✓ Shelter já existe: ${shelterId}`)
    } else {
      const { data: shelter, error: shelterErr } = await supabase
        .from('shelters')
        .insert({
          user_id:     user.id,
          name:        'Abrigo Teste Patinhas',
          type:        'ong',
          phone:       '(13) 99999-0001',
          email:       user.email,
          city:        'Santos',
          neighborhood:'Boqueirão',
          description: 'Abrigo criado pelo seed de testes — pode ser editado em /ong/cadastro.',
        })
        .select('id')
        .single()

      if (shelterErr) throw new Error(`Shelter: ${shelterErr.message}`)
      shelterId = shelter.id
      log.push(`✓ Shelter criado: ${shelterId}`)
    }

    // ── 2. Pets ──────────────────────────────────────────────────────────────
    const { data: existingPets } = await supabase
      .from('shelter_pets')
      .select('id, name')
      .eq('shelter_id', shelterId)

    if (existingPets && existingPets.length > 0) {
      log.push(`✓ Pets já existem: ${existingPets.map((p) => p.name).join(', ')}`)
    } else {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      const { data: pets, error: petsErr } = await supabase
        .from('shelter_pets')
        .insert([
          {
            shelter_id:    shelterId,
            name:          'Mel',
            species:       'dog',
            breed:         'SRD',
            color:         'Caramelo',
            size:          'medium',
            sex:           'female',
            health_status: 'healthy',
            status:        'available',
            is_castrated:  true,
            rescue_date:   yesterday,

          },
          {
            shelter_id:    shelterId,
            name:          'Thor',
            species:       'dog',
            breed:         'Labrador',
            color:         'Preto',
            size:          'large',
            sex:           'male',
            health_status: 'recovering',
            status:        'available',
            is_castrated:  false,
            rescue_date:   today,

          },
          {
            shelter_id:    shelterId,
            name:          'Luna',
            species:       'cat',
            breed:         'Siamês',
            color:         'Branca',
            size:          'small',
            sex:           'female',
            health_status: 'healthy',
            status:        'fostered',
            is_castrated:  true,
            rescue_date:   yesterday,

          },
        ])
        .select('id, name')

      if (petsErr) throw new Error(`Pets: ${petsErr.message}`)
      log.push(`✓ Pets criados: ${pets?.map((p) => p.name).join(', ')}`)
    }

    // ── 3. Adoção de teste ────────────────────────────────────────────────────
    const { data: allPets } = await supabase
      .from('shelter_pets')
      .select('id, name, status')
      .eq('shelter_id', shelterId)

    const petParaAdotar = allPets?.find((p) => p.status === 'available' && p.name === 'Mel')

    const { data: existingAdoptions } = await supabase
      .from('adoptions')
      .select('id')
      .eq('shelter_id', shelterId)

    if (existingAdoptions && existingAdoptions.length > 0) {
      log.push(`✓ Adoção já existe — pulando`)
    } else if (petParaAdotar) {
      const adoptionDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
      const f30 = new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0]
      const f90 = new Date(Date.now() + 88 * 86400000).toISOString().split('T')[0]

      const { error: adoptErr } = await supabase
        .from('adoptions')
        .insert({
          shelter_id:          shelterId,
          pet_id:              petParaAdotar.id,
          adopter_name:        'Maria Silva',
          adopter_phone:       '(13) 98888-0001',
          adopter_email:       'maria.teste@example.com',
          adopter_city:        'Santos',
          adopter_neighborhood:'Gonzaga',
          adoption_date:       adoptionDate,
          follow_up_30_date:   f30,
          follow_up_90_date:   f90,
          status:              'active',
        })

      if (adoptErr) throw new Error(`Adoção: ${adoptErr.message}`)

      // Atualiza status do pet para adotado
      await supabase
        .from('shelter_pets')
        .update({ status: 'adopted' })
        .eq('id', petParaAdotar.id)

      log.push(`✓ Adoção criada — ${petParaAdotar.name} → Maria Silva`)
    }

    return NextResponse.json({
      ok:      true,
      user:    user.email,
      shelter: shelterId,
      log,
      next: [
        'GET /ong/dashboard → métricas com dados reais',
        'GET /ong/pets      → Mel (adotada), Thor e Luna',
        'GET /ong/adocoes   → adoção da Mel',
      ],
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, log, error: msg }, { status: 500 })
  }
}
