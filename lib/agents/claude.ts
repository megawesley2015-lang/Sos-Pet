const CLAUDE_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

interface ClaudeTextBlock {
  type: 'text'
  text: string
}

interface ClaudeResponse {
  content: ClaudeTextBlock[]
}

export async function callClaude(
  system: string,
  userMessage: string,
  maxTokens = 512
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')

  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Claude API ${res.status}: ${errText}`)
  }

  const data = await res.json() as ClaudeResponse
  return data.content[0]?.text ?? ''
}

export function extractJson(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON não encontrado na resposta do agente')
  return JSON.parse(match[0])
}
