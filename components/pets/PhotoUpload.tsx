"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";

interface PhotoUploadProps {
  name: string;
  initialUrl?: string | null;
  /** Mensagem de erro vinda do server (após submit). */
  error?: string;
}

/**
 * Input file estilizado com preview + remoção.
 *
 * Server action lê via `formData.get("photo")` (File) e `formData.get("photo_clear")`
 * (string "1" se o user removeu a foto antiga, no caso de edição).
 */
export function PhotoUpload({ name, initialUrl, error }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [cleared, setCleared] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

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
        Foto do pet
      </label>

      {previewUrl ? (
        <div className="relative h-48 overflow-hidden rounded-xl border border-white/10 bg-ink-800/70">
          <Image
            src={previewUrl}
            alt="Pré-visualização da foto"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
            unoptimized
          />
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remover foto"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-ink-900/80 text-fg backdrop-blur-sm hover:bg-danger/20 hover:text-danger-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-ink-800/40 text-fg-muted transition-colors hover:border-brand-500/50 hover:text-fg"
        >
          <Camera className="h-8 w-8" />
          <span className="text-sm font-medium">Toque para adicionar foto</span>
          <span className="text-[11px] text-fg-subtle">
            JPG, PNG ou WebP — até 5 MB
          </span>
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
      <input type="hidden" name="photo_clear" value={cleared ? "1" : ""} />

      {!previewUrl && (
        <div className="mt-2 text-center">
          {/* botão alternativo visível pra acessibilidade quando não há preview */}
        </div>
      )}

      {previewUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
        >
          Trocar foto
        </button>
      )}

      {error && <p className="mt-1 text-xs text-danger-fg">{error}</p>}
    </div>
  );
}
