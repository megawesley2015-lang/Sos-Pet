import { redirect } from "next/navigation";

/**
 * /pet/[id] → /pets/[id]
 *
 * URL curta gravada nas plaquinhas físicas.
 * Redireciona para o perfil completo do pet.
 *
 * Formato na plaquinha: sospet.app/pet/[pet_uuid]
 */
export default async function PetShortUrl({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/pets/${id}`);
}
