import type { Config } from "tailwindcss";

/**
 * SOS Pet — Design System
 *
 * Estratégia de tema:
 * - Dark-first (app autenticado, listagem, mapa de calor)
 * - Light-warm disponível via `data-theme="light"` no <html> (landing/checkout futuro)
 *
 * Cores de acento:
 * - brand (laranja quente)  → emoção, cuidado, alerta, SOS
 * - cyan (ciano)            → tecnologia, precisão, sucesso/reencontro
 * - danger (vermelho)       → urgência crítica (diferente de SOS-laranja)
 *
 * Tokens semânticos (--color-*) ficam em globals.css para trocar tema sem rebuild.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      colors: {
        // === Paleta bruta (use preferencialmente os tokens semânticos abaixo) ===
        brand: {
          50: "#FFF1E9",
          100: "#FFDAC1",
          200: "#FFBE97",
          300: "#FFA06B",
          400: "#FF8447",
          500: "#FF6B35", // primária
          600: "#E85423",
          700: "#BF3F17",
          800: "#8F2E10",
          900: "#5A1C08",
        },
        cyan: {
          50: "#E0FBFF",
          100: "#B2F3FF",
          200: "#7DEAFF",
          300: "#47DEFE",
          400: "#1FD1F5",
          500: "#00E5FF", // secundária
          600: "#00B8D4",
          700: "#0090A8",
          800: "#006275",
          900: "#003A45",
        },
        ink: {
          // fundo e superfícies do tema dark
          950: "#07070D",
          900: "#0A0A0F",
          800: "#0F0F1A",
          700: "#14141F",
          600: "#1A1A2E",
          500: "#252538",
          400: "#3A3A52",
          300: "#6B6B80",
          200: "#9A9AAC",
          100: "#C5C5D1",
          50: "#E8E8EE",
        },
        warm: {
          // fundos do tema light-warm (landing, cadastro público)
          50: "#FFF8F3",
          100: "#FFF0E4",
          200: "#FFE4CF",
          300: "#FFD0A8",
        },
        // === Tokens semânticos (mapeiam para CSS vars em globals.css) ===
        bg: {
          DEFAULT: "rgb(var(--color-bg) / <alpha-value>)",
          raised: "rgb(var(--color-bg-raised) / <alpha-value>)",
          overlay: "rgb(var(--color-bg-overlay) / <alpha-value>)",
        },
        fg: {
          DEFAULT: "rgb(var(--color-fg) / <alpha-value>)",
          muted: "rgb(var(--color-fg-muted) / <alpha-value>)",
          subtle: "rgb(var(--color-fg-subtle) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          strong: "rgb(var(--color-border-strong) / <alpha-value>)",
          brand: "rgb(var(--color-border-brand) / <alpha-value>)",
          cyan: "rgb(var(--color-border-cyan) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          fg: "rgb(var(--color-primary-fg) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          fg: "rgb(var(--color-accent-fg) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "#DC2626",
          fg: "#FEE2E2",
        },
        success: {
          DEFAULT: "#10B981",
          fg: "#D1FAE5",
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        // Glows — usar com MODERAÇÃO (max 2-3 por tela)
        "glow-brand": "0 0 16px rgba(255, 107, 53, 0.4)",
        "glow-brand-lg": "0 0 32px rgba(255, 107, 53, 0.5)",
        "glow-cyan": "0 0 16px rgba(0, 229, 255, 0.4)",
        "glow-cyan-lg": "0 0 32px rgba(0, 229, 255, 0.5)",
        "glow-danger": "0 0 16px rgba(220, 38, 38, 0.5)",
        "card-dark": "0 4px 12px rgba(0, 0, 0, 0.4)",
      },
      keyframes: {
        "pulse-brand": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(255, 107, 53, 0.4)" },
          "50%": { boxShadow: "0 0 24px rgba(255, 107, 53, 0.7)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-brand": "pulse-brand 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
      backgroundImage: {
        "grid-dark":
          "linear-gradient(rgba(255,107,53,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)",
        "radial-brand":
          "radial-gradient(ellipse at top right, rgba(255,107,53,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(0,229,255,0.08) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
