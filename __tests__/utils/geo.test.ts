import { describe, it, expect } from 'vitest'
import { haversineKm } from '@/lib/geo'

// Coordenadas de referência — Baixada Santista
const SANTOS_CENTRO   = { lat: -23.9618, lng: -46.3322 }
const GUARUJA_CENTRO  = { lat: -23.9933, lng: -46.2566 }
const SAO_VICENTE     = { lat: -23.9613, lng: -46.3886 }
const SAO_PAULO       = { lat: -23.5505, lng: -46.6333 }
const PRAIA_GRANDE    = { lat: -24.0059, lng: -46.4026 }

describe('haversineKm', () => {
  it('retorna 0 para o mesmo ponto', () => {
    const dist = haversineKm(
      SANTOS_CENTRO.lat, SANTOS_CENTRO.lng,
      SANTOS_CENTRO.lat, SANTOS_CENTRO.lng,
    )
    expect(dist).toBe(0)
  })

  it('Santos → Guarujá: ~8–11 km', () => {
    const dist = haversineKm(
      SANTOS_CENTRO.lat,  SANTOS_CENTRO.lng,
      GUARUJA_CENTRO.lat, GUARUJA_CENTRO.lng,
    )
    expect(dist).toBeGreaterThan(8)
    expect(dist).toBeLessThan(11)
  })

  it('Santos → São Vicente: ~4–6 km (mesma região)', () => {
    const dist = haversineKm(
      SANTOS_CENTRO.lat, SANTOS_CENTRO.lng,
      SAO_VICENTE.lat,   SAO_VICENTE.lng,
    )
    expect(dist).toBeGreaterThan(3)
    expect(dist).toBeLessThan(7)
  })

  it('Santos → São Paulo: ~50–60 km em linha reta (fora do raio padrão de 10 km)', () => {
    // Distância rodoviária (~75 km) ≠ distância Haversine em linha reta (~55 km)
    const dist = haversineKm(
      SANTOS_CENTRO.lat, SANTOS_CENTRO.lng,
      SAO_PAULO.lat,     SAO_PAULO.lng,
    )
    expect(dist).toBeGreaterThan(50)
    expect(dist).toBeLessThan(60)
  })

  it('distância é simétrica (A→B = B→A)', () => {
    const ab = haversineKm(
      SANTOS_CENTRO.lat,  SANTOS_CENTRO.lng,
      PRAIA_GRANDE.lat,   PRAIA_GRANDE.lng,
    )
    const ba = haversineKm(
      PRAIA_GRANDE.lat,   PRAIA_GRANDE.lng,
      SANTOS_CENTRO.lat,  SANTOS_CENTRO.lng,
    )
    expect(Math.abs(ab - ba)).toBeLessThan(0.001)
  })

  it('resultado é sempre não-negativo', () => {
    const dist = haversineKm(
      PRAIA_GRANDE.lat,  PRAIA_GRANDE.lng,
      GUARUJA_CENTRO.lat, GUARUJA_CENTRO.lng,
    )
    expect(dist).toBeGreaterThanOrEqual(0)
  })
})
