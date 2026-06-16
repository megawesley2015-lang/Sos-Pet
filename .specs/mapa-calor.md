---
name: mapa-calor
status: pending
priority: 3
depends_on: []
---

# Mapa de Calor — Concentração de Pets Perdidos por Bairro

## O que implementar

### 1. API Route de dados
- `GET /api/pets/heatmap?cidade=Santos&kind=lost`
- Retorna: `{ lat, lng, weight }[]` — apenas pets com coordenadas
- Cache: 5 minutos (Vercel Edge Cache headers)

### 2. Componente de mapa
- `components/map/HeatMap.tsx` — usa Leaflet + plugin `leaflet.heat`
- Instalação: `npm install leaflet.heat @types/leaflet`
- Carrega dinâmico (`next/dynamic`, SSR: false)

### 3. Página `/mapa`
- Já existe a rota — implementar o conteúdo real
- Toggle: "Perdidos" / "Encontrados" / "Avistamentos"
- Filtro de cidade (default: Santos)
- Legenda de intensidade: vermelho escuro = muitos perdidos

### 4. Link na home
- Seção "Mapa da Região" em `/` com preview estático do mapa
- CTA: "Ver mapa completo →" para `/mapa`

## Harness gate
```bash
npm run typecheck && npm run build
```

## Critério de aceite
- Mapa renderiza pontos de calor por bairro
- Toggle entre perdidos/encontrados funciona sem reload
- Rota `/mapa` carrega em < 2s
- Fallback: se sem dados de coordenadas, mostra mapa vazio com mensagem
