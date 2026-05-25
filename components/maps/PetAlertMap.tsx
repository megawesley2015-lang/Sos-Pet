"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

export interface PetMapPin {
  id: string;
  kind: "lost" | "found";
  name: string | null;
  species: string;
  color: string;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  city: string;
  neighborhood: string;
  created_at: string;
}

export interface SentinelPin {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  has_cameras: boolean;
}

export interface SightingPin {
  id: string;
  pet_id: string;
  lat: number;
  lng: number;
  description?: string | null;
  created_at: string;
}

interface Props {
  pets: PetMapPin[];
  sentinels?: SentinelPin[];
  sightings?: SightingPin[];
  /** Centro inicial — se não informado, usa a média dos pets */
  center?: [number, number];
  zoom?: number;
  height?: string;
  /** Se true, mostra controles de filtro */
  showFilters?: boolean;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  other: "🐾",
};

const TYPE_LABEL: Record<string, string> = {
  pet_shop: "Pet Shop",
  vet: "Veterinário",
  condo: "Condomínio",
  market: "Mercado",
  pharmacy: "Farmácia",
  gas_station: "Posto",
  school: "Escola",
  park: "Parque",
  other: "Parceiro",
};

/**
 * PetAlertMap — mapa estilo Watch_Dogs com tema escuro.
 *
 * Usa Leaflet via CDN carregado dinamicamente (sem react-leaflet,
 * sem problemas de SSR). Tiles: CartoDB Dark Matter.
 *
 * Layers:
 *  - 🔴 Pets perdidos (orange pins + pulso animado se < 24h)
 *  - 🔵 Pets encontrados (cyan pins)
 *  - 📷 Sentinelas / câmeras parceiras (ícone câmera, cyan)
 *  - 🟡 Avistamentos (pequenos dots amarelos)
 */
export const PetAlertMap = forwardRef(function PetAlertMap(
  {
    pets,
    sentinels = [],
    sightings = [],
    center,
    zoom = 13,
    height = "100%",
    showFilters = true,
  }: Props,
  ref
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupsRef = useRef<{ pets: any; sentinels: any; sightings: any } | null>(null);

  const [filter, setFilter] = useState<"all" | "lost" | "found" | "sentinels">("all");
  const [mounted, setMounted] = useState(false);

  // Expõe método imperative para pan/zoom
  useImperativeHandle(
    ref,
    () => ({
      panToLocation: (lat: number, lng: number) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 14, {
            duration: 1,
            easeLinearity: 0.5,
          });
        }
      },
    }),
    []
  );

  // Calcula centro automaticamente
  const computedCenter: [number, number] = center ?? (() => {
    if (pets.length === 0) return [-23.5489, -46.6388]; // São Paulo fallback
    const avgLat = pets.reduce((s, p) => s + p.latitude, 0) / pets.length;
    const avgLng = pets.reduce((s, p) => s + p.longitude, 0) / pets.length;
    return [avgLat, avgLng];
  })();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    // Carrega Leaflet via CDN se não carregado
    const loadLeaflet = async () => {
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);

          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
      return (window as any).L;
    };

    loadLeaflet().then((L) => {
      leafletRef.current = L;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current!, {
        center: computedCenter,
        zoom,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Tiles escuros — Watch_Dogs aesthetic
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      // Layer groups
      const petLayer      = L.layerGroup().addTo(map);
      const sentinelLayer = L.layerGroup();
      const sightingLayer = L.layerGroup().addTo(map);
      layerGroupsRef.current = { pets: petLayer, sentinels: sentinelLayer, sightings: sightingLayer };

      // ── Pet pins ─────────────────────────────────────────────
      const now = Date.now();
      pets.forEach((pet) => {
        const isNew = now - new Date(pet.created_at).getTime() < 24 * 60 * 60 * 1000;
        const color = pet.kind === "lost" ? "#f97316" : "#22d3ee"; // orange / cyan
        const emoji = SPECIES_EMOJI[pet.species] ?? "🐾";

        const iconHtml = `
          <div style="position:relative;width:36px;height:44px;">
            ${isNew ? `<div style="
              position:absolute;top:0;left:0;width:36px;height:36px;border-radius:50%;
              background:${color};opacity:0.25;
              animation:sosPulse 2s ease-out infinite;
            "></div>` : ""}
            <div style="
              position:absolute;top:0;left:0;
              width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
              background:${color};border:2px solid rgba(0,0,0,0.4);
              box-shadow:0 0 12px ${color}80;
            "></div>
            <div style="
              position:absolute;top:5px;left:5px;
              font-size:16px;line-height:1;
            ">${emoji}</div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -44],
        });

        const marker = L.marker([pet.latitude, pet.longitude], { icon });

        const photoHtml = pet.photo_url
          ? `<img src="${pet.photo_url}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />`
          : "";

        const kindLabel = pet.kind === "lost"
          ? `<span style="color:#f97316;font-weight:700;font-size:11px;">● PERDIDO</span>`
          : `<span style="color:#22d3ee;font-weight:700;font-size:11px;">● ENCONTRADO</span>`;

        marker.bindPopup(`
          <div style="min-width:180px;font-family:system-ui,sans-serif;">
            ${photoHtml}
            ${kindLabel}
            <div style="font-size:15px;font-weight:700;margin:4px 0 2px;color:#f1f5f9;">
              ${pet.name ?? "Sem nome"} ${emoji}
            </div>
            <div style="font-size:12px;color:#94a3b8;">
              ${pet.neighborhood}, ${pet.city}
            </div>
            <a href="/pets/${pet.id}"
              style="display:block;margin-top:10px;background:#f97316;color:#fff;padding:6px 12px;border-radius:6px;text-align:center;text-decoration:none;font-size:12px;font-weight:700;">
              Ver detalhes →
            </a>
          </div>
        `, { className: "sos-popup" });

        petLayer.addLayer(marker);
      });

      // ── Sentinel pins (câmeras parceiras) ───────────────────
      sentinels.forEach((s) => {
        const iconHtml = `
          <div style="
            width:28px;height:28px;border-radius:6px;
            background:#0e7490;border:1.5px solid #22d3ee;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 0 8px #22d3ee60;font-size:14px;
          ">📷</div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([s.latitude, s.longitude], { icon });

        marker.bindPopup(`
          <div style="font-family:system-ui,sans-serif;min-width:160px;">
            <div style="font-size:11px;color:#22d3ee;font-weight:700;margin-bottom:4px;">
              📷 ${TYPE_LABEL[s.type] ?? "Parceiro"}
            </div>
            <div style="font-size:14px;font-weight:700;color:#f1f5f9;">${s.name}</div>
            ${s.address ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">${s.address}</div>` : ""}
            <div style="margin-top:8px;font-size:11px;color:#64748b;">
              ${s.has_cameras ? "✅ Câmeras registradas" : "👁 Ponto de vigilância"}
            </div>
          </div>
        `);

        sentinelLayer.addLayer(marker);
      });

      // ── Sighting dots ────────────────────────────────────────
      sightings.forEach((sg) => {
        const iconHtml = `
          <div style="
            width:14px;height:14px;border-radius:50%;
            background:#fbbf24;border:2px solid #92400e;
            box-shadow:0 0 6px #fbbf2480;
          "></div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [14, 14], iconAnchor: [7, 7] });
        const marker = L.marker([sg.lat, sg.lng], { icon });
        if (sg.description) {
          marker.bindPopup(`<div style="font-size:12px;color:#f1f5f9;max-width:160px;">🟡 Avistamento<br/>${sg.description}</div>`);
        }
        sightingLayer.addLayer(marker);
      });

      // CSS de animação + popup dark
      if (!document.getElementById("sos-map-style")) {
        const style = document.createElement("style");
        style.id = "sos-map-style";
        style.textContent = `
          @keyframes sosPulse {
            0% { transform: scale(1); opacity: 0.25; }
            100% { transform: scale(3.5); opacity: 0; }
          }
          .sos-popup .leaflet-popup-content-wrapper {
            background: #1e293b !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 10px !important;
            color: #f1f5f9 !important;
            box-shadow: 0 4px 24px rgba(0,0,0,0.6) !important;
          }
          .sos-popup .leaflet-popup-tip { background: #1e293b !important; }
          .leaflet-popup-close-button { color: #94a3b8 !important; }
          .leaflet-control-zoom a {
            background: #1e293b !important;
            color: #94a3b8 !important;
            border-color: rgba(255,255,255,0.1) !important;
          }
          .leaflet-control-attribution {
            background: rgba(0,0,0,0.5) !important;
            color: #475569 !important;
            font-size: 9px !important;
          }
        `;
        document.head.appendChild(style);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, pets, sentinels, sightings]);

  // Controla visibilidade das layers pelo filtro
  useEffect(() => {
    const lg = layerGroupsRef.current;
    const map = mapInstanceRef.current;
    if (!lg || !map) return;

    const showPets      = filter === "all" || filter === "lost" || filter === "found";
    const showSentinels = filter === "all" || filter === "sentinels";

    if (showPets) map.addLayer(lg.pets); else map.removeLayer(lg.pets);
    if (showSentinels && sentinels.length > 0) map.addLayer(lg.sentinels); else map.removeLayer(lg.sentinels);

    // Filtra por kind dentro do layer (reaplica markers)
    // Para MVP: filtro de kind requer re-render — simplesmente recarrega
  }, [filter, sentinels.length]);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl bg-ink-900 border border-white/10"
      >
        <div className="text-center text-fg-subtle">
          <div className="text-2xl mb-2">🗺️</div>
          <p className="text-sm">Carregando mapa…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col" style={{ height }}>
      {showFilters && (
        <div className="absolute top-3 left-1/2 z-[1000] -translate-x-1/2 flex gap-1.5">
          {[
            { key: "all",      label: "Todos" },
            { key: "lost",     label: "🔴 Perdidos" },
            { key: "found",    label: "🔵 Encontrados" },
            { key: "sentinels", label: "📷 Câmeras" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`rounded-full px-3 py-1 text-xs font-bold shadow-lg transition-all ${
                filter === key
                  ? "bg-brand-500 text-white shadow-glow-brand"
                  : "bg-ink-900/90 text-fg-muted border border-white/10 hover:border-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div ref={mapRef} className="flex-1 rounded-xl overflow-hidden border border-white/10" />

      {/* Legend */}
      <div className="absolute bottom-6 right-3 z-[1000] rounded-lg border border-white/10 bg-ink-900/90 px-3 py-2 backdrop-blur-sm text-[10px] space-y-1">
        <div className="flex items-center gap-1.5 text-fg-muted">
          <span className="inline-block w-3 h-3 rounded-full bg-brand-500" />
          Perdido
        </div>
        <div className="flex items-center gap-1.5 text-fg-muted">
          <span className="inline-block w-3 h-3 rounded-full bg-cyan-500" />
          Encontrado
        </div>
        {sightings.length > 0 && (
          <div className="flex items-center gap-1.5 text-fg-muted">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
            Avistamento
          </div>
        )}
        {sentinels.length > 0 && (
          <div className="flex items-center gap-1.5 text-fg-muted">
            <span className="text-[12px]">📷</span>
            Câmera parceira
          </div>
        )}
      </div>
    </div>
  );
});
