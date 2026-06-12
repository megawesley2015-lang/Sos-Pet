import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, hasEmailBeenSent } from '@/lib/email/send'
import { petFollowUpTemplate } from '@/lib/email/templates'

// CRON: Schedule `0 10 * * *` UTC via n8n → POST /api/email/follow-up
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const secret = process.env.FOLLOW_UP_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sospetamigo.com.br'
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name, owner_id, created_at')
    .eq('kind', 'lost')
    .eq('status', 'active')
    .lte('created_at', sevenDaysAgo)

  if (!pets?.length) {
    return NextResponse.json({ success: true, data: { sent: 0, skipped: 0 } })
  }

  let sent = 0
  let skipped = 0

  for (const pet of pets) {
    if (!pet.owner_id) { skipped++; continue }

    const { data: userData } = await supabase.auth.admin.getUserById(pet.owner_id)
    const email = userData?.user?.email
    if (!email) { skipped++; continue }

    const alreadySent = await hasEmailBeenSent(email, 'pet_follow_up')
    if (alreadySent) { skipped++; continue }

    const daysSince = Math.floor(
      (Date.now() - new Date(pet.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    await sendEmail({
      to: email,
      subject: `${pet.name ?? 'Seu pet'} — ${daysSince} dias desaparecido`,
      html: petFollowUpTemplate({
        petName: pet.name ?? 'Seu pet',
        petId: pet.id,
        daysSinceLost: daysSince,
        siteUrl,
      }),
      templateName: 'pet_follow_up',
    })

    sent++
  }

  return NextResponse.json({ success: true, data: { sent, skipped } })
}
