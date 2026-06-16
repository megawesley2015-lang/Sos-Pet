"use client";

import { useState } from "react";
import { PawPrint, Upload, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TipoUsuario } from "@/app/cadastro/OnboardingClient";

type Props = {
  tipoUsuario: TipoUsuario;
  onConcluir: () => Promise<void>;
  onPetCadastrado: () => Promise<void>;
  onSkip: () => void;
  isPending: boolean;
};

type FormData = {
  name: string;
  species: "dog" | "cat" | "bird" | "other";
  kind: "lost" | "found";
};

export function StepPrimeiroPet({ tipoUsuario, onConcluir, onPetCadastrado, onSkip, isPending }: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    species: "dog",
    kind: "lost",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isLoading = isSubmitting || isPending;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Nome do pet é obrigatório.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Sessão expirada. Faça login novamente.");
        return;
      }

      let photo_url: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const filename = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pet-images")
          .upload(filename, photoFile, { upsert: false });

        if (uploadError) {
          setError("Erro ao enviar foto. Tente novamente.");
          return;
        }

        const { data: urlData } = supabase.storage
          .from("pet-images")
          .getPublicUrl(filename);
        photo_url = urlData.publicUrl;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from("pets")
        .insert({
          owner_id: user.id,
          name: formData.name.trim(),
          species: formData.species,
          kind: formData.kind,
          status: "active",
          city: "Santos",
          color: "não informado",
          neighborhood: "não informado",
          contact_name: (user.user_metadata?.full_name as string | undefined) ?? "Tutor",
          contact_phone: "",
          ...(photo_url ? { photo_url } : {}),
        });

      if (insertError) {
        setError("Erro ao cadastrar pet. Tente novamente.");
        return;
      }

      setSuccess(true);
      await onPetCadastrado();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="h-16 w-16 text-[rgb(var(--color-primary))]" />
        <p className="text-lg font-bold text-[rgb(var(--color-fg))]">
          Pet cadastrado com sucesso!
        </p>
        <p className="text-sm text-[rgb(var(--color-fg-muted))]">
          Redirecionando para seus pets…
        </p>
      </div>
    );
  }

  if (tipoUsuario === "prestador") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-[rgb(var(--color-primary)/0.3)] bg-[rgb(var(--color-primary)/0.05)] p-4 text-sm">
          <p className="font-semibold text-[rgb(var(--color-fg))]">
            Perfil de prestador
          </p>
          <p className="mt-1 text-[rgb(var(--color-fg-muted))]">
            Seu perfil de serviço pode ser configurado no painel do prestador após o cadastro.
          </p>
        </div>

        <button
          type="button"
          onClick={onConcluir}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Finalizando…" : "Concluir cadastro"}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          className="w-full rounded-xl border border-[rgb(var(--color-fg-subtle)/0.3)] px-6 py-3 text-sm font-medium text-[rgb(var(--color-fg-muted))] transition-colors hover:text-[rgb(var(--color-fg))] disabled:opacity-50"
        >
          Pular por agora
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="mb-5 text-sm text-[rgb(var(--color-fg-muted))]">
        Cadastre seu primeiro pet perdido ou encontrado.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="pet-name" className="mb-1.5 block text-sm font-semibold text-[rgb(var(--color-fg))]">
            <span className="flex items-center gap-1.5">
              <PawPrint className="h-4 w-4 text-[rgb(var(--color-primary))]" />
              Nome do pet
            </span>
          </label>
          <input
            id="pet-name"
            type="text"
            placeholder="Ex: Mel, Bolinha, Princesa"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            disabled={isLoading}
            className="w-full rounded-lg border border-[rgb(var(--color-fg-subtle)/0.3)] bg-[rgb(var(--color-bg-elevated,var(--color-bg)))] px-4 py-2.5 text-sm text-[rgb(var(--color-fg))] placeholder:text-[rgb(var(--color-fg-muted))] focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary)/0.4)] disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pet-species" className="mb-1.5 block text-sm font-semibold text-[rgb(var(--color-fg))]">
              Espécie
            </label>
            <select
              id="pet-species"
              value={formData.species}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  species: e.target.value as FormData["species"],
                }))
              }
              disabled={isLoading}
              className="w-full rounded-lg border border-[rgb(var(--color-fg-subtle)/0.3)] bg-[rgb(var(--color-bg-elevated,var(--color-bg)))] px-3 py-2.5 text-sm text-[rgb(var(--color-fg))] focus:border-[rgb(var(--color-primary))] focus:outline-none disabled:opacity-50"
            >
              <option value="dog">Cachorro</option>
              <option value="cat">Gato</option>
              <option value="bird">Pássaro</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="pet-kind" className="mb-1.5 block text-sm font-semibold text-[rgb(var(--color-fg))]">
              Situação
            </label>
            <select
              id="pet-kind"
              value={formData.kind}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  kind: e.target.value as FormData["kind"],
                }))
              }
              disabled={isLoading}
              className="w-full rounded-lg border border-[rgb(var(--color-fg-subtle)/0.3)] bg-[rgb(var(--color-bg-elevated,var(--color-bg)))] px-3 py-2.5 text-sm text-[rgb(var(--color-fg))] focus:border-[rgb(var(--color-primary))] focus:outline-none disabled:opacity-50"
            >
              <option value="lost">Perdido</option>
              <option value="found">Encontrado</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[rgb(var(--color-fg))]">
            <span className="flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-[rgb(var(--color-primary))]" />
              Foto (opcional)
            </span>
          </label>
          <label
            htmlFor="pet-photo"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[rgb(var(--color-fg-subtle)/0.3)] p-6 transition-colors hover:border-[rgb(var(--color-primary))]"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Pré-visualização do pet"
                className="h-32 w-32 rounded-lg object-cover"
              />
            ) : (
              <>
                <Upload className="h-8 w-8 text-[rgb(var(--color-fg-muted))]" />
                <span className="text-xs text-[rgb(var(--color-fg-muted))]">
                  Clique para enviar uma foto
                </span>
              </>
            )}
            <input
              id="pet-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={isLoading}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Cadastrando…" : "Cadastrar pet e concluir"}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          className="w-full rounded-xl border border-[rgb(var(--color-fg-subtle)/0.3)] px-6 py-3 text-sm font-medium text-[rgb(var(--color-fg-muted))] transition-colors hover:text-[rgb(var(--color-fg))] disabled:opacity-50"
        >
          Pular por agora
        </button>
      </div>
    </form>
  );
}
