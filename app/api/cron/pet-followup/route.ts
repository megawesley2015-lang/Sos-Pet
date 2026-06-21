import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendEmail, hasEmailBeenSent } from "@/lib/email/send"
import { petFollowUpTemplate } from "@/lib/email/templates"

const FOLLOW_UP_DAYS = [1, 3, 7, 14] as const
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aumigo.com.br"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  let totalSent = 0
  let totalSkipped = 0

  for (const day of FOLLOW_UP_DAYS) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - day)
    const dateStr = targetDate.toISOString().split("T")[0]

    const { data: pets, error } = await supabase
      .from("pets")
      .select("id, name, species, owner_id, kind, status")
      .eq("kind", "lost")
      .eq("status", "active")
      .not("owner_id", "is", null)
      .gte("created_at", `${dateStr}T00:00:00.000Z`)
      .lte("created_at", `${dateStr}T23:59:59.999Z`)

    if (error || !pets?.length) continue

    for (const pet of pets) {
      if (!pet.owner_id) continue

      const templateName = `pet_followup_d${day}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userData } = await (supabase.auth as any).admin.getUserById(pet.owner_id)
      const email: string | undefined = userData?.user?.email
      if (!email) continue

      const alreadySent = await hasEmailBeenSent(email, templateName)
      if (alreadySent) {
        totalSkipped++
        continue
      }

      const petName = pet.name ?? "Seu pet"
      await sendEmail({
        to: email,
        subject: `${petName} ainda não foi encontrado — não desista!`,
        html: petFollowUpTemplate({
          petName,
          petId: pet.id,
          daysSinceLost: day,
          siteUrl: SITE_URL,
        }),
        templateName,
      })
      totalSent++
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, skipped: totalSkipped })
}
