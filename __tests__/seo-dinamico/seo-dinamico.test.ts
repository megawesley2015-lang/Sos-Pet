import { describe, it, expect } from 'vitest'
import { parseSlug, generateSeoTitle, generateAllParams, CITIES_SLUG_MAP, TYPE_FILTER_MAP } from '@/lib/seo/slug-maps'

describe('parseSlug', () => {
  it('retorna filtros corretos para cachorro-perdido em santos', () => {
    const result = parseSlug('cachorro-perdido', 'santos')
    expect(result).toEqual({ species: 'dog', kind: 'lost', cityName: 'Santos' })
  })

  it('retorna null para tipo invalido', () => {
    expect(parseSlug('tipo-invalido', 'santos')).toBeNull()
  })

  it('retorna null para cidade invalida', () => {
    expect(parseSlug('pet-perdido', 'sao-paulo')).toBeNull()
  })

  it('aceita gato-encontrado', () => {
    const result = parseSlug('gato-encontrado', 'guaruja')
    expect(result?.species).toBe('cat')
    expect(result?.kind).toBe('found')
    expect(result?.cityName).toBe('Guarujá')
  })

  it('pet-perdido nao tem especie', () => {
    const result = parseSlug('pet-perdido', 'bertioga')
    expect(result?.species).toBeUndefined()
    expect(result?.kind).toBe('lost')
  })
})

describe('generateAllParams', () => {
  it('gera exatamente 54 combinacoes (6 tipos x 9 cidades)', () => {
    const params = generateAllParams()
    expect(params).toHaveLength(54)
  })

  it('todos os tipos estao representados', () => {
    const params = generateAllParams()
    const types = [...new Set(params.map(p => p.type))]
    expect(types).toHaveLength(Object.keys(TYPE_FILTER_MAP).length)
  })

  it('todas as cidades estao representadas', () => {
    const params = generateAllParams()
    const cities = [...new Set(params.map(p => p.city))]
    expect(cities).toHaveLength(Object.keys(CITIES_SLUG_MAP).length)
  })
})

describe('generateSeoTitle', () => {
  it('gera titulo em PT-BR correto', () => {
    const title = import('@/lib/seo/slug-maps').then(m => m.generateSeoTitle('cachorro-perdido', 'Santos'))
    expect(title).resolves.toContain('Santos')
  })
})
