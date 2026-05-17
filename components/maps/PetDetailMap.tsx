"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, CheckCircle2, MapPin } from "lucide-react";

interface SightingPoint {
  lat: number;
  lng: number;
  description?: string | null;
  created_at: string;
}

interface Props {
  petId: string;
  petName?: string | null;
  species: string;
  kind: "lost" | "found";
  latitude: number;
  longitude: number;
  sightings: SightingPoint[];
  /** Se true, mostra o painel Meta Ads (visível só para o dono) */
  showMetaPanel?: boolean;
}

// Raios por espécie (em metros)
const RADIUS_BY_SPECIES = {
  cat:   { r1: 1600, r2: 3000, label: "gatos fogem pouco" },
  dog:   { r1: 3000, r2: 8000, label: "cães podem ir longe" },
  other: { r1: 2000, r2: 5000, label: "" },
};

/**
 * PetDetailMap — mapa no detalhe do pet perdido.
 *
 * Mostra:
 *  - Pin laranja = última localização conhecida
 *  - Círculos de raio por espécie (estratégia de geofencing)
 *  - Avistamentos como marcadores amarelos
 *  - Heat map visual (gradient CSS via canvas se tivermos +5 sightings)
 *  - Painel "Meta Ads Ready" para o tutor copiar coords
 */
export function PetDetailMap({
  petId,
  petName,
  species,
  kind,
  latitude,
  longitude,
  sightings,
  showMetaPanel = false,
}: Props) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mounted, setMounted]   = useState(false);
  const [copied,  setCopied]    = useState(false);

  const radii = RADIUS_BY_SPECIES[species as keyof typeof RADIUS_BY_SPECIES]
    ?? RADIUS_BY_SPECIES.other;

  const suggestedRadius = species === "cat" ? "2-5km" : "5-8km";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    const loadAndInit = async () => {
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
          }
          if (!document.querySelector('script[src*="leaflet.js"]')) {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = () => resolve();
            document.head.appendChild(script);
          } else {
            resolve();
          }
        });
      }

      const L = (window as any).L;
      if (mapInstance.current) { mapInstance.current.remove(); }

      const map = L.map(mapRef.current!, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: true,
      });
      mapInstance.current = map;

      // Dark tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20 }
      ).addTo(map);

      // ── Círculos de raio ──────────────────────────────────
      // Círculo externo (mais suave)
      L.circle([latitude, longitude], {
        radius: radii.r2,
        color:  "#f97316",
        fillColor: "#f97316",
        fillOpacity: 0.05,
        weight: 1,
        dashArray: "6 4",
        opacity: 0.5,
      }).addTo(map).bindTooltip(
        `Raio externo: ${(radii.r2 / 1000).toFixed(1)}km`,
        { permanent: false, direction: "top" }
      );

      // Círculo interno (mais provável)
      L.circle([latitude, longitude], {
        radius: radii.r1,
        color:  "#f97316",
        fillColor: "#f97316",
        fillOpacity: 0.10,
        weight: 2,
        opacity: 0.7,
      }).addTo(map).bindTooltip(
        `Raio prioritário: ${(radii.r1 / 1000).toFixed(1)}km`,
        { permanent: false, direction: "top" }
      );

      // ── Pin da última localização ─────────────────────────
      const petIconHtml = `
        <div style="position:relative;width:40px;height:48px;">
          <div style="position:absolute;top:0;left:0;width:40px;height:40px;border-radius:50%;
            background:#f97316;opacity:0.2;animation:sosPulse 2s ease-out infinite;"></div>
          <div style="position:absolute;top:0;left:0;width:40px;height:40px;
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            background:#f97316;border:2px solid #431407;
            box-shadow:0 0 16px #f9731680;"></div>
          <div style="position:absolute;top:8px;left:10px;font-size:18px;line-height:1;">
            ${species === "dog" ? "🐶" : species === "cat" ? "🐱" : "🐾"}
          </div>
        </div>
      `;
      const petIcon = L.divIcon({
        html: petIconHtml, className: "", iconSize: [40, 48], iconAnchor: [20, 48], popupAnchor: [0, -48],
      });
      L.marker([latitude, longitude], { icon: petIcon })
        .addTo(map)
        .bindPopup(`<div style="font-family:system-ui;color:#f1f5f9;background:#1e293b;padding:4px;">
          <strong>${petName ?? "Pet"}</strong><br/>
          <span style="font-size:11px;color:#94a3b8;">Última localização conhecida</span>
        </div>`, { className: "sos-popup" });

      // ── Avistamentos ─────────────────────────────────────
      sightings.forEach((s, i) => {
        const age  = Date.now() - new Date(s.created_at).getTime();
        const isNew = age < 24 * 60 * 60 * 1000;
        const iconHtml = `
          <div style="
            width:16px;height:16px;border-radius:50%;
            background:${isNew ? "#fbbf24" : "#78716c"};
            border:2px solid ${isNew ? "#92400e" : "#44403c"};
            box-shadow:${isNew ? "0 0 8px #fbbf2480" : "none"};
          "></div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
        const marker = L.marker([s.lat, s.lng], { icon, zIndexOffset: -10 }).addTo(map);
        if (s.description) {
          const date = new Date(s.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
          marker.bindPopup(`
            <div style="font-family:system-ui;color:#f1f5f9;min-width:140px;">
              <span style="color:#fbbf24;font-size:11px;font-weight:700;">🟡 Avistamento #${i + 1}</span><br/>
              <span style="font-size:11px;color:#94a3b8;">${date}</span>
              ${s.description ? `<br/><span style="font-size:12px;color:#e2e8f0;">${s.description}</span>` : ""}
            </div>
          `, { className: "sos-popup" });
        }
      });

      // CSS global (só uma vez)
      if (!document.getElementById("sos-detail-map-style")) {
        const style = document.createElement("style");
        style.id = "sos-detail-map-style";
        style.textContent = `
          @keyframes sosPulse {
            0% { transform: scale(1); opacity: 0.2; }
            100% { transform: scale(4); opacity: 0; }
          }
          .sos-popup .leaflet-popup-content-wrapper {
            background:#1e293b!important;border:1px solid rgba(255,255,255,0.1)!important;
            border-radius:8px!important;color:#f1f5f9!important;
          }
          .sos-popup .leaflet-popup-tip { background:#1e293b!important; }
          .leaflet-control-zoom a { background:#1e293b!important;color:#94a3b8!important;border-color:rgba(255,255,255,0.1)!important; }
          .leaflet-control-attribution { background:rgba(0,0,0,0.5)!important;color:#475569!important;font-size:9px!important; }
        `;
        document.head.appendChild(style);
      }
    };

    loadAndInit();

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, latitude, longitude, sightings]);

  const copyCoords = () => {
    const text = `Lat: ${latitude.toFixed(6)} | Lng: ${longitude.toFixed(6)} | Raio sugerido: ${suggestedRadius}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Mapa */}
      <div className="relative">
        <div ref={mapRef} className="h-72 w-full rounded-xl overflow-hidden border border-white/10 sm:h-80" />

        {/* Badge de avistamentos */}
        {sightings.length > 0 && (
          <div className="absolute top-3 right-3 z-[1000] rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-bold text-yellow-300">
            🟡 {sightings.length} avistamento{sightings.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Legenda dos raios */}
      <div className="flex flex-wrap gap-3 text-xs text-fg-muted">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-8 rounded-full border-2 border-dashed border-orange-400/70 bg-orange-400/10 inline-block" />
          {(radii.r2 / 1000).toFixed(1)}km — raio externo
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-8 rounded-full border-2 border-orange-400 bg-orange-400/20 inline-block" />
          {(radii.r1 / 1000).toFixed(1)}km — raio prioritário
        </div>
        {radii.label && (
          <span className="text-fg-subtle">({radii.label})</span>
        )}
      </div>

      {/* Painel Meta Ads Ready — só para o dono */}
      {showMetaPanel && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-fg">Meta Ads — Geofencing Ready</h3>
          </div>
          <p className="mb-3 text-xs text-fg-muted">
            Use estas coordenadas para criar uma campanha de anúncios localizada no Meta Ads Manager.
            Raio sugerido para <strong className="text-fg">{species === "cat" ? "gatos" : species === "dog" ? "cães" : "este animal"}</strong>: <strong className="text-cyan-300">{suggestedRadius}</strong>.
          </p>

          <div className="mb-3 rounded-lg border border-white/10 bg-ink-800 px-3 py-2 font-mono text-xs text-fg-muted">
            <span className="text-cyan-300">lat</span>{" "}
            {latitude.toFixed(6)}{" "}
            <span className="text-cyan-300">lng</span>{" "}
            {longitude.toFixed(6)}{" "}
            <span className="text-fg-subtle">· raio {suggestedRadius}</span>
          </div>

          <button
            onClick={copyCoords}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              copied
                ? "bg-success/20 text-success border border-success/30"
                : "bg-ink-700 text-fg-muted border border-white/10 hover:border-cyan-500/40 hover:text-fg"
            }`}
          >
            {copied ? (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Copiado!</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copiar coordenadas</>
            )}
          </button>

          <p className="mt-3 text-[10px] text-fg-subtle">
            💡 No Meta Ads Manager: Criar campanha → Público → Localização → Inserir endereço → Raio → colar coordenadas.
          </p>
        </div>
      )}
    </div>
  );
}
