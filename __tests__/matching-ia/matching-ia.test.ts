import { describe, it, expect } from 'vitest'
import { calculateMatchScore, haversineDistanceKm } from '@/lib/matching/score'
import type { PetForMatching } from '@/lib/matching/score'

const base: PetForMatching = {
  id: 'lost-1',
  species: 'dog',
  city: 'Santos',
  color: 'marrom',
  breed: 'labrador',
  latitude: -23.9,
  longitude: -46.3,
  created_at: new Date().toISOString(),
}

describe('calculateMatchScore', () => {
  it('retorna 0 para especies diferentes', () => {
    const found = { ...base, id: 'f1', species: 'cat' }
    expect(calculateMatchScore(base, found)).toBe(0)
  })

  it('retorna score alto para pets identicos', () => {
    const found = { ...base, id: 'f2' }
    expect(calculateMatchScore(base, found)).toBeGreaterThanOrEqual(0.9)
  })

  it('retorna 0 para score abaixo de 0.55', () => {
    const found = { ...base, id: 'f3', species: 'dog', city: 'Curitiba', color: 'branco', breed: 'poodle' }
    const score = calculateMatchScore(base, found)
    expect(score).toBe(0)
  })

  it('score sem cidade correspondente e menor', () => {
    const withCity = { ...base, id: 'f4' }
    const noCity = { ...base, id: 'f5', city: 'Guaruja' }
    const scoreWithCity = calculateMatchScore(base, withCity)
    const scoreNoCity = calculateMatchScore(base, noCity)
    expect(scoreWithCity).toBeGreaterThan(scoreNoCity)
  })

  it('confianca nunca excede 1.0', () => {
    const found = { ...base, id: 'f6' }
    expect(calculateMatchScore(base, found)).toBeLessThanOrEqual(1.0)
  })

  it('score e simetrico (lost e found sao intercambiaveis)', () => {
    const found = { ...base, id: 'f7', city: 'Santos', color: 'marrom' }
    const s1 = calculateMatchScore(base, found)
    const s2 = calculateMatchScore({ ...found, id: base.id }, { ...base, id: found.id })
    expect(s1).toBeCloseTo(s2, 5)
  })
})

describe('haversineDistanceKm', () => {
  it('distancia de mesmo ponto e 0', () => {
    expect(haversineDistanceKm(-23.9, -46.3, -23.9, -46.3)).toBeCloseTo(0, 2)
  })

  it('distancia Santos-Guaruja e aproximadamente 20km', () => {
    const dist = haversineDistanceKm(-23.9, -46.3, -23.98, -46.22)
    expect(dist).toBeGreaterThan(5)
    expect(dist).toBeLessThan(30)
  })

  it('pontos proximos tem distancia pequena', () => {
    const dist = haversineDistanceKm(-23.9, -46.3, -23.91, -46.31)
    expect(dist).toBeLessThan(2)
  })

  it('pontos distantes tem distancia grande', () => {
    const dist = haversineDistanceKm(-23.9, -46.3, -23.0, -43.0)
    expect(dist).toBeGreaterThan(200)
  })
})
