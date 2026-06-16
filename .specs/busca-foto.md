---
name: busca-foto
status: pending
priority: 2
depends_on: []
---

# Busca Visual por Foto de Pet

## O que implementar

### 1. API Route de análise
- `POST /api/pets/busca-por-foto`
- Recebe: `multipart/form-data` com `foto` (image/*)
- Usa Claude Vision (claude-haiku-4-5) para extrair: especie, cor, pelagem, porte estimado
- Retorna: `{ especie, cor, pelagem, porte, confianca }`

### 2. Query de similaridade
- Com os dados extraídos, faz SELECT em `pets_public` com filtros:
  - `species = especie` (obrigatório)
  - `color ILIKE '%cor%'` (preferencial)
  - `kind = 'found'` (encontrados — quem perdeu busca nos encontrados)
  - `status = 'active'`
- Retorna top 10 mais recentes

### 3. UI — Botão "Buscar por foto"
- Em `/achados-e-perdidos`: botão "🔍 Buscar por foto do meu pet"
- Abre modal com upload de imagem + preview
- Mostra loading → depois grid de pets similares encontrados

### 4. Variável de ambiente necessária
```
ANTHROPIC_API_KEY=sk-ant-... (já deve existir para agentes n8n)
```

## Harness gate
```bash
npm run typecheck && npm run build
```

## Critério de aceite
- Upload de foto retorna lista de pets similares em < 5s
- Fallback: se API falhar, mostra busca manual por filtros
- Rate limit: 5 buscas/minuto por IP (anti-abuso)
