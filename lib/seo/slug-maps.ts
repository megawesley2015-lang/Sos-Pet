export const CITIES_SLUG_MAP: Record<string, string> = {
  'santos': 'Santos',
  'guaruja': 'Guarujá',
  'sao-vicente': 'São Vicente',
  'cubatao': 'Cubatão',
  'bertioga': 'Bertioga',
  'praia-grande': 'Praia Grande',
  'mongagua': 'Mongaguá',
  'itanhaem': 'Itanhaém',
  'peruibe': 'Peruíbe',
}

export const TYPE_FILTER_MAP: Record<string, { species?: string; kind: string }> = {
  'cachorro-perdido': { species: 'dog', kind: 'lost' },
  'gato-perdido': { species: 'cat', kind: 'lost' },
  'cachorro-encontrado': { species: 'dog', kind: 'found' },
  'gato-encontrado': { species: 'cat', kind: 'found' },
  'pet-perdido': { species: undefined, kind: 'lost' },
  'pet-encontrado': { species: undefined, kind: 'found' },
}

const TYPE_LABELS: Record<string, string> = {
  'cachorro-perdido': 'Cachorros perdidos',
  'gato-perdido': 'Gatos perdidos',
  'cachorro-encontrado': 'Cachorros encontrados',
  'gato-encontrado': 'Gatos encontrados',
  'pet-perdido': 'Pets perdidos',
  'pet-encontrado': 'Pets encontrados',
}

export function parseSlug(
  type: string,
  city: string
): { species?: string; kind: string; cityName: string } | null {
  const cityName = CITIES_SLUG_MAP[city.toLowerCase()]
  const filter = TYPE_FILTER_MAP[type.toLowerCase()]
  if (!cityName || !filter) return null
  return { ...filter, cityName }
}

export function generateSeoTitle(type: string, cityName: string): string {
  const label = TYPE_LABELS[type.toLowerCase()] ?? 'Pets'
  return `${label} em ${cityName} — SOS Pet Amigo`
}

export function generateSeoDescription(type: string, cityName: string): string {
  const label = TYPE_LABELS[type.toLowerCase()]?.toLowerCase() ?? 'pets'
  return `Veja todos os ${label} de ${cityName} na plataforma SOS Pet Amigo. Ajude a reunir pets com seus tutores.`
}

export function generateAllParams(): { type: string; city: string }[] {
  const types = Object.keys(TYPE_FILTER_MAP)
  const cities = Object.keys(CITIES_SLUG_MAP)
  return types.flatMap(type => cities.map(city => ({ type, city })))
}
