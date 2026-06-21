"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import Image from "next/image";
import { Camera, MapPin, Loader2, CheckCircle, X, ChevronDown } from "lucide-react";
import { registrarAvistamentoAction, type RegistrarAvistamentoState } from "./actions";

interface Props {
  petId: string;
  petName: string | null;
}

const initial: RegistrarAvistamentoState = {};

export default function SightingInlineButton({ petId, petName }: Props) {
  const [isOpen, setIsOpen]         = useState(false);
  const [photoPreview, setPreview]  = useState<string | null>(null);
  const [locating, setLocating]     = useState(false);
  const [gpsOk, setGpsOk]          = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const latRef  = useRef<HTMLInputElement>(null);
  const lngRef  = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action, pending] = useActionState(registrarAvistamentoAction, initial);

  // Fecha automaticamente 2s após sucesso
  useEffect(() => {
    if (!state.success) return;
    const t = setTimeout(handleClose, 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleGPS() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (latRef.current) latRef.current.value = String(coords.latitude);
        if (lngRef.current) lngRef.current.value = String(coords.longitude);
        setGpsOk(true);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  function handleClose() {
    setIsOpen(false);
    clearPhoto();
    setGpsOk(false);
    if (latRef.current)  latRef.current.value  = "";
    if (lngRef.current)  lngRef.current.value  = "";
    formRef.current?.reset();
  }

  // ── Sucesso ──────────────────────────────────────────────────────────────
  if (state.success) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-400">
        <CheckCircle className="h-4 w-4 shrink-0" />
        Avistamento registrado! Obrigado.
      </div>
    );
  }

  // ── Botão colapsado ───────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
      >
        <MapPin className="h-3.5 w-3.5" />
        Vi esse animal
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
    );
  }

  // ── Formulário inline ─────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-xl border border-cyan-500/20 bg-ink-800/60 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-cyan-300">
          📍 Vi esse animal{petName ? ` — ${petName}` : ""}
        </p>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="rounded p-0.5 text-fg-subtle transition-colors hover:text-fg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form ref={formRef} action={action} className="space-y-3">
        {/* Campos ocultos */}
        <input type="hidden" name="pet_id" value={petId} />
        <input type="hidden" name="lat" ref={latRef} defaultValue="" />
        <input type="hidden" name="lng" ref={lngRef} defaultValue="" />

        {/* ── Foto ── */}
        <input
          ref={fileRef}
          id={`sighting-photo-${petId}`}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="sr-only"
        />

        {photoPreview ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10">
            <Image
              src={photoPreview}
              alt="Foto do avistamento"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white transition-colors hover:bg-black/90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={`sighting-photo-${petId}`}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-ink-900/40 py-5 text-center transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/5"
          >
            <Camera className="h-6 w-6 text-fg-subtle" />
            <span className="text-xs text-fg-muted">
              Adicionar foto{" "}
              <span className="text-fg-subtle">(opcional)</span>
            </span>
            <span className="text-[10px] text-fg-subtle">
              JPG, PNG ou WebP — máximo 5 MB
            </span>
          </label>
        )}

        {/* ── GPS ── */}
        <button
          type="button"
          onClick={handleGPS}
          disabled={locating || gpsOk}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
            gpsOk
              ? "border-green-500/30 bg-green-500/10 text-green-400 cursor-default"
              : "border-white/10 bg-ink-700/40 text-fg-muted hover:border-cyan-500/30 hover:text-cyan-300"
          }`}
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : gpsOk ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <MapPin className="h-3.5 w-3.5" />
          )}
          {gpsOk
            ? "Localização capturada ✓"
            : locating
            ? "Localizando..."
            : "Usar minha localização agora"}
        </button>

        {!gpsOk && (
          <p className="text-center text-[10px] text-fg-subtle">
            Localização obrigatória para registrar o avistamento
          </p>
        )}

        {/* ── Endereço ── */}
        <input
          type="text"
          name="address"
          placeholder="Endereço ou referência (ex: Pça da República, perto do mercado)"
          maxLength={240}
          className="w-full rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2 text-xs text-fg placeholder:text-fg-subtle focus:border-cyan-500/50 focus:outline-none"
        />

        {/* ── Descrição ── */}
        <textarea
          name="description"
          placeholder="O que você viu? Estado do animal, comportamento, direção que foi..."
          maxLength={1000}
          rows={2}
          className="w-full resize-none rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2 text-xs text-fg placeholder:text-fg-subtle focus:border-cyan-500/50 focus:outline-none"
        />

        {/* ── Erro ── */}
        {state.error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {state.error}
          </p>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={pending || !gpsOk}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {pending ? "Enviando..." : "Registrar avistamento"}
        </button>
      </form>
    </div>
  );
}
