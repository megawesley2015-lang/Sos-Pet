"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email/send";

const schema = z.object({
  pet_id:        z.string().uuid(),
  pet_name:      z.string().min(1).max(100),
  shelter_id:    z.string().uuid(),
  shelter_email: z.string().email().optional().or(z.literal("")),
  adopter_name:  z.string().min(2).max(100),
  adopter_phone: z.string().min(8).max(20),
  adopter_city:  z.string().min(2).max(60),
  message:       z.string().max(500).optional(),
});

export async function submitAdoptionInterest(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique os campos obrigatórios." };
  }

  const d = parsed.data;

  // Se a ONG tem e-mail, notifica
  if (d.shelter_email) {
    await sendEmail({
      to: d.shelter_email,
      subject: `Interesse em adotar: ${d.pet_name}`,
      templateName: "adoption_interest",
      html: `
        <p><strong>${d.adopter_name}</strong> demonstrou interesse em adotar <strong>${d.pet_name}</strong>.</p>
        <ul>
          <li><strong>WhatsApp:</strong> ${d.adopter_phone}</li>
          <li><strong>Cidade:</strong> ${d.adopter_city}</li>
          ${d.message ? `<li><strong>Mensagem:</strong> ${d.message}</li>` : ""}
        </ul>
        <p>Entre em contato diretamente com o interessado via WhatsApp.</p>
      `,
    });
  }

  return { success: true };
}
