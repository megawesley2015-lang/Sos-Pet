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
 * Tamanho fixo 600×900 (formato story Insta/WhatsApp). Renderizado fora
 * de viewport (offscreen) só pra ser snapshotado.
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
          width: 600,
          height: 900,
          background:
            "linear-gradient(180deg, #0A0A0F 0%, #14141F 60%, #1F1F2E 100%)",
          color: "#fff",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              background: "#FF6B35",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 2,
              boxShadow: "0 0 24px rgba(255,107,53,0.6)",
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

        {/* Foto */}
        <div
          style={{
            flex: "0 0 auto",
            width: "100%",
            height: 360,
            borderRadius: 16,
            overflow: "hidden",
            background: "#1F1F2E",
            border: "3px solid rgba(255,107,53,0.4)",
            position: "relative",
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
                color: "rgba(255,107,53,0.3)",
              }}
            >
              ?
            </div>
          )}
        </div>

        {/* Título */}
        <div>
          <h1
            style={{
              fontSize: 56,
              lineHeight: 1,
              fontWeight: 900,
              margin: 0,
              color: "#FF6B35",
              textShadow: "0 0 24px rgba(255,107,53,0.5)",
              letterSpacing: -1,
            }}
          >
            PROCURA-SE
          </h1>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: 32,
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
            gap: 8,
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
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 14,
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
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            Visto pela última vez
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {pet.neighborhood}, {pet.city}
            {pet.state ? ` — ${pet.state}` : ""}
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
            em {new Date(pet.event_date).toLocaleDateString("pt-BR")}
          </div>
        </div>

        {/* Contato — hero do card */}
        <div
          style={{
            marginTop: "auto",
            background: "linear-gradient(135deg, #FF6B35 0%, #FF8B5C 100%)",
            padding: 20,
            borderRadius: 16,
            color: "#fff",
            boxShadow: "0 8px 32px rgba(255,107,53,0.4)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 2,
              opacity: 0.85,
              marginBottom: 4,
            }}
          >
            Encontrou? Avise:
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {pet.contact_name}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>
            {formatPhone(pet.contact_phone)}
          </div>
          {pet.contact_whatsapp && (
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 700,
                opacity: 0.9,
              }}
            >
              WhatsApp disponível
            </div>
          )}
          {/* link só visual — não clicável dentro do PNG, claro */}
          {appUrl && (
            <div
              style={{
                marginTop: 8,
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
    `Olá! Vi o alerta SOS do pet ${pet.name ?? ""} no SOS Pet e quero ajudar.`
  );
