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
        brand: {
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
        },
        ink: {
          600: 'var(--color-ink-600)',
          700: 'var(--color-ink-700)',
          800: 'var(--color-ink-800)',
          900: 'var(--color-ink-900)',
        },
        fg: 'var(--color-fg)',
        'fg-muted':  'var(--color-fg-muted)',
        'fg-subtle': 'var(--color-fg-subtle)',
        danger:      'var(--color-danger)',
        'danger-fg': 'var(--color-danger-fg)',
        success:     'var(--color-success)',
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
