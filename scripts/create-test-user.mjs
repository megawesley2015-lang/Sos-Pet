/**
 * Cria usuário de teste pré-confirmado via Supabase Admin API.
 * Lê credenciais do .env.local — nunca commitar este script com secrets.
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const env  = readFileSync(path.join(root, '.env.local'), 'utf-8')

function getEnv(key) {
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match?.[1]?.trim() ?? null
}

const SUPABASE_URL      = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE_KEY  = getEnv('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local')
  process.exit(1)
}

const EMAIL    = `smoke-ong-${Date.now()}@sospet.dev`
const PASSWORD = 'SmokeTest@2026!'

const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  }),
})

const data = await res.json()

if (!res.ok) {
  console.error('❌ Falha ao criar usuário:', JSON.stringify(data, null, 2))
  process.exit(1)
}

console.log(`SMOKE_EMAIL=${EMAIL}`)
console.log(`SMOKE_PASSWORD=${PASSWORD}`)
console.log(`SMOKE_USER_ID=${data.id}`)
