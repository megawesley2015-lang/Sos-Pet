'use client'
// components/ui/PhotoUpload.tsx — preview local imediato + upload Supabase

import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadPetPhoto, uploadPetPhotoAnon, StorageError } from '@/lib/storage'

interface PhotoUploadProps {
  userId?:    string
  onUpload:   (url: string, path: string) => void
  onError:    (message: string) => void
  className?: string
}

export function PhotoUpload({
  userId,
  onUpload,
  onError,
  className = '',
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setLoading(true)

    try {
      const result = userId
        ? await uploadPetPhoto(file, userId)
        : await uploadPetPhotoAnon(file)
      onUpload(result.url, result.path)
    } catch (err) {
      setPreview(null)
      onError(err instanceof StorageError ? err.message : 'Erro inesperado no upload')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleClear() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        aria-label="Selecionar foto do pet"
        className="sr-only"
      />

      {preview ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[rgb(var(--color-border))]">
          <Image src={preview} alt="Preview da foto do pet" fill className="object-cover" unoptimized />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span className="text-xs text-white">Enviando...</span>
            </div>
          )}

          {!loading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-black/90 transition-colors"
            >
              Trocar foto
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="
            flex w-full flex-col items-center justify-center gap-3 rounded-xl
            border border-dashed border-[rgb(var(--color-border))]
            bg-[rgb(var(--color-bg-overlay))]
            p-10 text-center
            hover:border-[rgb(var(--color-primary))]/40
            hover:bg-[rgb(var(--color-primary))]/5
            transition-all duration-200
            focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-[rgb(var(--color-primary))]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <span className="text-3xl" aria-hidden="true">📷</span>
          <div>
            <p className="text-sm font-medium text-[rgb(var(--color-fg-muted))]">Adicionar foto do pet</p>
            <p className="mt-1 text-xs text-[rgb(var(--color-fg-subtle))]">JPG, PNG ou WebP — máximo 5MB</p>
          </div>
        </button>
      )}
    </div>
  )
}
