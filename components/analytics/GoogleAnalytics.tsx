import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * GoogleAnalytics — carrega o gtag de forma não-bloqueante.
 *
 * Não renderiza nada se NEXT_PUBLIC_GA_MEASUREMENT_ID não estiver definido.
 * Configure a variável em .env.local (dev) e em Vercel → Settings →
 * Environment Variables (produção).
 *
 * Uso:
 *   import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
 *   // Adicionar em app/layout.tsx, dentro de <body>
 *
 * Para rastrear eventos customizados:
 *   import { analytics } from "@/components/analytics/GoogleAnalytics";
 *   analytics.petCadastrado("lost");
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_title: document.title,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

// ─── Utilitário de rastreamento ───────────────────────────────

type GTagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

function trackEvent({ action, category, label, value }: GTagEvent) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtag = (window as any).gtag;
  if (typeof gtag !== "function") return;

  gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// ─── Eventos pré-definidos para o SOS Pet ────────────────────

export const analytics = {
  // Pets
  petCadastrado: (kind: "lost" | "found") =>
    trackEvent({ action: "pet_cadastrado", category: "pets", label: kind }),

  petVisualizado: (petId: string) =>
    trackEvent({ action: "pet_visualizado", category: "pets", label: petId }),

  contatoPet: (tipo: "whatsapp" | "telefone") =>
    trackEvent({ action: "contato_pet", category: "pets", label: tipo }),

  avistamentoRegistrado: () =>
    trackEvent({ action: "avistamento_registrado", category: "pets" }),

  // Prestadores
  prestadorVisualizado: (slug: string) =>
    trackEvent({ action: "prestador_visualizado", category: "prestadores", label: slug }),

  contatoPrestador: (tipo: "whatsapp" | "telefone") =>
    trackEvent({ action: "contato_prestador", category: "prestadores", label: tipo }),

  cadastroPrestador: () =>
    trackEvent({ action: "cadastro_prestador", category: "prestadores", label: "iniciado" }),

  // Auth
  login: () =>
    trackEvent({ action: "login", category: "auth", label: "sucesso" }),

  registro: () =>
    trackEvent({ action: "registro", category: "auth", label: "sucesso" }),

  // Navegação
  filtroAplicado: (tipo: string) =>
    trackEvent({ action: "filtro_aplicado", category: "navegacao", label: tipo }),

  emergencyFABUsado: (acao: string) =>
    trackEvent({ action: "emergency_fab", category: "navegacao", label: acao }),

  // SOS / Resgate
  sosDisparado: (petId: string) =>
    trackEvent({ action: "sos_disparado", category: "resgate", label: petId }),
};
