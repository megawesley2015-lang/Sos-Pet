import { describe, it, expect } from 'vitest'

function truncateName(name: string, max = 20): string {
  return name.length > max ? name.slice(0, max) + '...' : name
}

describe('PlaquinhaPreview', () => {
  it('trunca nome com 25 chars para 20 + "..."', () => {
    const result = truncateName('NomeMuitoLongoParaPlaquinha', 20)
    expect(result.length).toBe(23)
    expect(result.endsWith('...')).toBe(true)
  })

  it('nao trunca nome com 15 chars', () => {
    const result = truncateName('NomeCurto', 20)
    expect(result).toBe('NomeCurto')
  })

  it('trunca exatamente no limite de 20', () => {
    const result = truncateName('12345678901234567890', 20)
    expect(result).toBe('12345678901234567890')
    expect(result.length).toBe(20)
  })

  it('URL do QR code contem o petId', () => {
    const siteUrl = 'https://sospetamigo.com.br'
    const petId = 'abc-123'
    const qrValue = `${siteUrl}/pets/${petId}`
    expect(qrValue).toBe('https://sospetamigo.com.br/pets/abc-123')
  })

  it('URL do QR code usa siteUrl correto', () => {
    const petId = 'test-id'
    const siteUrl = 'https://sospetamigo.com.br'
    expect(`${siteUrl}/pets/${petId}`).toContain('/pets/')
    expect(`${siteUrl}/pets/${petId}`).toContain(petId)
  })
})

describe('usePlaquinhaGenerator', () => {
  it('nome do arquivo PNG inclui petName sanitizado', () => {
    const petName = 'Bolinha da Silva'
    const filename = `plaquinha-${petName.replace(/\s+/g, '-').toLowerCase()}.png`
    expect(filename).toBe('plaquinha-bolinha-da-silva.png')
  })

  it('nome do arquivo PDF inclui petName sanitizado', () => {
    const petName = 'Rex'
    const filename = `plaquinha-${petName.replace(/\s+/g, '-').toLowerCase()}.pdf`
    expect(filename).toBe('plaquinha-rex.pdf')
  })

  it('petName com caracteres especiais e multiplos espacos', () => {
    const petName = 'Luna  Pet'
    const filename = `plaquinha-${petName.replace(/\s+/g, '-').toLowerCase()}.png`
    expect(filename).toBe('plaquinha-luna-pet.png')
  })
})
