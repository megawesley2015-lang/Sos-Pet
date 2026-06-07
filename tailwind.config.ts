// tailwind.config.ts — versão corrigida para Tailwind v4
// No Tailwind v4, cores customizadas definidas APENAS aqui NÃO funcionam
// automaticamente. As CSS custom properties são declaradas no globals.css
// e referenciadas aqui para gerar as classes utilitárias (bg-brand-500 etc.)

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './actions/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      colors: {
        // Tailwind v4: @theme define as vars como hex — var() direto é válido
        // As classes abaixo são geradas pelo config mas as cores vêm do @theme via CSS
      },
      boxShadow: {
        'glow-brand':    'var(--shadow-glow-brand)',
        'glow-brand-lg': 'var(--shadow-glow-brand-lg)',
        'glow-cyan':     'var(--shadow-glow-cyan)',
        'card-dark':     'var(--shadow-card-dark)',
      },
      fontFamily: {
        sans:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
    },
  },

  plugins: [],
}

export default config
