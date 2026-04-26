"use client";

import { useActionState } from "react";
import { CTAButton } from "@/components/ui/CTAButton";
import { FormField } from "@/components/auth/FormField";
import { FormAlert } from "@/components/auth/FormAlert";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ProviderPhotoUpload } from "./ProviderPhotoUpload";
import { PRESTADOR_CATEGORIES } from "@/lib/validation/provider";
import type { PrestadorRow } from "@/lib/types/database";

export interface PrestadorFormState {
  ok?: boolean;
  errors?: Record<string, string>;
  message?: string;
}

interface PrestadorFormProps {
  action: (
    state: PrestadorFormState,
    formData: FormData
  ) => Promise<PrestadorFormState>;
  initial?: PrestadorRow;
  submitLabel: string;
  pendingLabel?: string;
  onDelete?: () => void;
}

const initialState: PrestadorFormState = {};

export function PrestadorForm({
  action,
  initial,
  submitLabel,
  pendingLabel,
  onDelete,
}: PrestadorFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const e = state.errors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-1">
      {state.message && <FormAlert type="error" message={state.message} />}

      <FormField
        name="nome"
        label="Nome do estabelecimento"
        required
        defaultValue={initial?.nome ?? ""}
        error={e.nome}
        placeholder="Ex: Vet Caramelo"
      />

      <Select
        name="categoria"
        label="Categoria"
        required
        defaultValue={initial?.categoria ?? ""}
        error={e.categoria}
        options={[
          { value: "", label: "Selecione…" },
          ...PRESTADOR_CATEGORIES.map((c) => ({
            value: c.value,
            label: c.label,
          })),
        ]}
      />

      <Textarea
        name="descricao"
        label="Descrição"
        defaultValue={initial?.descricao ?? ""}
        error={e.descricao}
        rows={4}
        placeholder="Conte sobre o estabelecimento, serviços, diferenciais…"
      />

      <ProviderPhotoUpload
        kind="logo"
        name="logo"
        label="Logo (opcional)"
        initialUrl={initial?.logo_url}
        error={e.logo}
        height={140}
      />

      <ProviderPhotoUpload
        kind="capa"
        name="capa"
        label="Foto de capa (opcional)"
        initialUrl={initial?.capa_url}
        error={e.capa}
        height={180}
      />

      <fieldset className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
        <legend className="px-2 text-xs font-bold uppercase tracking-wide text-cyan-300">
          Contato
        </legend>

        <FormField
          name="whatsapp"
          label="WhatsApp"
          inputMode="tel"
          defaultValue={initial?.whatsapp ?? ""}
          error={e.whatsapp}
          placeholder="(11) 99999-9999"
        />

        <FormField
          name="telefone"
          label="Telefone fixo (opcional)"
          inputMode="tel"
          defaultValue={initial?.telefone ?? ""}
          error={e.telefone}
        />

        <FormField
          name="email"
          label="E-mail (opcional)"
          type="email"
          defaultValue={initial?.email ?? ""}
          error={e.email}
        />

        <FormField
          name="instagram"
          label="Instagram (opcional)"
          defaultValue={initial?.instagram ?? ""}
          error={e.instagram}
          placeholder="@vetcaramelo"
        />

        <FormField
          name="site"
          label="Site (opcional)"
          type="url"
          defaultValue={initial?.site ?? ""}
          error={e.site}
          placeholder="https://"
        />
      </fieldset>

      <fieldset className="mt-4 rounded-xl border border-white/10 bg-ink-700/30 p-4">
        <legend className="px-2 text-xs font-bold uppercase tracking-wide text-fg-muted">
          Localização
        </legend>

        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            name="cidade"
            label="Cidade"
            required
            defaultValue={initial?.cidade ?? ""}
            error={e.cidade}
          />
          <FormField
            name="bairro"
            label="Bairro (opcional)"
            defaultValue={initial?.bairro ?? ""}
            error={e.bairro}
          />
          <FormField
            name="estado"
            label="UF"
            maxLength={2}
            defaultValue={initial?.estado ?? ""}
            error={e.estado}
            placeholder="SP"
          />
        </div>

        <FormField
          name="endereco"
          label="Endereço completo (opcional)"
          defaultValue={initial?.endereco ?? ""}
          error={e.endereco}
          placeholder="Rua, número, complemento"
        />
      </fieldset>

      <fieldset className="mt-4 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
        <legend className="px-2 text-xs font-bold uppercase tracking-wide text-brand-300">
          Diferenciais
        </legend>

        <Toggle
          name="emergencia24h"
          label="Atende 24h / emergências"
          defaultChecked={initial?.emergencia24h ?? false}
        />
        <Toggle
          name="delivery"
          label="Faz delivery"
          defaultChecked={initial?.delivery ?? false}
        />
        <Toggle
          name="agendamento_online"
          label="Aceita agendamento online"
          defaultChecked={initial?.agendamento_online ?? false}
        />
      </fieldset>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onDelete ? (
          <CTAButton
            variant="ghost"
            onClick={() => {
              if (
                confirm(
                  "Excluir este prestador? As avaliações também serão removidas."
                )
              ) {
                onDelete();
              }
            }}
          >
            Excluir prestador
          </CTAButton>
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
        className={`w-full rounded-lg border bg-ink-800/70 px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
          error
            ? "border-danger/60 focus:border-danger"
            : "border-white/10 focus:border-cyan-500/60"
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
        className={`w-full rounded-lg border bg-ink-800/70 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
          error
            ? "border-danger/60 focus:border-danger"
            : "border-white/10 focus:border-cyan-500/60"
        }`}
      />
      {error && <p className="mt-1 text-xs text-danger-fg">{error}</p>}
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 py-1.5 text-sm text-fg">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-white/20 bg-ink-800 text-brand-500 focus:ring-brand-500/40"
      />
      {label}
    </label>
  );
}
