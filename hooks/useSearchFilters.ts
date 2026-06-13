'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PetKind, PetSpecies, PetSize } from '@/types/pets'

export interface SearchFilters {
  kind?:         PetKind
  species?:      PetSpecies
  city?:         string
  color?:        string
  size?:         PetSize
  neighborhood?: string
  lat?:          number
  lng?:          number
  radiusKm?:     number
}

export interface UseSearchFiltersReturn {
  filters:            SearchFilters
  setFilter:          <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  clearFilters:       () => void
  activeFilterCount:  number
  requestLocation:    (onError?: (msg: string) => void) => void
}

const FILTER_KEYS: Array<keyof SearchFilters> = [
  'kind', 'species', 'city', 'color', 'size', 'neighborhood', 'lat', 'lng', 'radiusKm',
]

export function useSearchFilters(): UseSearchFiltersReturn {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Lê o estado atual dos filtros a partir dos query params da URL
  const filters = useMemo<SearchFilters>(() => {
    const lat      = searchParams.get('lat')
    const lng      = searchParams.get('lng')
    const radiusKm = searchParams.get('radiusKm')
    return {
      kind:         (searchParams.get('kind')         as PetKind    | null)    ?? undefined,
      species:      (searchParams.get('species')      as PetSpecies | null)    ?? undefined,
      city:         searchParams.get('city')          ?? undefined,
      color:        searchParams.get('color')         ?? undefined,
      size:         (searchParams.get('size')         as PetSize    | null)    ?? undefined,
      neighborhood: searchParams.get('neighborhood')  ?? undefined,
      lat:          lat      != null ? Number(lat)      : undefined,
      lng:          lng      != null ? Number(lng)      : undefined,
      radiusKm:     radiusKm != null ? Number(radiusKm) : undefined,
    }
  }, [searchParams])

  const activeFilterCount = useMemo(
    () => FILTER_KEYS.filter(k => filters[k] !== undefined).length,
    [filters]
  )

  // Atualiza um filtro e sincroniza com a URL sem reload
  const setFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === undefined || value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  // Remove todos os query params de filtro
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    FILTER_KEYS.forEach(k => params.delete(k))
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Solicita geolocalização e seta lat/lng automaticamente
  const requestLocation = useCallback(
    (onError?: (msg: string) => void) => {
      if (!navigator.geolocation) {
        onError?.('Geolocalização não suportada pelo navegador')
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('lat', String(pos.coords.latitude))
          params.set('lng', String(pos.coords.longitude))
          router.replace(`?${params.toString()}`, { scroll: false })
        },
        () => {
          onError?.('Permissão de localização negada')
        }
      )
    },
    [router, searchParams]
  )

  return { filters, setFilter, clearFilters, activeFilterCount, requestLocation }
}
