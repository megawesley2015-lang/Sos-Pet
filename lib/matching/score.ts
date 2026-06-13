export interface PetForMatching {
  id: string
  species: string
  city: string | null
  color: string | null
  breed: string | null
  latitude?: number | null
  longitude?: number | null
  created_at: string
}

export function haversineDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function similarityScore(a: string | null, b: string | null): number {
  if (!a || !b) return 0
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  const dist = levenshtein(na, nb)
  return 1 - dist / maxLen
}

const MIN_CONFIDENCE = 0.55

export function calculateMatchScore(
  lost: PetForMatching,
  found: PetForMatching
): number {
  if (lost.species !== found.species) return 0

  let score = 0

  score += 40

  if (
    lost.city &&
    found.city &&
    normalize(lost.city) === normalize(found.city)
  ) {
    score += 30
  }

  const colorSim = similarityScore(lost.color, found.color)
  if (colorSim > 0.6) score += 15

  const breedSim = similarityScore(lost.breed, found.breed)
  if (breedSim > 0.6) score += 10

  if (
    lost.latitude != null && lost.longitude != null &&
    found.latitude != null && found.longitude != null
  ) {
    const dist = haversineDistanceKm(lost.latitude, lost.longitude, found.latitude, found.longitude)
    if (dist < 5) score += 5
  }

  const confidence = Math.min(score / 100, 1.0)
  return confidence < MIN_CONFIDENCE ? 0 : confidence
}
