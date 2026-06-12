import { describe, it, expect } from 'vitest'

const KM_PER_DEGREE = 111.32

function calcBoundingBox(lat: number, lng: number, radiusKm: number) {
  const delta = radiusKm / KM_PER_DEGREE
  const lngDelta = radiusKm / (KM_PER_DEGREE * Math.cos((lat * Math.PI) / 180))
  return { latMin: lat - delta, latMax: lat + delta, lngMin: lng - lngDelta, lngMax: lng + lngDelta }
}

describe('calcBoundingBox', () => {
  it('raio de 5km em Santos gera delta correto', () => {
    const box = calcBoundingBox(-23.9, -46.3, 5)
    const expectedDelta = 5 / KM_PER_DEGREE
    expect(box.latMin).toBeCloseTo(-23.9 - expectedDelta, 4)
    expect(box.latMax).toBeCloseTo(-23.9 + expectedDelta, 4)
  })

  it('bounding box e simetrico ao redor do ponto', () => {
    const box = calcBoundingBox(-23.9, -46.3, 10)
    const latRange = box.latMax - box.latMin
    expect(latRange).toBeCloseTo((2 * 10) / KM_PER_DEGREE, 4)
  })

  it('raio de 1km produz caixa pequena', () => {
    const box = calcBoundingBox(-23.9, -46.3, 1)
    expect(box.latMax - box.latMin).toBeLessThan(0.02)
  })

  it('raio de 100km produz caixa grande', () => {
    const box = calcBoundingBox(-23.9, -46.3, 100)
    expect(box.latMax - box.latMin).toBeGreaterThan(1.5)
  })
})

describe('filtros de pets', () => {
  it('filtro de cor por substring', () => {
    const pets = [{ id: '1', color: 'marrom escuro' }, { id: '2', color: 'preto' }, { id: '3', color: 'Marrom claro' }]
    const result = pets.filter(p => p.color.toLowerCase().includes('marrom'))
    expect(result).toHaveLength(2)
  })

  it('filtro de porte exato', () => {
    const pets = [{ id: '1', size: 'small' }, { id: '2', size: 'medium' }, { id: '3', size: 'small' }]
    expect(pets.filter(p => p.size === 'small')).toHaveLength(2)
  })

  it('filtro de bairro case-insensitive', () => {
    const pets = [{ id: '1', neighborhood: 'Centro' }, { id: '2', neighborhood: 'centro historico' }, { id: '3', neighborhood: 'Boqueirao' }]
    expect(pets.filter(p => p.neighborhood.toLowerCase().includes('centro'))).toHaveLength(2)
  })

  it('filtros combinados reduzem resultados', () => {
    const pets = [
      { id: '1', species: 'dog', size: 'small', color: 'marrom' },
      { id: '2', species: 'cat', size: 'small', color: 'preto' },
      { id: '3', species: 'dog', size: 'large', color: 'marrom' },
      { id: '4', species: 'dog', size: 'small', color: 'marrom claro' },
    ]
    const result = pets.filter(p => p.species === 'dog' && p.size === 'small' && p.color.includes('marrom'))
    expect(result).toHaveLength(2)
  })
})

describe('activeFilterCount', () => {
  function countActive(filters: Record<string, string | undefined>) {
    return Object.values(filters).filter(v => v !== undefined && v !== '').length
  }

  it('zero filtros = count 0', () => { expect(countActive({})).toBe(0) })
  it('um filtro ativo = count 1', () => { expect(countActive({ species: 'dog' })).toBe(1) })
  it('multiplos filtros', () => { expect(countActive({ species: 'cat', color: 'preto', size: 'small' })).toBe(3) })
  it('filtro vazio nao conta', () => { expect(countActive({ species: '', color: 'marrom' })).toBe(1) })
})
