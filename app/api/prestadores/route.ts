// app/api/prestadores/route.ts — GET com cursor pagination
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server'
import { ok, fail } from '@/lib/api-response'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import type { PrestadorRow } from '@/lib/types/database'

const GET_LIMIT = { limit: 60, windowMs: 60_000 } // 60 req/min

const SAFE_SELECT = [
  'id', 'slug', 'nome', 'descricao', 'categoria', 'cidade', 'bairro',
  'logo_url', 'emergencia24h', 'delivery', 'verificado', 'destaque',
  'media_avaliacoes', 'total_avaliacoes', 'created_at',
].join(',')

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(`prestadores-get:${getClientIp(req)}`, GET_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Tente novamente em alguns instantes.', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const { searchParams } = req.nextUrl
    const categoria   = searchParams.get('categoria')
    const cidade      = searchParams.get('cidade')
    const busca       = searchParams.get('busca')
    const emergencia  = searchParams.get('emergencia24h')
    const limitRaw    = Number(searchParams.get('limit') ?? '20')

    // Cursor composto: (media_avaliacoes, created_at, id)
    const cursorAvaliacao  = searchParams.get('cursor_avaliacao')   // string float
    const cursorCreatedAt  = searchParams.get('cursor_created_at')
    const cursorId         = searchParams.get('cursor_id')

    if (limitRaw > 100) {
      return NextResponse.json({ success: false, error: 'Limite máximo é 100' }, { status: 400 })
    }
    const limit = Math.max(1, limitRaw)

    const supabase = await createClient()
    let query = supabase
      .from('prestadores')
      .select(SAFE_SELECT)
      .eq('status', 'ativo')
      .order('destaque',        { ascending: false })
      .order('media_avaliacoes',{ ascending: false })
      .order('created_at',      { ascending: false })
      .order('id',              { ascending: false })
      .limit(limit + 1)

    if (categoria)         query = query.eq('categoria', categoria)
    if (cidade)            query = query.ilike('cidade', `%${cidade}%`)
    if (emergencia === '1') query = query.eq('emergencia24h', true)
    if (busca) {
      const term = `%${busca}%`
      query = query.or(`nome.ilike.${term},descricao.ilike.${term}`)
    }

    // Keyset cursor simplificado: usar created_at + id como cursor
    // (media_avaliacoes pode ter empates — degradar para created_at/id como desempate)
    if (cursorCreatedAt && cursorId) {
      const baseCursor = cursorAvaliacao
        ? `media_avaliacoes.lt.${cursorAvaliacao},and(media_avaliacoes.eq.${cursorAvaliacao},created_at.lt.${cursorCreatedAt}),and(media_avaliacoes.eq.${cursorAvaliacao},created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
        : `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
      query = query.or(baseCursor)
    }

    const { data, error } = await query
    if (error) return fail(error)

    const rows    = data ?? []
    const hasMore = rows.length > limit
    const prestadores = (hasMore ? rows.slice(0, limit) : rows) as unknown as PrestadorRow[]
    const last    = prestadores[prestadores.length - 1]
    const next_cursor = hasMore && last
      ? {
          avaliacao:  last.media_avaliacoes ?? 0,
          created_at: last.created_at,
          id:         last.id,
        }
      : null

    const res = ok({ prestadores, next_cursor })
    Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => res.headers.set(k, v))
    return res

  } catch (err) {
    return fail(err)
  }
}
