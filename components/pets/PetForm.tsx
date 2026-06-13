"use client";

import { useActionState, useRef, useState } from "react";
import type { PetRow } from "@/lib/types/database";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import { MascotFormGuide } from "@/components/ui/MascotFormGuide";

// ── Tipos exportados (importados por actions) ─────────────────────────────────

export interface PetFormState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
}

export interface PetFormProps {
  action: (state: PetFormState, formData: FormData) => Promise<PetFormState>;
  initial?: PetRow;
  submitLabel?: string;
  pendingLabel?: string;
  showCaptcha?: boolean;
  defaultKind?: "lost" | "found";
  onDelete?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = (err?: string) =>
  [
    "w-full rounded-lg border px-3 py-2.5 text-sm bg-white text-fg",
    "placeholder:text-fg-muted focus:outline-none focus:ring-2 transition-colors duration-200",
    err
      ? "border-danger/60 focus:border-danger focus:ring-danger/20"
      : "border-warm-200 focus:border-brand-500/60 focus:ring-brand-500/20",
  ].join(" ");

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-fg-muted">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

const initialState: PetFormState = { ok: false };

export function PetForm({
  action,
  initial,
  submitLabel = "Salvar",
  pendingLabel = "Salvando…",
  showCaptcha = false,
  defaultKind = "lost",
  onDelete,
}: PetFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [mascotSpecies, setMascotSpecies] = useState<'dog' | 'cat' | 'other'>(
    (initial?.species as 'dog' | 'cat' | 'other') ?? 'dog'
  );
  const [mascotSection, setMascotSection] = useState<
    'welcome' | 'photo' | 'location' | 'description' | 'contact' | 'success' | 'error'
  >('welcome');

  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = def?.latitude != null ? Number(def.latitude) : null
    const lng = def?.longitude != null ? Number(def.longitude) : null
    return lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
      ? { lat, lng }
      : null
  })
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'denied' | 'error'>('idle')

  function captureGps() {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('idle')
      },
      (err) => setGpsStatus(err.code === 1 ? 'denied' : 'error'),
      { timeout: 10_000, maximumAge: 60_000 }
    )
  }

  const e = (field: string) => state.errors?.[field];

  // Valores iniciais para o modo de edição
  const def = initial ?? null;

  // Sincroniza seção do mascote com resultado do envio
  const currentSection = state.ok
    ? 'success'
    : state.message && !state.ok && !isPending
    ? 'error'
    : mascotSection;

  return (
    <form action={formAction} className="space-y-5" noValidate>

      {/* Mascote guia contextual */}
      <MascotFormGuide
        species={mascotSpecies}
        section={currentSection}
        className="mb-1"
      />

      {/* Captcha hidden field */}
      {captchaToken && (
        <input type="hidden" name="cf-turnstile-response" value={captchaToken} />
      )}

      {/* Mensagem de erro global */}
      {state.message && !state.ok && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.message}
        </div>
      )}

      {/* Tipo */}
      <Field label="O que aconteceu?" required error={e("kind")}>
        <div className="grid grid-cols-2 gap-3">
          {(["lost", "found"] as const).map((k) => (
            <label
              key={k}
              className={[
                "flex items-center justify-center gap-2 rounded-lg border",
                "px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200",
              ].join(" ")}
            >
              <input
                type="radio"
                name="kind"
                value={k}
                defaultChecked={(def?.kind ?? defaultKind) === k}
                className="sr-only"
              />
              {k === "lost" ? "🐾 Perdi meu pet" : "🔍 Encontrei um pet"}
            </label>
          ))}
        </div>
      </Field>

      {/* Espécie + Porte */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Espécie" required error={e("species")}>
          <select
            name="species"
            defaultValue={def?.species ?? "dog"}
            className={inputCls(e("species"))}
            onChange={(ev) => setMascotSpecies(ev.target.value as 'dog' | 'cat' | 'other')}
          >
            <option value="dog">Cachorro</option>
            <option value="cat">Gato</option>
            <option value="other">Outro</option>
          </select>
        </Field>
        <Field label="Porte" error={e("size")}>
          <select name="size" defaultValue={def?.size ?? ""} className={inputCls(e("size"))}>
            <option value="">Não sei</option>
            <option value="small">Pequeno</option>
            <option value="medium">Médio</option>
            <option value="large">Grande</option>
          </select>
        </Field>
      </div>

      {/* Nome + Raça */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome do pet" error={e("name")}>
          <input type="text" name="name" defaultValue={def?.name ?? ""} maxLength={60} placeholder="Ex: Rex, Mimi…" className={inputCls(e("name"))} />
        </Field>
        <Field label="Raça" error={e("breed")}>
          <input type="text" name="breed" defaultValue={def?.breed ?? ""} maxLength={60} placeholder="Ex: SRD, Labrador…" className={inputCls(e("breed"))} />
        </Field>
      </div>

      {/* Cor + Sexo */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cor predominante" required error={e("color")}>
          <input type="text" name="color" defaultValue={def?.color ?? ""} maxLength={60} placeholder="Ex: caramelo, preto…" className={inputCls(e("color"))} />
        </Field>
        <Field label="Sexo" error={e("sex")}>
          <select name="sex" defaultValue={def?.sex ?? "unknown"} className={inputCls(e("sex"))}>
            <option value="unknown">Não sei</option>
            <option value="male">Macho</option>
            <option value="female">Fêmea</option>
          </select>
        </Field>
      </div>

      {/* Idade */}
      <Field label="Idade aproximada" error={e("age_approx")}>
        <input type="text" name="age_approx" defaultValue={def?.age_approx ?? ""} maxLength={40} placeholder="Ex: filhote, 2 anos, adulto…" className={inputCls(e("age_approx"))} />
      </Field>

      {/* Descrição */}
      <Field label="Descrição" error={e("description")}>
        <textarea name="description" defaultValue={def?.description ?? ""} rows={4} maxLength={1000} placeholder="Características físicas, marcas especiais…" className={`${inputCls(e("description"))} resize-none`} onFocus={() => setMascotSection('description')} />
      </Field>

      {/* Comportamento */}
      <Field label="Comportamento" error={e("behavior")}>
        <input type="text" name="behavior" defaultValue={def?.behavior ?? ""} maxLength={200} placeholder="Ex: dócil, arisco, machucado…" className={inputCls(e("behavior"))} />
      </Field>

      {/* Foto */}
      <Field label="Foto do pet" error={e("photo")}>
        {def?.photo_url && (
          <div className="flex items-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={def.photo_url} alt="Foto atual" className="h-16 w-16 rounded-lg object-cover" />
            <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer">
              <input type="checkbox" name="photo_clear" value="1" className="accent-danger" />
              Remover foto atual
            </label>
          </div>
        )}
        <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm text-fg-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-300 hover:file:bg-brand-500/20 cursor-pointer" onFocus={() => setMascotSection('photo')} />
        <p className="text-xs text-fg-subtle">JPEG, PNG ou WebP · máx. 5 MB</p>
      </Field>

      {/* Localização */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Bairro" required error={e("neighborhood")}>
          <input type="text" name="neighborhood" defaultValue={def?.neighborhood ?? ""} maxLength={80} placeholder="Ex: Centro, Gonzaga…" className={inputCls(e("neighborhood"))} onFocus={() => setMascotSection('location')} />
        </Field>
        <Field label="Cidade" required error={e("city")}>
          <input type="text" name="city" defaultValue={def?.city ?? ""} maxLength={80} placeholder="Ex: Santos, Guarujá…" className={inputCls(e("city"))} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Estado" error={e("state")}>
          <input type="text" name="state" defaultValue={def?.state ?? ""} maxLength={2} placeholder="SP" className={inputCls(e("state"))} />
        </Field>
        <Field label="Data do evento" required error={e("event_date")}>
          <input type="date" name="event_date" defaultValue={def?.event_date ?? ""} max={new Date().toISOString().split("T")[0]} className={inputCls(e("event_date"))} />
        </Field>
      </div>

      {/* GPS — captura de localização via navegador */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={captureGps}
          disabled={gpsStatus === 'loading'}
          className="flex items-center gap-1.5 rounded-lg border border-warm-200 bg-white px-3 py-2 text-xs font-medium text-fg-muted hover:border-brand-500/40 hover:text-brand-600 transition-all disabled:opacity-50"
        >
          {gpsStatus === 'loading' ? '⏳ Obtendo localização…' : '📍 Usar minha localização'}
        </button>
        {gpsCoords && (
          <span className="text-xs text-emerald-400">✓ Coordenadas capturadas</span>
        )}
        {gpsStatus === 'denied' && (
          <span className="text-xs text-danger">Permissão negada — verifique as configurações do navegador</span>
        )}
        {gpsStatus === 'error' && (
          <span className="text-xs text-danger">Não foi possível obter a localização</span>
        )}
      </div>
      {gpsCoords && (
        <>
          <input type="hidden" name="latitude"  value={gpsCoords.lat} />
          <input type="hidden" name="longitude" value={gpsCoords.lng} />
        </>
      )}

      {/* Contato */}
      <fieldset className="rounded-xl border border-warm-200 bg-warm-50 p-4 space-y-4">
        <legend className="px-1 text-xs font-semibold text-fg-muted uppercase tracking-wider">Contato</legend>
        <p className="text-xs text-fg-subtle">Visível apenas na página de detalhes — não aparece na listagem.</p>

        <Field label="Seu nome" required error={e("contact_name")}>
          <input type="text" name="contact_name" defaultValue={def?.contact_name ?? ""} maxLength={80} placeholder="Como quer ser chamado…" className={inputCls(e("contact_name"))} />
        </Field>

        <Field label="Telefone / WhatsApp" required error={e("contact_phone")}>
          <input type="tel" name="contact_phone" defaultValue={def?.contact_phone ?? ""} maxLength={20} placeholder="(13) 99999-9999" className={inputCls(e("contact_phone"))} />
        </Field>

        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-fg-muted">
          <input type="checkbox" name="contact_whatsapp" value="on" defaultChecked={def?.contact_whatsapp ?? false} className="accent-brand-500 h-4 w-4" />
          Este número tem WhatsApp
        </label>
      </fieldset>

      {/* Turnstile — apenas para cadastros anônimos */}
      {showCaptcha && (
        <TurnstileWidget onTokenChange={(t) => setCaptchaToken(t)} />
      )}

      {/* Botão de delete (edição) */}
      {onDelete && (
        <button type="button" onClick={onDelete} disabled={isPending} className="w-full rounded-lg border border-danger/40 bg-danger/10 py-2.5 text-sm font-medium text-danger hover:bg-danger/20 transition-colors disabled:opacity-50">
          Excluir este pet
        </button>
      )}

      {/* Submit */}
      <button type="submit" disabled={isPending || (showCaptcha && !captchaToken)} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {isPending ? pendingLabel : submitLabel}
      </button>

    </form>
  );
}
