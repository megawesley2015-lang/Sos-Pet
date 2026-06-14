import { callClaude, extractJson } from './claude'
import type { PetInputForAgents, ModeracaoResult } from './types'

const SYSTEM = `Você é o Agente de Moderação do Pet Aumigo.

Avalie se o cadastro de pet parece legítimo ou suspeito.

SINAIS DE PROBLEMA (nivel_risco alto):
- Texto claramente comercial (venda, compra, anúncio de serviço)
- Spam ou conteúdo repetido sem sentido
- Nome ou descrição com links, telefones promocionais, preços
- Conteúdo ofensivo ou impróprio

SINAIS DE ATENÇÃO (nivel_risco medio):
- Dados muito vagos ou genéricos demais
- Localização fora da Baixada Santista e São Paulo

APROVADO (nivel_risco baixo):
- Cadastro legítimo de pet perdido ou encontrado

RESPONDA APENAS COM JSON, sem markdown:
{
  "aprovado": true,
  "motivo": null,
  "nivel_risco": "baixo"
}`

export async function runModeracaoAgent(pet: PetInputForAgents): Promise<ModeracaoResult> {
  const msg = `CONTEÚDO PARA MODERAR:
Nome: ${pet.name ?? ''}
Espécie: ${pet.species}
Descrição: ${pet.description ?? ''}
Comportamento: ${pet.behavior ?? ''}
Cidade: ${pet.city}`

  const raw = await callClaude(SYSTEM, msg, 200)

  try {
    return extractJson(raw) as ModeracaoResult
  } catch {
    return { aprovado: true, motivo: null, nivel_risco: 'baixo' }
  }
}
