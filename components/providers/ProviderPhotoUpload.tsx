"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";

interface ProviderPhotoUploadProps {
  kind: "logo" | "capa";
  name: string;
  label: string;
  initialUrl?: string | null;
  error?: string;
  height?: number;
}

/**
 * Upload de foto pra prestador (logo ou capa). Mesma lógica do PhotoUpload do
 * pet, mas com altura/aspect customizável e label semântico.
 */
export function ProviderPhotoUpload({
  kind,
  name,
  label,
  initialUrl,
  error,
  height = 160,
}: ProviderPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!file) {
      setPreviewUrl(initialUrl ?? null);
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
    setCleared(false);
  }

  function handleClear() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (inputRef.current) inputRef.current.value = "";
    setPreviewUrl(null);
    setCleared(true);
  }

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fg-muted">
        {label}
      </label>

      {previewUrl ? (
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 bg-ink-800/70"
          style={{ height }}
        >
          <Image
            src={previewUrl}
            alt={`Pré-visualização ${kind}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
            unoptimized
          />
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remover"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-ink-900/80 text-fg backdrop-blur-sm hover:bg-danger/20 hover:text-danger-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ height }}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-white/15 bg-ink-800/40 text-fg-muted transition-colors hover:border-cyan-500/50 hover:text-fg"
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm font-medium">
            Toque para adicionar {kind === "logo" ? "logo" : "capa"}
          </span>
          <span className="text-[11px] text-fg-subtle">JPG/PNG/WebP — até 5 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
      <input type="hidden" name={`${name}_clear`} value={cleared ? "1" : ""} />

      {previewUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
        >
          Trocar imagem
        </button>
      )}

      {error && <p className="mt-1 text-xs text-danger-fg">{error}</p>}
    </div>
  );
}
