/**
 * Testes — lib/services/matching.ts (calculateMatchScore)
 *
 * Módulo: Notificação de match por e-mail
 * Cobre: algoritmo de pontuação de compatibilidade entre pets
 *
 * Cenários:
 *   ✓ Match perfeito (mesma espécie + cor + porte + sexo + cidade) = 100 pts
 *   ✓ Espécie diferente → score baixo (sem bônus de espécie)
 *   ✓ Cor fuzzy (substring parcial) é reconhecida
 *   ✓ Sexo "unknown" não gera bônus
 *   ✓ Geo: mesma cidade (+20), Baixada Santista (+12), mesmo estado (+5), nada (0)
 *   ✓ Score nunca ultrapassa 100
 */

import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "@/lib/services/matching";
import type { PetRow } from "@/lib/types/database";

// ── Helper ────────────────────────────────────────────────────

function makePet(overrides: Partial<PetRow> = {}): PetRow {
  return {
    id: "pet-1",
    kind: "lost",
    status: "active",
    species: "dog",
    color: "caramelo",
    size: "medium",
    sex: "male",
    city: "Santos",
    state: "SP",
    neighborhood: "Gonzaga",
    event_date: "2026-05-01",
    contact_name: "Tutor",
    contact_phone: "13999999999",
    contact_whatsapp: true,
    created_at: "2026-05-01T00:00:00Z",
    // campos opcionais
    name: null,
    breed: null,
    age_approx: null,
    description: null,
    behavior: null,
    photo_url: null,
    owner_id: null,
    latitude: null,
    longitude: null,
    ...overrides,
  } as PetRow;
}

// ── Testes de score ───────────────────────────────────────────

describe("calculateMatchScore — algoritmo de compatibilidade", () => {

  it("match perfeito: espécie + cor + porte + sexo + mesma cidade = 100 pts", () => {
    const found = makePet({ kind: "found", city: "Santos" });
    const lost  = makePet({ kind: "lost",  city: "Santos" });
    const { score } = calculateMatchScore(found, lost);
    // 30 (espécie) + 25 (cor) + 15 (porte) + 10 (sexo) + 20 (cidade) = 100
    expect(score).toBe(100);
  });

  it("espécie diferente → sem bônus de espécie (não deve ultrapassar 70)", () => {
    const found = makePet({ kind: "found", species: "dog", city: "Santos" });
    const lost  = makePet({ kind: "lost",  species: "cat", city: "Santos" });
    const { score } = calculateMatchScore(found, lost);
    expect(score).toBeLessThan(40); // sem espécie, só cor+porte+sexo+cidade
  });

  it("cor fuzzy: 'caramelo escuro' bate com 'caramelo'", () => {
    const found = makePet({ kind: "found", color: "caramelo escuro" });
    const lost  = makePet({ kind: "lost",  color: "caramelo" });
    const { score, reasons } = calculateMatchScore(found, lost);
    expect(score).toBeGreaterThanOrEqual(25); // bônus de cor aplicado
    expect(reasons.some((r) => r.toLowerCase().includes("cor"))).toBe(true);
  });

  it("cores completamente diferentes → sem bônus de cor", () => {
    const found = makePet({ kind: "found", color: "preto" });
    const lost  = makePet({ kind: "lost",  color: "branco" });
    const { score } = calculateMatchScore(found, lost);
    // sem bônus de cor — score = espécie+porte+sexo+geo
    expect(score).toBeLessThanOrEqual(75);
  });

  it("sexo 'unknown' em qualquer lado → sem bônus de sexo", () => {
    const found = makePet({ kind: "found", sex: "unknown" });
    const lost  = makePet({ kind: "lost",  sex: "male" });
    const { score } = calculateMatchScore(found, lost);
    // sem os 10 pts de sexo
    expect(score).toBeLessThanOrEqual(90);
  });

  it("geo: Baixada Santista (+12) — Santos x Guarujá", () => {
    const found = makePet({ kind: "found", city: "Santos",  state: "SP" });
    const lost  = makePet({ kind: "lost",  city: "Guarujá", state: "SP" });
    const { score, geoPhase } = calculateMatchScore(found, lost);
    expect(geoPhase).toBe("baixada");
    expect(score).toBeGreaterThanOrEqual(12); // pelo menos o bônus geo
  });

  it("geo: mesmo estado (+5) — Santos x São Paulo", () => {
    const found = makePet({ kind: "found", city: "Santos",    state: "SP" });
    const lost  = makePet({ kind: "lost",  city: "São Paulo", state: "SP" });
    const { score, geoPhase } = calculateMatchScore(found, lost);
    expect(geoPhase).toBe("state");
    expect(score).toBeGreaterThanOrEqual(5);
  });

  it("geo: cidades/estados diferentes → sem bônus geográfico", () => {
    const found = makePet({ kind: "found", city: "Santos",    state: "SP" });
    const lost  = makePet({ kind: "lost",  city: "Curitiba",  state: "PR" });
    const { geoPhase } = calculateMatchScore(found, lost);
    expect(geoPhase).toBe("none");
  });

  it("score nunca ultrapassa 100", () => {
    const found = makePet({ kind: "found" });
    const lost  = makePet({ kind: "lost" });
    const { score } = calculateMatchScore(found, lost);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("score é 0 quando nada bate (espécie diferente + cores opostas + sem geo)", () => {
    const found = makePet({ kind: "found", species: "dog", color: "preto", size: "large", sex: "male", city: "Santos", state: "SP" });
    const lost  = makePet({ kind: "lost",  species: "cat", color: "branco", size: "small", sex: "female", city: "Curitiba", state: "PR" });
    const { score } = calculateMatchScore(found, lost);
    expect(score).toBe(0);
  });

  it("reasons inclui a espécie quando bate", () => {
    const found = makePet({ kind: "found", species: "dog" });
    const lost  = makePet({ kind: "lost",  species: "dog" });
    const { reasons } = calculateMatchScore(found, lost);
    expect(reasons).toContain("Cão");
  });
});
