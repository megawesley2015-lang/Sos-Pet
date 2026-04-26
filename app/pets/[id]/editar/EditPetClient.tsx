"use client";

import { useTransition } from "react";
import { PetForm, type PetFormState } from "@/components/pets/PetForm";
import type { PetRow } from "@/lib/types/database";
import { updatePetAction, deletePetAction } from "./actions";

interface EditPetClientProps {
  pet: PetRow;
}

/**
 * Bridge client → server actions.
 *
 * Por que existe: Server Actions exportadas precisam da assinatura
 * (state, formData) — não dá pra binder o petId no Server Component
 * sem virar client. Aqui binda no client, repassa pro PetForm.
 */
export function EditPetClient({ pet }: EditPetClientProps) {
  const [pending, startTransition] = useTransition();

  // Curry: petId vem do scope, action recebe (state, formData)
  const boundUpdate = async (
    state: PetFormState,
    formData: FormData
  ): Promise<PetFormState> => {
    return updatePetAction(pet.id, state, formData);
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deletePetAction(pet.id);
    });
  };

  return (
    <PetForm
      action={boundUpdate}
      initial={pet}
      submitLabel={pending ? "Excluindo…" : "Salvar alterações"}
      pendingLabel="Salvando…"
      onDelete={handleDelete}
    />
  );
}
