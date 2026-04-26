"use client";

import { useActionState } from "react";
import { CTAButton } from "@/components/ui/CTAButton";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { PhotoUpload } from "./PhotoUpload";
import type { PetRow } from "@/lib/types/database";

export interface PetFormState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
}

interface PetFormProps {
  action: (state: PetFormState, formData: FormData) => Promise<PetFormState>;
  initial?: PetRow;
  /** Texto do botão principal — "Cadastrar pet" / "Salvar alterações" */
  submitLabel: string;
  pendingLabel?: string;
  /** Mostrar botão "Excluir registro" (só na edição) */
  onDelete?: () => void;
}

const today = new Date().toISOString().slice(0, 10);

const initialState: PetFormState = {};

/**
 * Form completo de pet — usado em /pets/novo e /pets/[id]/editar.
 *
 * Server Action recebe FormData; client só faz UX (preview, errors).
 * Validação real (Zod) acontece dentro da action.
 */
export function PetForm({
  action,
  initial,
  submitLabel,
  pendingLabel,
  onDelete,
}: PetFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const e = state.errors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-1">
      {state.message && <FormAlert type="error" message={state.message} />}

      {/* Tipo de registro: lost / found */}
      <fieldset className="mb-5">
        <legend className="mb-2 block text-xs font-bold uppercase tracking-wide text-fg-muted">
          Tipo de registro
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <KindRadio
            name="kind"
            value="lost"
            label="Perdi meu pet"
            color="brand"
            defaultChecked={initial?.kind === "lost" || !initial}
          />
          <KindRadio
            name="kind"
            value="found"
            label="Encontrei um pet"
            color="cyan"
            defaultChecked={initial?.kind === "found"}
          />
        </div>
        {e.kind && (
          <p className="mt-1 text-xs text-danger-fg">{e.kind}</p>
        )}
      </fieldset>

      <PhotoUpload
        name="photo"
        initialUrl={initial?.photo_url}
        error={e.photo}
      />

      <FormField
        name="name"
        label="Nome do pet (opcional)"
        defaultValue={initial?.name ?? ""}
        error={e.name}
        placeholder="Ex: Thor"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          name="species"
          label="Espécie"
          required
          defaultValue={initial?.species ?? ""}
          error={e.species}
          options={[
            { value: "", label: "Selecione…" },
            { value: "dog", label: "Cão" },
            { value: "cat", label: "Gato" },
            { value: "other", label: "Outro" },
          ]}
        />

        <FormField
          name="breed"
          label="Raça (opcional)"
          defaultValue={initial?.breed ?? ""}
          error={e.breed}
          placeholder="Ex: SRD, Poodle"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FormField
          name="color"
          label="Cor predominante"
          required
          defaultValue={initial?.color ?? ""}
          error={e.color}
          placeholder="Ex: caramelo"
        />

        <Select
          name="size"
          label="Porte"
          defaultValue={initial?.size ?? ""}
          error={e.size}
          options={[
            { value: "", label: "—" },
            { value: "small", label: "Pequeno" },
            { value: "medium", label: "Médio" },
            { value: "large", label: "Grande" },
          ]}
        />

        <Select
          name="sex"
          label="Sexo"
          defaultValue={initial?.sex ?? ""}
          error={e.sex}
          options={[
            { value: "", label: "—" },
            { value: "male", label: "Macho" },
            { value: "female", label: "Fêmea" },
            { value: "unknown", label: "Não sei" },
          ]}
        />
      </div>

      <FormField
        name="age_approx"
        label="Idade aproximada (opcional)"
        defaultValue={initial?.age_approx ?? ""}
        error={e.age_approx}
        placeholder="Ex: filhote, ~2 anos, idoso"
      />

      <Textarea
        name="description"
        label="Descrição (opcional)"
        defaultValue={initial?.description ?? ""}
        error={e.description}
        rows={3}
        placeholder="Coleira, marcas, sinais distintivos…"
      />

      <FormField
        name="behavior"
        label="Comportamento (opcional)"
        defaultValue={initial?.behavior ?? ""}
        error={e.behavior}
        placeholder="Ex: dócil, arisco, machucado"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <FormField
          name="neighborhood"
          label="Bairro"
          required
          defaultValue={initial?.neighborhood ?? ""}
          error={e.neighborhood}
        />
        <FormField
          name="city"
          label="Cidade"
          required
          defaultValue={initial?.city ?? ""}
          error={e.city}
        />
        <FormField
          name="state"
          label="UF"
          maxLength={2}
          defaultValue={initial?.state ?? ""}
          error={e.state}
          placeholder="SP"
        />
      </div>

      <FormField
        name="event_date"
        label="Data do desaparecimento ou encontro"
        type="date"
        required
        defaultValue={initial?.event_date ?? today}
        max={today}
        error={e.event_date}
      />

      <fieldset className="mt-6 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
        <legend className="px-2 text-xs font-bold uppercase tracking-wide text-cyan-300">
          Contato
        </legend>

        <FormField
          name="contact_name"
          label="Seu nome"
          required
          defaultValue={initial?.contact_name ?? ""}
          error={e.contact_name}
        />

        <FormField
          name="contact_phone"
          label="Telefone / WhatsApp"
          required
          inputMode="tel"
          defaultValue={initial?.contact_phone ?? ""}
          error={e.contact_phone}
          placeholder="(11) 99999-9999"
        />

        <label className="mt-1 flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="contact_whatsapp"
            defaultChecked={initial?.contact_whatsapp ?? true}
            className="h-4 w-4 rounded border-white/20 bg-ink-800 text-brand-500 focus:ring-brand-500/40"
          />
          Este número tem WhatsApp
        </label>
      </fieldset>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onDelete ? (
          <DeleteConfirm onConfirm={onDelete} />
        ) : (
          <span />
        )}
        <SubmitButton pendingLabel={pendingLabel ?? "Salvando…"}>
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}

// ----- helpers internos -----

function KindRadio({
  name,
  value,
  label,
  color,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  color: "brand" | "cyan";
  defaultChecked?: boolean;
}) {
  const ring =
    color === "brand"
      ? "peer-checked:border-brand-500 peer-checked:bg-brand-500/15 peer-checked:shadow-glow-brand peer-checked:text-brand-300"
      : "peer-checked:border-cyan-500 peer-checked:bg-cyan-500/15 peer-checked:shadow-glow-cyan peer-checked:text-cyan-300";
  return (
    <label className="relative cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
        required
      />
      <div
        className={`rounded-xl border-2 border-white/10 bg-ink-800/50 px-4 py-3 text-center text-sm font-bold text-fg-muted transition-all hover:border-white/20 ${ring}`}
      >
        {label}
      </div>
    </label>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
  error,
  required,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fg-muted"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={!!error}
        className={`w-full rounded-lg border bg-ink-800/70 px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          error
            ? "border-danger/60 focus:border-danger"
            : "border-white/10 focus:border-brand-500/60"
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger-fg">{error}</p>}
    </div>
  );
}

function Textarea({
  name,
  label,
  defaultValue,
  error,
  rows,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fg-muted"
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows ?? 3}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`w-full rounded-lg border bg-ink-800/70 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle/70 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          error
            ? "border-danger/60 focus:border-danger"
            : "border-white/10 focus:border-brand-500/60"
        }`}
      />
      {error && <p className="mt-1 text-xs text-danger-fg">{error}</p>}
    </div>
  );
}

function DeleteConfirm({ onConfirm }: { onConfirm: () => void }) {
  return (
    <CTAButton
      variant="ghost"
      onClick={() => {
        if (confirm("Excluir este registro? Esta ação não pode ser desfeita.")) {
          onConfirm();
        }
      }}
    >
      Excluir registro
    </CTAButton>
  );
}
