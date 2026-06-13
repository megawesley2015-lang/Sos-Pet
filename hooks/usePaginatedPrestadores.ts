'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { PrestadorRow } from '@/lib/types/database'

export interface PrestadorCursor {
  avaliacao:  number
  created_at: string
  id:         string
}

export interface PrestadorFiltersInput {
  categoria?:    string
  cidade?:       string
  busca?:        string
  emergencia24h?: boolean
}

export interface UsePaginatedPrestadoresReturn {
  prestadores: PrestadorRow[]
  loadMore:    () => void
  isLoading:   boolean
  hasMore:     boolean
  error:       string | null
  reset:       () => void
}

export function usePaginatedPrestadores(
  filters: PrestadorFiltersInput = {}
): UsePaginatedPrestadoresReturn {
  const [prestadores, setPrestadores] = useState<PrestadorRow[]>([])
  const [nextCursor,  setNextCursor]  = useState<PrestadorCursor | null>(null)
  const [isLoading,   setIsLoading]   = useState(false)
  const [hasMore,     setHasMore]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const filtersRef = useRef<PrestadorFiltersInput>(filters)
  filtersRef.current = filters

  const fetchPrestadores = useCallback(async (cursor: PrestadorCursor | null, append: boolean) => {
    setIsLoading(true)
    if (!append) setError(null)

    try {
      const f = filtersRef.current
      const params = new URLSearchParams()
      if (f.categoria)     params.set('categoria',    f.categoria)
      if (f.cidade)        params.set('cidade',        f.cidade)
      if (f.busca)         params.set('busca',         f.busca)
      if (f.emergencia24h) params.set('emergencia24h', '1')
      if (cursor) {
        params.set('cursor_avaliacao',   String(cursor.avaliacao))
        params.set('cursor_created_at',  cursor.created_at)
        params.set('cursor_id',          cursor.id)
      }

      const res  = await fetch(`/api/prestadores?${params.toString()}`)
      const json = await res.json() as {
        success: boolean
        data?: { prestadores: PrestadorRow[]; next_cursor: PrestadorCursor | null }
        error?: string
      }

      if (!json.success || !json.data) throw new Error(json.error ?? 'Erro ao carregar prestadores')

      const newItems = json.data.prestadores ?? []
      const nc       = json.data.next_cursor ?? null

      setPrestadores(prev => append ? [...prev, ...newItems] : newItems)
      setNextCursor(nc)
      setHasMore(nc !== null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar prestadores')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const filterKey = [filters.categoria, filters.cidade, filters.busca, filters.emergencia24h].join('|')
  useEffect(() => {
    setPrestadores([])
    setNextCursor(null)
    setHasMore(false)
    setError(null)
    fetchPrestadores(null, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return
    fetchPrestadores(nextCursor, true)
  }, [isLoading, hasMore, nextCursor, fetchPrestadores])

  const reset = useCallback(() => {
    setPrestadores([])
    setNextCursor(null)
    setHasMore(false)
    setError(null)
    fetchPrestadores(null, false)
  }, [fetchPrestadores])

  return { prestadores, loadMore, isLoading, hasMore, error, reset }
}
