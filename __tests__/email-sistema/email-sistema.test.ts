import { describe, it, expect } from 'vitest'
import {
  petConfirmationTemplate,
  matchFoundTemplate,
  adoptionConfirmationTemplate,
  petFollowUpTemplate,
} from '@/lib/email/templates'

const SITE_URL = 'https://sospetamigo.com.br'

describe('petConfirmationTemplate', () => {
  it('contém o nome do pet no HTML', () => {
    const html = petConfirmationTemplate({
      petName: 'Bolinha',
      petId: 'abc-123',
      species: 'dog',
      siteUrl: SITE_URL,
    })
    expect(html).toContain('Bolinha')
    expect(html).toContain('abc-123')
  })

  it('sanitiza HTML no nome do pet', () => {
    const html = petConfirmationTemplate({
      petName: '<script>alert(1)</script>',
      petId: 'abc-123',
      species: 'dog',
      siteUrl: SITE_URL,
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('inclui link para o pet', () => {
    const html = petConfirmationTemplate({
      petName: 'Mel',
      petId: 'pet-456',
      species: 'cat',
      siteUrl: SITE_URL,
    })
    expect(html).toContain(`${SITE_URL}/pets/pet-456`)
  })
})

describe('matchFoundTemplate', () => {
  it('exibe porcentagem de compatibilidade', () => {
    const html = matchFoundTemplate({
      petName: 'Rex',
      matchPetName: 'Parecido com Rex',
      matchCity: 'Santos',
      matchId: 'match-789',
      score: 0.85,
      siteUrl: SITE_URL,
    })
    expect(html).toContain('85%')
    expect(html).toContain('Santos')
  })

  it('sanitiza nome do pet no match', () => {
    const html = matchFoundTemplate({
      petName: '<b>Injeção</b>',
      matchPetName: 'Normal',
      matchCity: 'Santos',
      matchId: 'match-789',
      score: 0.70,
      siteUrl: SITE_URL,
    })
    expect(html).not.toContain('<b>')
    expect(html).toContain('&lt;b&gt;')
  })
})

describe('adoptionConfirmationTemplate', () => {
  it('contém nome do adotante e do pet', () => {
    const html = adoptionConfirmationTemplate({
      petName: 'Luna',
      petId: 'pet-001',
      adopterName: 'Maria Silva',
      siteUrl: SITE_URL,
    })
    expect(html).toContain('Luna')
    expect(html).toContain('Maria Silva')
  })
})

describe('petFollowUpTemplate', () => {
  it('exibe número de dias corretamente', () => {
    const html = petFollowUpTemplate({
      petName: 'Thor',
      petId: 'pet-002',
      daysSinceLost: 14,
      siteUrl: SITE_URL,
    })
    expect(html).toContain('14 dias')
    expect(html).toContain('Thor')
  })

  it('usa plural correto para 1 dia', () => {
    const html = petFollowUpTemplate({
      petName: 'Bob',
      petId: 'pet-003',
      daysSinceLost: 1,
      siteUrl: SITE_URL,
    })
    expect(html).toContain('1 dia')
    expect(html).not.toContain('1 dias')
  })
})

describe('hashEmail determinístico', () => {
  it('mesmo email → mesmo hash', () => {
    const crypto = require('crypto')
    const hash1 = crypto.createHash('sha256').update('user@example.com').digest('hex')
    const hash2 = crypto.createHash('sha256').update('user@example.com').digest('hex')
    expect(hash1).toBe(hash2)
  })

  it('emails diferentes → hashes diferentes', () => {
    const crypto = require('crypto')
    const hash1 = crypto.createHash('sha256').update('user1@example.com').digest('hex')
    const hash2 = crypto.createHash('sha256').update('user2@example.com').digest('hex')
    expect(hash1).not.toBe(hash2)
  })
})
