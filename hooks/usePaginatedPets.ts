'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { PetPublic } from '@/types/pets'

export interface PetCursor {
  created_at: string
  id: string
}

export interface PetFiltersInput {
  kind?:         string
  species?:      string
  city?:         string
  status?:       string
  color?:        string
  size?:         string
  neighborhood?: string
  lat?:          number
  lng?:          number
  radiusKm?:     number
}

export interface UsePaginatedPetsReturn {
  pets:        PetPublic[]
  loadMore:    () => void
  isLoading:   boolean
  hasMore:     boolean
  error:       string | null
  reset:       () => void
  total_count: number
}

export function usePaginatedPets(
  filters: PetFiltersInput = {}
): UsePaginatedPetsReturn {
  const [pets,        setPets]       = useState<PetPublic[]>([])
  const [nextCursor,  setNextCursor] = useState<PetCursor | null>(null)
  const [isLoading,   setIsLoading]  = useState(false)
  const [hasMore,     setHasMore]    = useState(false)
  const [error,       setError]      = useState<string | null>(null)
  const [total_count, setTotalCount] = useState(0)

  // Ref estável para filtros — evita stale closures em fetchPets
  const filtersRef = useRef<PetFiltersInput>(filters)
  filtersRef.current = filters

  const fetchPets = useCallback(async (cursor: PetCursor | null, append: boolean) => {
    setIsLoading(true)
    if (!append) setError(null)

    try {
      const f = filtersRef.current
      const params = new URLSearchParams()
      if (f.kind)         params.set('kind',         f.kind)
      if (f.species)      params.set('species',      f.species)
      if (f.city)         params.set('city',         f.city)
      if (f.status)       params.set('status',       f.status)
      if (f.color)        params.set('color',        f.color)
      if (f.size)         params.set('size',         f.size)
      if (f.neighborhood) params.set('neighborhood', f.neighborhood)
      if (f.lat != null)      params.set('lat',      String(f.lat))
      if (f.lng != null)      params.set('lng',      String(f.lng))
      if (f.radiusKm != null) params.set('radius_km', String(f.radiusKm))
      if (cursor) {
        params.set('cursor_created_at', cursor.created_at)
        params.set('cursor_id',         cursor.id)
      }

      const res  = await fetch(`/api/pets?${params.toString()}`)
      const json = await res.json() as {
        success: boolean
        data?: { pets: PetPublic[]; next_cursor: PetCursor | null; total_count: number }
        error?: string
      }

      if (!json.success || !json.data) {
        throw new Error(json.error ?? 'Erro ao carregar pets')
      }

      const newPets = json.data.pets ?? []
      const nc      = json.data.next_cursor ?? null

      setPets(prev => append ? [...prev, ...newPets] : newPets)
      setNextCursor(nc)
      setHasMore(nc !== null)
      if (!append) setTotalCount(json.data.total_count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pets')
    } finally {
      setIsLoading(false)
    }
  }, []) // estável — lê filtros via filtersRef

  // Reset + primeira página ao mudar filtros
  const filterKey = [
    filters.kind, filters.species, filters.city, filters.status,
    filters.color, filters.size, filters.neighborhood,
    filters.lat, filters.lng, filters.radiusKm,
  ].join('|')
  useEffect(() => {
    setPets([])
    setNextCursor(null)
    setHasMore(false)
    setError(null)
    fetchPets(null, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return
    fetchPets(nextCursor, true)
  }, [isLoading, hasMore, nextCursor, fetchPets])

  const reset = useCallback(() => {
    setPets([])
    setNextCursor(null)
    setHasMore(false)
    setError(null)
    fetchPets(null, false)
  }, [fetchPets])

  return { pets, loadMore, isLoading, hasMore, error, reset, total_count }
}
