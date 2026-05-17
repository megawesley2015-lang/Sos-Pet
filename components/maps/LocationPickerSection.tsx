"use client";

import { useState, useCallback } from "react";
import { MapPin, Loader2, CheckCircle2, AlertCircle, Navigation } from "lucide-react";

interface Coords {
  lat: number;
  lng: number;
  label?: string;
}

interface Props {
  /** Valores iniciais (para o form de edição) */
  initialLat?: number | null;
  initialLng?: number | null;
  /** Bairro e cidade já preenchidos no form — usado para geocodificar quando GPS falha */
  neighborhood?: string;
  city?: string;
}

/**
 * LocationPickerSection — captura lat/lng para o PetForm.
 *
 * Estratégia de captura (duas vias):
 *  1. Botão "Capturar localização" → navigator.geolocation (GPS)
 *  2. Fallback: Nominatim geocoding do bairro+cidade já preenchidos
 *
 * Stores coords em inputs hidden que o Server Action lê.
 */
export function LocationPickerSection({
  initialLat,
  initialLng,
  neighborhood = "",
  city = "",
}: Props) {
  const [coords, setCoords] = useState<Coords | null>(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng, label: "Localização anterior" }
      : null
  );
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
        { headers: { "User-Agent": "sos-pet-app/1.0" } }
      );
      const data = await res.json();
      const addr = data.address;
      const parts = [
        addr?.suburb || addr?.neighbourhood || addr?.quarter,
        addr?.city || addr?.town || addr?.municipality,
      ].filter(Boolean);
      return parts.join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  const geocodeAddress = useCallback(async (): Promise<Coords | null> => {
    const q = [neighborhood, city].filter(Boolean).join(", ");
    if (!q) return null;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", Brasil")}&format=json&limit=1`,
        { headers: { "User-Agent": "sos-pet-app/1.0" } }
      );
      const data = await res.json();
      if (data?.[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          label: q,
        };
      }
    } catch {
      /* silent */
    }
    return null;
  }, [neighborhood, city]);

  const captureGPS = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");

    if (!navigator.geolocation) {
      // Fallback imediato para geocodificação por endereço
      const fallback = await geocodeAddress();
      if (fallback) {
        setCoords({ ...fallback, label: fallback.label });
        setStatus("ok");
      } else {
        setErrorMsg("GPS não disponível e endereço não encontrado. Preencha bairro e cidade.");
        setStatus("error");
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = await reverseGeocode(lat, lng);
        setCoords({ lat, lng, label });
        setStatus("ok");
      },
      async () => {
        // GPS bloqueado — tenta geocodificar pelo endereço
        const fallback = await geocodeAddress();
        if (fallback) {
          setCoords(fallback);
          setStatus("ok");
        } else {
          setErrorMsg("Localização não capturada. Preencha o bairro e a cidade corretamente.");
          setStatus("error");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [reverseGeocode, geocodeAddress]);

  const clear = () => {
    setCoords(null);
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fg-muted">
        Localização no mapa{" "}
        <span className="font-normal normal-case text-fg-subtle">(aparece como alfinete)</span>
      </label>

      {/* Hidden inputs — lidos pelo Server Action */}
      <input type="hidden" name="latitude"  value={coords?.lat ?? ""} />
      <input type="hidden" name="longitude" value={coords?.lng ?? ""} />

      {coords ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-success">Localização capturada</p>
            <p className="truncate text-xs text-fg-muted">{coords.label}</p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 text-xs text-fg-subtle hover:text-fg underline"
          >
            Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={captureGPS}
          disabled={status === "loading"}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-ink-800/50 px-3 py-3 text-sm font-medium text-fg-muted transition hover:border-brand-500/40 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Capturando localização…
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 text-brand-400" />
              Capturar localização GPS
              <MapPin className="h-3.5 w-3.5 text-fg-subtle" />
            </>
          )}
        </button>
      )}

      {status === "error" && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {!coords && status === "idle" && (
        <p className="mt-1.5 text-[11px] text-fg-subtle">
          Opcional, mas ajuda a mostrar o alfinete no mapa de busca e ativar a rede de câmeras parceiras.
        </p>
      )}
    </div>
  );
}
