"use client";

import { useRef, useState } from "react";
import { Share2, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { SOSButton } from "./SOSButton";
import { SOSAlertCard } from "./SOSAlertCard";
import { generateAlertImage } from "@/lib/alerts/generateImage";
import { shareAlertImage } from "@/lib/alerts/share";
import { dispatchAlertAction } from "@/app/resgate/actions";
import { CTAButton } from "@/components/ui/CTAButton";
import type { PetRow } from "@/lib/types/database";

interface RescueLauncherProps {
  pet: PetRow;
  appUrl?: string;
}

type FlowState =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "success"; blob: Blob; imagemUrl: string | null }
  | { phase: "error"; message: string };

/**
 * Orquestra o fluxo completo de SOS:
 *   1. User aperta long-press 2s no SOSButton
 *   2. Gera o PNG do card (html-to-image, offscreen)
 *   3. Faz upload do card + insere alertas_sos via Server Action
 *   4. Tenta Web Share API; se não, baixa o PNG
 *   5. Mostra estado de sucesso com botões de compartilhar de novo / baixar
 */
export function RescueLauncher({ pet, appUrl }: RescueLauncherProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<FlowState>({ phase: "idle" });

  async function handleActivate() {
    setState({ phase: "running" });

    try {
      // 1. Gera PNG do card offscreen
      if (!cardRef.current) {
        throw new Error("Card não está pronto pra renderizar.");
      }
      const blob = await generateAlertImage(cardRef.current);

      // 2. Server Action: upload + insert
      const formData = new FormData();
      formData.append("pet_id", pet.id);
      formData.append("raio_km", "5");
      formData.append(
        "card",
        new File([blob], `sos-${pet.id}.png`, { type: "image/png" })
      );

      const result = await dispatchAlertAction({}, formData);

      if (!result.ok) {
        setState({
          phase: "error",
          message: result.message ?? "Erro ao disparar alerta.",
        });
        return;
      }

      setState({
        phase: "success",
        blob,
        imagemUrl: result.imagemUrl ?? null,
      });

      // 3. Tenta Web Share imediatamente (UX: aproveita o gesture do user)
      await shareAlertImage({
        blob,
        filename: `sos-${pet.name ?? pet.id}.png`,
        title: `SOS Pet — ${pet.name ?? "pet desaparecido"}`,
        text: `Procura-se: ${pet.name ?? `${pet.species}`} desaparecido em ${pet.neighborhood}, ${pet.city}. Ajude a compartilhar!`,
      });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Erro inesperado.",
      });
    }
  }

  async function handleShareAgain() {
    if (state.phase !== "success") return;
    await shareAlertImage({
      blob: state.blob,
      filename: `sos-${pet.name ?? pet.id}.png`,
      title: `SOS Pet — ${pet.name ?? "pet desaparecido"}`,
      text: `Procura-se: ${pet.name ?? `${pet.species}`} desaparecido em ${pet.neighborhood}, ${pet.city}. Ajude a compartilhar!`,
    });
  }

  return (
    <div className="flex flex-col items-center">
      <SOSButton
        onActivate={handleActivate}
        loading={state.phase === "running"}
        hint="Mantenha 2s pra disparar o alerta"
      />

      {/* Card offscreen — sempre montado pra html-to-image conseguir snapshotar */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -99999,
          top: -99999,
          pointerEvents: "none",
        }}
      >
        <SOSAlertCard ref={cardRef} pet={pet} appUrl={appUrl} />
      </div>

      {/* Estado pós-disparo */}
      {state.phase === "success" && (
        <div className="mt-6 w-full max-w-md rounded-2xl border border-cyan-500/40 bg-cyan-500/5 p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-fg">Alerta SOS registrado</p>
          <p className="mt-1 text-xs text-fg-muted">
            Compartilhe nas suas redes pra alcançar mais gente.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <CTAButton
              variant="primary"
              icon={<Share2 className="h-4 w-4" />}
              onClick={handleShareAgain}
            >
              Compartilhar de novo
            </CTAButton>
            {state.imagemUrl && (
              <CTAButton
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                href={state.imagemUrl}
              >
                Baixar PNG
              </CTAButton>
            )}
          </div>
        </div>
      )}

      {state.phase === "error" && (
        <div className="mt-6 w-full max-w-md rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger-fg">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">Não consegui disparar o alerta</p>
              <p className="mt-1 text-xs opacity-80">{state.message}</p>
              <button
                type="button"
                onClick={() => setState({ phase: "idle" })}
                className="mt-2 text-xs underline hover:text-fg"
              >
                Tentar de novo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
