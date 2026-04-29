"use client";

import { useEffect, useRef } from "react";
import type { SightingRow } from "@/lib/types/database";

// Cores por idade do avistamento
const COLORS = {
  recent: "#3b82f6",  // azul  — até 1 dia
  old: "#f59e0b",     // laranja — até 7 dias
  cold: "#6b7280",    // cinza   — mais de 7 dias
  lost: "#ef4444",    // vermelho — local do desaparecimento
};

function getColorByAge(createdAt: string): string {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  if (days <= 1) return COLORS.recent;
  if (days <= 7) return COLORS.old;
  return COLORS.cold;
}

function makePawIcon(L: typeof import("leaflet"), color: string) {
  return L.divIcon({
    html: `
      <div style="position:relative;width:40px;height:50px;">
        <div style="font-size:28px;filter:drop-shadow(1px 1px 2px rgba(0,0,0,.4));transform:rotate(-20deg);">🐾</div>
        <div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);
          width:12px;height:12px;background:${color};border-radius:50%;
          border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3);"></div>
      </div>`,
    className: "",
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -52],
  });
}

interface Props {
  sightings: SightingRow[];
  /** Localização textual do desaparecimento (usada no título do mapa) */
  petCity?: string;
}

export default function PetMap({ sightings, petCity }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || sightings.length === 0) return;

    let map: import("leaflet").Map | null = null;

    // Importação dinâmica do Leaflet (evita erros de SSR)
    import("leaflet").then((L) => {
      // CSS do Leaflet (importado uma única vez via link tag)
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!containerRef.current) return;

      // Pega o primeiro avistamento como centro inicial
      const first = sightings[0];
      map = L.map(containerRef.current, { zoomControl: true }).setView(
        [first.lat, first.lng],
        14
      );

      // Tile layer OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const coords: [number, number][] = [];

      // Adiciona marcadores ordenados por data
      const sorted = [...sightings].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sorted.forEach((s) => {
        const color = getColorByAge(s.created_at);
        const icon = makePawIcon(L, color);
        const date = new Date(s.created_at).toLocaleString("pt-BR", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        });

        const popup = `
          <div style="min-width:180px;font-family:system-ui,sans-serif;">
            <p style="margin:0 0 6px;font-weight:700;color:${color};font-size:13px;">👀 Avistamento</p>
            ${s.description ? `<p style="margin:0 0 4px;font-size:12px;color:#374151;">${s.description}</p>` : ""}
            ${s.address ? `<p style="margin:0 0 4px;font-size:11px;color:#6b7280;">${s.address.split(",").slice(0, 3).join(",")}</p>` : ""}
            <p style="margin:0;font-size:11px;color:#9ca3af;">📅 ${date}</p>
          </div>`;

        L.marker([s.lat, s.lng], { icon }).addTo(map!).bindPopup(popup);
        coords.push([s.lat, s.lng]);
      });

      // Linha conectando os pontos (trilha)
      if (coords.length > 1) {
        L.polyline(coords, {
          color: "#22d3ee",
          weight: 2.5,
          opacity: 0.65,
          dashArray: "8, 8",
        }).addTo(map);
      }

      // Ajusta view para mostrar todos os pins
      if (coords.length > 0) {
        map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
      }
    });

    return () => {
      map?.remove();
    };
  }, [sightings]);

  if (sightings.length === 0) return null;

  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10">
      {/* Mapa */}
      <div ref={containerRef} style={{ height: 320, width: "100%", zIndex: 1 }} />

      {/* Legenda */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-white/10 bg-ink-900/90 p-2.5 text-[10px] backdrop-blur-sm">
        <p className="mb-1.5 font-bold uppercase tracking-wide text-fg-subtle">Legenda</p>
        <div className="space-y-1">
          {[
            { color: COLORS.recent, label: "Visto hoje" },
            { color: COLORS.old,    label: "Visto há dias" },
            { color: COLORS.cold,   label: "Sem relatos recentes" },
          ].map(({ color, label }) => (
            <div key={color} className="flex items-center gap-1.5">
              <span className="block h-2.5 w-2.5 rounded-full border border-white/30" style={{ background: color }} />
              <span className="text-fg-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {petCity && (
        <div className="absolute right-3 top-3 z-[1000] rounded-lg border border-white/10 bg-ink-900/90 px-2.5 py-1.5 text-[10px] text-fg-muted backdrop-blur-sm">
          📍 Região: {petCity}
        </div>
      )}
    </div>
  );
}
