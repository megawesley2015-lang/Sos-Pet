import { callClaude, extractJson } from './claude'
import type { PetInputForAgents, TriagemResult } from './types'

const SYSTEM = `Você é o Agente de Triagem do SOS Pet Aumigo, plataforma de localização de pets perdidos na Baixada Santista (Santos, Guarujá, São Vicente e região).

Sua função é analisar dados de um pet cadastrado e retornar JSON estruturado com:
1. Tags para busca rápida
2. Descrição enriquecida e pesquisável (máx. 120 palavras)
3. Características organizadas
4. Palavras-chave para o algoritmo de matching

REGRAS:
- Responda APENAS com JSON válido, sem markdown
- Nunca invente informações — use só o que foi fornecido
- Se um campo não tiver dados, use null ou []
- Linguagem simples, PT-BR direto

FORMATO:
{
  "tags": ["array de strings"],
  "descricao_enriquecida": "string ou null",
  "caracteristicas": {
    "cor_principal": "string ou null",
    "porte": "string ou null",
    "raca_provavel": "string ou null",
    "caracteristicas_distintivas": ["array"],
    "temperamento": "string ou null"
  },
  "palavras_chave": ["array de strings"],
  "confianca": 0.0
}`

export async function runTriagemAgent(pet: PetInputForAgents): Promise<TriagemResult> {
  const msg = `DADOS DO PET:
Nome: ${pet.name ?? 'não informado'}
Espécie: ${pet.species}
Raça: ${pet.breed ?? 'não informado'}
Cor: ${pet.color ?? 'não informado'}
Porte: ${pet.size ?? 'não informado'}
Sexo: ${pet.sex ?? 'não informado'}
Descrição do tutor: ${pet.description ?? 'não informado'}
Comportamento: ${pet.behavior ?? 'não informado'}
Bairro: ${pet.neighborhood ?? 'não informado'}
Cidade: ${pet.city}

Retorne o JSON estruturado.`

  const raw = await callClaude(SYSTEM, msg, 700)
  return extractJson(raw) as TriagemResult
}
