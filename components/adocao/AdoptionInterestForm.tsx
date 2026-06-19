"use client";

import { useActionState } from "react";
import { submitAdoptionInterest } from "@/app/adotar/actions";

interface Props {
  petId: string;
  petName: string;
  shelterId: string;
  shelterEmail: string | null;
}

type FormState = { success: boolean; error?: string } | null;

export function AdoptionInterestForm({ petId, petName, shelterId, shelterEmail }: Props) {
  const [state, action, pending] = useActionState(
    submitAdoptionInterest,
    null as FormState
  );

  if (state?.success) {
    return (
      <div className="mt-4 rounded-xl bg-green-50 p-4 text-center text-sm font-medium text-green-700">
        ✅ Interesse enviado! A ONG entrará em contato em breve.
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="pet_id" value={petId} />
      <input type="hidden" name="pet_name" value={petName} />
      <input type="hidden" name="shelter_id" value={shelterId} />
      {shelterEmail && (
        <input type="hidden" name="shelter_email" value={shelterEmail} />
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-fg-muted">
          Seu nome *
        </label>
        <input
          name="adopter_name"
          required
          placeholder="Nome completo"
          className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-fg-muted">
          WhatsApp *
        </label>
        <input
          name="adopter_phone"
          required
          type="tel"
          placeholder="(13) 9 9999-9999"
          className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-fg-muted">
          Cidade *
        </label>
        <input
          name="adopter_city"
          required
          placeholder="Sua cidade"
          className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-fg-muted">
          Mensagem (opcional)
        </label>
        <textarea
          name="message"
          rows={3}
          placeholder="Conte um pouco sobre você e seu lar..."
          className="w-full resize-none rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      {state?.error && (
        <p className="text-xs text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-400 hover:shadow-glow-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar interesse"}
      </button>

      <p className="text-center text-[10px] text-fg-subtle">
        Seus dados são enviados apenas para a ONG responsável pelo animal.
      </p>
    </form>
  );
}
