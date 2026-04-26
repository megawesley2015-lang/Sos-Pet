"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ProviderPhotoUpload } from "@/components/providers/ProviderPhotoUpload";
import { updateProfileAction, type ProfileState } from "./actions";
import type { ProfileRow } from "@/lib/types/database";

interface PerfilFormProps {
  profile: ProfileRow;
  email: string;
}

const initial: ProfileState = {};

export function PerfilForm({ profile, email }: PerfilFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initial);
  const e = state.errors ?? {};

  return (
    <form action={formAction} noValidate>
      {state.message && state.ok && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3 text-xs text-cyan-100">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}
      {state.message && !state.ok && (
        <FormAlert type="error" message={state.message} />
      )}

      <ProviderPhotoUpload
        kind="logo"
        name="avatar"
        label="Avatar (opcional)"
        initialUrl={profile.avatar_url}
        error={e.avatar}
        height={140}
      />

      <FormField
        name="full_name"
        label="Nome completo"
        required
        defaultValue={profile.full_name ?? ""}
        error={e.full_name}
      />

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fg-muted">
          E-mail (não editável)
        </label>
        <input
          value={email}
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-ink-800/40 px-3 py-2.5 text-sm text-fg-muted"
        />
        <p className="mt-1 text-xs text-fg-subtle">
          Pra mudar o e-mail da conta, fale com o suporte.
        </p>
      </div>

      <FormField
        name="phone"
        label="Telefone (opcional)"
        inputMode="tel"
        defaultValue={profile.phone ?? ""}
        error={e.phone}
        placeholder="(11) 99999-9999"
        hint="Usado se você quiser ser contatado fora do app."
      />

      <div className="mt-6 flex justify-end">
        <SubmitButton pendingLabel="Salvando…">Salvar perfil</SubmitButton>
      </div>
    </form>
  );
}
