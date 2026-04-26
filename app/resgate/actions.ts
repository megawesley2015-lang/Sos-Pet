"use server";

import { revalidatePath } from "next/cache";
import { createAlertSchema } from "@/lib/validation/alert";
import { createAlert, uploadAlertCard } from "@/lib/services/alerts";

export interface DispatchAlertState {
  ok?: boolean;
  message?: string;
  alertId?: string;
  imagemUrl?: string | null;
}

/**
 * Server Action chamada pelo SOSButton via client.
 *
 * Recebe:
 *  - pet_id (string)
 *  - raio_km (number, default 5)
 *  - mensagem (string opcional, max 280)
 *  - card (File PNG opcional — gerado no client via html-to-image)
 */
export async function dispatchAlertAction(
  _prev: DispatchAlertState,
  formData: FormData
): Promise<DispatchAlertState> {
  const parsed = createAlertSchema.safeParse({
    pet_id: formData.get("pet_id"),
    raio_km: formData.get("raio_km") ?? 5,
    mensagem: formData.get("mensagem") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  // Upload do card PNG (opcional)
  let imagemUrl: string | null = null;
  const cardFile = formData.get("card");
  if (cardFile instanceof File && cardFile.size > 0) {
    const upload = await uploadAlertCard(cardFile);
    if (upload.error) {
      return { ok: false, message: `Falha no upload do card: ${upload.error}` };
    }
    imagemUrl = upload.url;
  }

  const { alert, error } = await createAlert(parsed.data, imagemUrl);
  if (error || !alert) {
    return { ok: false, message: error ?? "Erro ao registrar alerta." };
  }

  revalidatePath("/resgate");
  revalidatePath(`/pets/${parsed.data.pet_id}`);

  return {
    ok: true,
    alertId: alert.id,
    imagemUrl: alert.imagem_url,
    message: "Alerta SOS registrado!",
  };
}
