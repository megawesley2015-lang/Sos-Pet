import { ImageResponse } from "next/og";
import { getPetById } from "@/lib/services/pets";
import {
  SPECIES_LABEL,
  KIND_LABEL,
} from "@/lib/utils/format";

export const alt = "Pet desaparecido — SOS Pet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * OG image dinâmica por pet — quando alguém compartilha o link no
 * WhatsApp/Insta/Twitter, aparece um cartão com a foto, nome, cidade.
 *
 * Fallback: se o pet não existir ou for removido, mostra o OG genérico.
 */
export default async function PetOpengraphImage({ params }: Props) {
  const { id } = await params;
  const pet = await getPetById(id);

  if (!pet) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0A0A0F",
            color: "white",
            fontSize: 48,
          }}
        >
          SOS Pet
        </div>
      ),
      { ...size }
    );
  }

  const isLost = pet.kind === "lost";
  const accent = isLost ? "#FF6B35" : "#00E5FF";
  const accentSoft = isLost
    ? "rgba(255,107,53,0.5)"
    : "rgba(0,229,255,0.5)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0A0A0F",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
          color: "white",
        }}
      >
        {/* Foto à esquerda */}
        <div
          style={{
            width: 500,
            height: "100%",
            background: "#14141F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {pet.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pet.photo_url}
              alt=""
              width={500}
              height={630}
              style={{ width: 500, height: 630, objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 120, color: accentSoft }}>?</span>
          )}
          {/* Overlay sutil */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 60%, rgba(10,10,15,0.6) 100%)",
            }}
          />
        </div>

        {/* Conteúdo à direita */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 56,
            background: `linear-gradient(135deg, #0A0A0F 0%, #14141F 100%)`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span
              style={{
                background: accent,
                color: isLost ? "#fff" : "#0A0A0F",
                padding: "8px 18px",
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: "uppercase",
                alignSelf: "flex-start",
                boxShadow: `0 0 32px ${accentSoft}`,
              }}
            >
              {isLost ? "Procura-se" : "Encontrado"}
            </span>

            <h1
              style={{
                fontSize: 68,
                fontWeight: 900,
                margin: 0,
                lineHeight: 1,
                letterSpacing: -1.5,
              }}
            >
              {pet.name ?? `${SPECIES_LABEL[pet.species]} ${KIND_LABEL[pet.kind].toLowerCase()}`}
            </h1>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {[SPECIES_LABEL[pet.species], pet.breed, pet.color]
                .filter(Boolean)
                .slice(0, 3)
                .map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 18,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {String(tag)}
                  </span>
                ))}
            </div>

            <div
              style={{
                marginTop: 16,
                fontSize: 22,
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span>
                {pet.neighborhood}, {pet.city}
                {pet.state ? ` — ${pet.state}` : ""}
              </span>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>
                em {new Date(pet.event_date).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse cx="6" cy="9" rx="2" ry="2.5" />
                <ellipse cx="10.5" cy="6.5" rx="2" ry="2.5" />
                <ellipse cx="15" cy="6.5" rx="2" ry="2.5" />
                <ellipse cx="19.5" cy="9" rx="2" ry="2.5" />
                <ellipse cx="12.75" cy="16.5" rx="6" ry="5" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>
                SOS <span style={{ color: accent }}>Pet</span>
              </span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                Veja detalhes e ajude
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
