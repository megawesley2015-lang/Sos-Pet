import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSafe } from "@/lib/auth/safe";
import { EditPetForm } from "./EditPetForm";

export const revalidate = 0;

export default async function EditarPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await getUserSafe(supabase);
  if (!user) redirect("/login");

  const { data: pet } = await supabase
    .from("shelter_pets")
    .select("*, shelters!inner(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (!pet) notFound();

  
  if (pet.shelters.user_id !== user.id) notFound();

  // Normaliza rescue_date para yyyy-MM-dd (input[type=date] exige esse formato)
  const rescueDateFormatted =
    typeof pet.rescue_date === "string"
      ? pet.rescue_date.slice(0, 10)
      : new Date(pet.rescue_date).toISOString().slice(0, 10);

  return (
    <EditPetForm
      pet={{
        id:              pet.id,
        name:            pet.name,
        species:         pet.species,
        breed:           pet.breed,
        color:           pet.color,
        size:            pet.size,
        sex:             pet.sex,
        estimated_age:   pet.estimated_age,
        rescue_date:     rescueDateFormatted,
        rescue_location: pet.rescue_location,
        health_status:   pet.health_status,
        behavior:        pet.behavior,
        description:     pet.description,
        photo_url:       pet.photo_url,
        status:          pet.status,
        weight_kg:       pet.weight_kg ?? null,
        microchip:       pet.microchip ?? null,
        is_castrated:    pet.is_castrated ?? false,
      }}
    />
  );
}
