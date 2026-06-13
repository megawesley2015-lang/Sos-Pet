/**
 * Rate limiter com Upstash Redis em produção e fallback in-memory em dev local.
 *
 * Produção (Vercel): define UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN
 *   → estado compartilhado entre todas as instâncias serverless
 *
 * Dev local (sem variáveis): usa Map em memória por instância
 *   → suficiente para testes locais, não compartilhado
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

export interface RateLimitConfig {
  /** Número máximo de requests na janela */
  limit:    number
  /** Duração da janela em milissegundos */
  windowMs: number
}

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number  // epoch ms
}

// ── Upstash (produção) ──────────────────────────────────────────────────────

const isUpstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getUpstashLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.limit}:${config.windowMs}`
  if (!limiters.has(cacheKey)) {
    if (!redis) {
      redis = new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    }
    const windowSeconds = Math.ceil(config.windowMs / 1000)
    limiters.set(cacheKey, new Ratelimit({
      redis,
      limiter:   Ratelimit.slidingWindow(config.limit, `${windowSeconds} s` as `${number} s`),
      analytics: false,
    }))
  }
  return limiters.get(cacheKey)!
}

// ── In-memory fallback (dev local sem Upstash) ──────────────────────────────

interface RateLimitEntry {
  count:   number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
let lastCleanup = Date.now()

function maybeCleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}

export function checkInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  maybeCleanup()
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs }
  }

  entry.count++
  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

// ── API pública ─────────────────────────────────────────────────────────────

export async function checkRateLimit(
  key:    string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!isUpstashConfigured && process.env.NODE_ENV === 'production') {
    throw new Error(
      'Rate limiter Redis não configurado. ' +
      'Defina UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN na Vercel.'
    )
  }
  if (isUpstashConfigured) {
    const limiter = getUpstashLimiter(config)
    const result  = await limiter.limit(key)
    return {
      allowed:   result.success,
      remaining: result.remaining,
      resetAt:   result.reset,
    }
  }
  return checkInMemory(key, config)
}

/**
 * Monta headers de rate limit para incluir na resposta.
 * Sempre inclui X-RateLimit-Remaining. Adiciona Retry-After apenas em 429.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(result.remaining),
  }
  if (!result.allowed) {
    headers['Retry-After'] = String(Math.ceil((result.resetAt - Date.now()) / 1000))
  }
  return headers
}

/** Extrai IP do request — usa headers injetados pela Vercel (não manipuláveis pelo cliente) */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers)
  return (
    headers.get('x-vercel-forwarded-for') ??
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
