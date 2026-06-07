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
          300: 'rgb(var(--color-brand-300) / <alpha-value>)',
          400: 'rgb(var(--color-brand-400) / <alpha-value>)',
          500: 'rgb(var(--color-brand-500) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700) / <alpha-value>)',
        },
        ink: {
          50:  'rgb(var(--color-ink-50)  / <alpha-value>)',
          100: 'rgb(var(--color-ink-100) / <alpha-value>)',
          200: 'rgb(var(--color-ink-200) / <alpha-value>)',
          300: 'rgb(var(--color-ink-300) / <alpha-value>)',
          400: 'rgb(var(--color-ink-400) / <alpha-value>)',
          500: 'rgb(var(--color-ink-500) / <alpha-value>)',
          600: 'rgb(var(--color-ink-600) / <alpha-value>)',
          700: 'rgb(var(--color-ink-700) / <alpha-value>)',
          800: 'rgb(var(--color-ink-800) / <alpha-value>)',
          900: 'rgb(var(--color-ink-900) / <alpha-value>)',
        },
        primary:     'rgb(var(--color-primary)     / <alpha-value>)',
        accent:      'rgb(var(--color-accent)      / <alpha-value>)',
        fg:          'rgb(var(--color-fg)          / <alpha-value>)',
        'fg-muted':  'rgb(var(--color-fg-muted)   / <alpha-value>)',
        'fg-subtle': 'rgb(var(--color-fg-subtle)  / <alpha-value>)',
        'bg-base':   'rgb(var(--color-bg)         / <alpha-value>)',
        'bg-raised': 'rgb(var(--color-bg-raised)  / <alpha-value>)',
        border:      'rgb(var(--color-border)      / <alpha-value>)',
        danger:      'rgb(var(--color-danger)      / <alpha-value>)',
        'danger-fg': 'rgb(var(--color-danger-fg)  / <alpha-value>)',
        success:     'rgb(var(--color-success)     / <alpha-value>)',
        warning:     'rgb(var(--color-warning)     / <alpha-value>)',
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
