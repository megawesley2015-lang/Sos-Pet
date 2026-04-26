"use client";

import { useTransition } from "react";
import {
  PrestadorForm,
  type PrestadorFormState,
} from "@/components/providers/PrestadorForm";
import type { PrestadorRow } from "@/lib/types/database";
import {
  updateProviderAction,
  deleteProviderAction,
} from "./actions";

interface EditPrestadorClientProps {
  prestador: PrestadorRow;
}

export function EditPrestadorClient({ prestador }: EditPrestadorClientProps) {
  const [pending, startTransition] = useTransition();

  const boundUpdate = async (
    state: PrestadorFormState,
    formData: FormData
  ): Promise<PrestadorFormState> => {
    return updateProviderAction(
      prestador.id,
      prestador.slug,
      state,
      formData
    );
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteProviderAction(prestador.id);
    });
  };

  return (
    <PrestadorForm
      action={boundUpdate}
      initial={prestador}
      submitLabel={pending ? "Excluindo…" : "Salvar alterações"}
      pendingLabel="Salvando…"
      onDelete={handleDelete}
    />
  );
}
