import { forwardRef } from "react";
import {
  formatPhone,
  whatsappLink,
  SPECIES_LABEL,
} from "@/lib/utils/format";
import type { PetRow } from "@/lib/types/database";

interface SOSAlertCardProps {
  pet: PetRow;
  /** Se passado, usado no QR/link curto futuramente. Por enquanto só visual. */
  appUrl?: string;
}

/**
 * Card visual do alerta SOS — alvo do html-to-image.toPng().
 *
 * Tamanho fixo 540×810 DOM — com pixelRatio 2 no html-to-image gera
 * exatamente 1080×1620px (formato story Insta/WhatsApp). Renderizado
 * offscreen para ser snapshotado.
 *
 * IMPORTANT: html-to-image NÃO carrega CSS de @import nem fontes externas
 * de forma confiável. Por isso aqui usamos system-ui e cores inline.
 */
export const SOSAlertCard = forwardRef<HTMLDivElement, SOSAlertCardProps>(
  function SOSAlertCard({ pet, appUrl }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width: 540,
          height: 810,
          background:
            "linear-gradient(180deg, #0A0A0F 0%, #14141F 60%, #1F1F2E 100%)",
          color: "#fff",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              background: "#FF851B",
              color: "#fff",
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2,
              boxShadow: "0 0 24px rgba(255,133,27,0.6)",
            }}
          >
            URGENTE • SOS
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
            }}
          >
            sospet.app
          </div>
        </div>

        {/* Foto — altura reduzida para sobrar espaço pra seção contato */}
        <div
          style={{
            flex: "0 0 auto",
            width: "100%",
            height: 248,
            borderRadius: 14,
            overflow: "hidden",
            background: "#1F1F2E",
            border: "3px solid rgba(255,133,27,0.4)",
          }}
        >
          {pet.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pet.photo_url}
              alt={pet.name ?? "Pet"}
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 80,
                color: "rgba(255,133,27,0.3)",
              }}
            >
              ?
            </div>
          )}
        </div>

        {/* Título */}
        <div style={{ flexShrink: 0 }}>
          <h1
            style={{
              fontSize: 48,
              lineHeight: 1,
              fontWeight: 900,
              margin: 0,
              color: "#FF851B",
              textShadow: "0 0 24px rgba(255,133,27,0.5)",
              letterSpacing: -1,
            }}
          >
            PROCURA-SE
          </h1>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {pet.name ?? `${SPECIES_LABEL[pet.species]} desaparecido`}
          </p>
        </div>

        {/* Atributos rápidos */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {[
            SPECIES_LABEL[pet.species],
            pet.breed,
            pet.color,
            pet.size,
            pet.sex,
          ]
            .filter(Boolean)
            .slice(0, 5)
            .map((tag, i) => (
              <span
                key={i}
                style={{
                  background: "rgba(0,229,255,0.12)",
                  color: "#7FF0FF",
                  padding: "5px 11px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1px solid rgba(0,229,255,0.3)",
                }}
              >
                {String(tag)}
              </span>
            ))}
        </div>

        {/* Localização */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 2,
              marginBottom: 3,
            }}
          >
            Visto pela última vez
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {pet.neighborhood}, {pet.city}
            {pet.state ? ` — ${pet.state}` : ""}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
            em {pet.event_date ? new Date(pet.event_date).toLocaleDateString("pt-BR") : ''}
          </div>
        </div>

        {/* Contato — sempre visível, sem marginTop auto que pode empurrar */}
        <div
          style={{
            background: "linear-gradient(135deg, #FF851B 0%, #FF8B5C 100%)",
            padding: "16px 18px",
            borderRadius: 14,
            color: "#fff",
            boxShadow: "0 8px 32px rgba(255,133,27,0.4)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 2,
              opacity: 0.85,
              marginBottom: 3,
            }}
          >
            Encontrou? Avise:
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {pet.contact_name}
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, marginTop: 3 }}>
            {formatPhone(pet.contact_phone)}
          </div>
          {pet.contact_whatsapp && (
            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                fontWeight: 700,
                opacity: 0.9,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              ✅ WhatsApp disponível
            </div>
          )}
          {/* link só visual — não clicável dentro do PNG */}
          {appUrl && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                opacity: 0.7,
              }}
            >
              Detalhes: {appUrl}
            </div>
          )}
        </div>
      </div>
    );
  }
);

// utility — só pra evitar warning quando o componente é usado como ref-only
export const sosAlertWhatsappLink = (pet: PetRow) =>
  whatsappLink(
    pet.contact_phone,
    `Olá! Vi o alerta SOS do pet ${pet.name ?? ""} no SOS Pet Aumigo e quero ajudar.`
  );
