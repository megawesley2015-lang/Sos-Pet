"use client";

import { useActionState, useState, useRef } from "react";
import { Camera, MapPin, CheckCircle2, Loader2, Building2, Phone, Mail } from "lucide-react";
import { cadastrarSentinela } from "./actions";
import type { SentinelaFormState } from "./actions";
import { SENTINEL_TYPES } from "./constants";
import Link from "next/link";

const TYPE_LABELS: Record<(typeof SENTINEL_TYPES)[number], string> = {
  pet_shop:    "Pet Shop",
  vet:         "Clínica Veterinária",
  condo:       "Condomínio",
  market:      "Mercado / Padaria",
  pharmacy:    "Farmácia",
  gas_station: "Posto de Gasolina",
  school:      "Escola / Creche",
  park:        "Parque / Área verde",
  other:       "Outro",
};

const INITIAL_STATE: SentinelaFormState = {};

export function SentinelaForm() {
  const [state, action, pending] = useActionState(cadastrarSentinela, INITIAL_STATE);

  // Geolocalização
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Para Nominatim: geocodifica endereço quando usuário nao tem GPS
  const cityRef    = useRef<HTMLInputElement>(null);
  const neighRef   = useRef<HTMLInputElement>(null);
  const addrRef    = useRef<HTMLInputElement>(null);

  const capturarGPS = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocalização não suportada neste dispositivo.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setGeoError("Permissão negada ou posição indisponível.");
        setGeoLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const geocodificarEndereco = async () => {
    const parts = [
      addrRef.current?.value,
      neighRef.current?.value,
      cityRef.current?.value,
    ].filter(Boolean).join(", ");

    if (!parts) {
      setGeoError("Preencha ao menos a cidade antes de geocodificar.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parts + ", Brasil")}&format=json&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
      const json = await res.json();
      if (json.length > 0) {
        setCoords({ lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) });
      } else {
        setGeoError("Endereço não encontrado. Tente o GPS ou ajuste o nome da cidade.");
      }
    } catch {
      setGeoError("Falha ao consultar geocodificação. Verifique a internet.");
    } finally {
      setGeoLoading(false);
    }
  };

  const fe = state.fieldErrors ?? {};

  if (state.success) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" />
        <h2 className="font-display text-xl font-bold text-fg mb-2">
          Cadastro recebido!
        </h2>
        <p className="text-sm text-fg-muted mb-6">
          Seu estabelecimento foi registrado na Rede Sentinela. Nossa equipe irá verificar
          e ativar o alfinete no mapa em até 48h.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/mapa"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow-brand hover:bg-brand-400"
          >
            🗺️ Ver mapa
          </Link>
          <Link
            href="/sentinela/novo"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-ink-700 px-4 py-2.5 text-sm font-bold text-fg hover:bg-ink-600"
          >
            Cadastrar outro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      {/* Nome */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-fg">
          Nome do estabelecimento <span className="text-brand-400">*</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            name="name"
            required
            maxLength={120}
            placeholder="Ex: Pet Shop Amigo Fiel"
            className="w-full rounded-lg border border-white/10 bg-ink-700 pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          />
        </div>
        {fe.name && <p className="mt-1 text-xs text-red-400">{fe.name[0]}</p>}
      </div>

      {/* Tipo */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-fg">
          Tipo de estabelecimento <span className="text-brand-400">*</span>
        </label>
        <select
          name="type"
          required
          defaultValue=""
          className="w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
        >
          <option value="" disabled>Selecione…</option>
          {SENTINEL_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        {fe.type && <p className="mt-1 text-xs text-red-400">{fe.type[0]}</p>}
      </div>

      {/* Tem câmeras? */}
      <div className="rounded-xl border border-white/10 bg-ink-800/60 p-4">
        <p className="mb-3 text-sm font-semibold text-fg">
          <Camera className="mr-1.5 inline h-4 w-4 text-cyan-400" />
          Câmeras de segurança?
        </p>
        <div className="flex gap-4">
          {[
            { value: "true",  label: "Sim, temos câmeras" },
            { value: "false", label: "Não temos câmeras" },
          ].map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-fg">
              <input
                type="radio"
                name="has_cameras"
                value={opt.value}
                defaultChecked={opt.value === "true"}
                className="accent-brand-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-fg-subtle">
          Estabelecimentos com câmeras ficam destacados no mapa como pontos de apoio prioritários.
        </p>
      </div>

      {/* Endereço */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg">Endereço / Rua</label>
          <input
            ref={addrRef}
            name="address"
            maxLength={200}
            placeholder="Rua das Flores, 123"
            className="w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg">Bairro</label>
          <input
            ref={neighRef}
            name="neighborhood"
            maxLength={100}
            placeholder="Centro"
            className="w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-fg">
            Cidade <span className="text-brand-400">*</span>
          </label>
          <input
            ref={cityRef}
            name="city"
            required
            maxLength={100}
            placeholder="Santos"
            className="w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          />
          {fe.city && <p className="mt-1 text-xs text-red-400">{fe.city[0]}</p>}
        </div>
      </div>

      {/* Coordenadas GPS */}
      <div className="rounded-xl border border-white/10 bg-ink-800/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-400" />
          <p className="text-sm font-semibold text-fg">
            Localização no mapa <span className="text-brand-400">*</span>
          </p>
        </div>

        {coords ? (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-mono">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCoords(null)}
              className="text-xs text-fg-subtle hover:text-fg"
            >
              Remover
            </button>
          </div>
        ) : null}

        <input type="hidden" name="latitude"  value={coords?.lat ?? ""} />
        <input type="hidden" name="longitude" value={coords?.lng ?? ""} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={capturarGPS}
            disabled={geoLoading}
            className="flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-300 hover:bg-brand-500/20 disabled:opacity-60"
          >
            {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            Usar minha localização (GPS)
          </button>
          <button
            type="button"
            onClick={geocodificarEndereco}
            disabled={geoLoading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-700 px-3 py-2 text-xs font-bold text-fg-muted hover:text-fg disabled:opacity-60"
          >
            {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Geocodificar endereço
          </button>
        </div>

        {geoError && <p className="mt-2 text-xs text-red-400">{geoError}</p>}
        {(fe.latitude || fe.longitude) && (
          <p className="mt-2 text-xs text-red-400">
            Localização obrigatória — use o GPS ou geocodifique o endereço.
          </p>
        )}
        <p className="mt-2 text-[11px] text-fg-subtle">
          A localização é usada para marcar o estabelecimento no Mapa de Alertas.
        </p>
      </div>

      {/* Contato */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg">Telefone / WhatsApp</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              name="contact_phone"
              type="tel"
              maxLength={20}
              placeholder="(13) 99999-9999"
              className="w-full rounded-lg border border-white/10 bg-ink-700 pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              name="contact_email"
              type="email"
              maxLength={120}
              placeholder="contato@petshop.com"
              className="w-full rounded-lg border border-white/10 bg-ink-700 pl-9 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
            />
          </div>
          {fe.contact_email && <p className="mt-1 text-xs text-red-400">{fe.contact_email[0]}</p>}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px] text-fg-subtle leading-relaxed">
        📋 Ao se cadastrar você concorda em colaborar com tutores que buscam seus pets.
        Sua participação é voluntária e pode ser encerrada a qualquer momento via{" "}
        <a href="mailto:contato@sospet.com.br" className="text-cyan-400 hover:underline">
          contato@sospet.com.br
        </a>.
        Os dados são usados exclusivamente para exibição no mapa de alertas.
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow-brand transition-all hover:bg-brand-400 disabled:opacity-60"
      >
        {pending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
        ) : (
          <><Camera className="h-4 w-4" /> Cadastrar na Rede Sentinela</>
        )}
      </button>
    </form>
  );
}
