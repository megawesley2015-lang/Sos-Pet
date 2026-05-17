/**
 * Matching Inteligente — encontra pets "perdidos" compatíveis quando um pet
 * "encontrado" é cadastrado.
 *
 * ────────────────────────────────────────────────────
 * REGRAS DE NEGÓCIO (spec 2026-05-06)
 * ────────────────────────────────────────────────────
 * 1. Trigger: APENAS quando kind === "found" é cadastrado.
 *    (O encontrante achou o pet → notifica tutores que perderam pets similares)
 *
 * 2. Limiar de notificação: 60% — abaixo disso nenhum e-mail é enviado.
 *
 * 3. Expansão geográfica em 3 fases (busca + pontuação):
 *    Fase 1 — Mesma cidade        → bônus +20 pts
 *    Fase 2 — Baixada Santista    → bônus +12 pts (se ambas as cidades
 *             estiverem nos 9 municípios do array)
 *    Fase 3 — Mesmo estado (SP)   → bônus  +5 pts
 *    Fora do escopo               →         0 pts
 *
 * 4. Score máximo teórico: 100 pts (espécie+cor+porte+sexo+cidade)
 *
 * 5. E-mail disparado ao tutor do pet perdido com:
 *    - Percentual de compatibilidade
 *    - Razões do match
 *    - Link direto para o pet encontrado
 *
 * NOTA: Apenas pets com owner_id (usuário autenticado) recebem e-mail.
 * Pets cadastrados anonimamente não têm tutor para notificar.
 * ────────────────────────────────────────────────────
 */

import { createServiceClient } from "@/lib/supabase/server";
import { notificarMatchPet } from "./email";
import type { PetRow } from "@/lib/types/database";

// ── Constantes ────────────────────────────────────────────────────────────────

/** Municípios da Baixada Santista — SP */
const BAIXADA_SANTISTA = [
  "Guarujá",
  "Santos",
  "São Vicente",
  "Praia Grande",
  "Cubatão",
  "Bertioga",
  "Itanhaém",
  "Mongaguá",
  "Peruíbe",
] as const;

const BAIXADA_SET = new Set(BAIXADA_SANTISTA.map((c) => c.toLowerCase()));

/** Abaixo deste limiar, nenhuma notificação é disparada. */
const MATCH_THRESHOLD = 60;

/** Top N matches a processar por execução. */
const MAX_MATCHES = 5;

// ── Tipos ─────────────────────────────────────────────────────────────────────

type GeoPhase = "city" | "baixada" | "state" | "none";

interface PetMatch {
  id: string;
  matchScore: number;   // 0–100
  matchReasons: string[];
  geoPhase: GeoPhase;
  matchPet: PetRow;
}

// ── Helpers geográficos ───────────────────────────────────────────────────────

/**
 * Determina a fase geográfica entre dois pets.
 * Fase 1 → cidade igual
 * Fase 2 → ambas as cidades estão na Baixada Santista
 * Fase 3 → mesmo estado
 */
function getGeoPhase(a: PetRow, b: PetRow): GeoPhase {
  const cityA = a.city.trim().toLowerCase();
  const cityB = b.city.trim().toLowerCase();

  if (cityA === cityB) return "city";

  if (BAIXADA_SET.has(cityA) && BAIXADA_SET.has(cityB)) return "baixada";

  if (a.state && b.state && a.state.trim().toLowerCase() === b.state.trim().toLowerCase()) {
    return "state";
  }

  return "none";
}

const GEO_BONUS: Record<GeoPhase, number> = {
  city:    20,
  baixada: 12,
  state:    5,
  none:     0,
};

const GEO_LABEL: Record<GeoPhase, string> = {
  city:    (c: string) => `Mesma cidade (${c})`,
  baixada: "Região da Baixada Santista",
  state:   (s: string) => `Mesmo estado (${s})`,
  none:    "",
} as unknown as Record<GeoPhase, string>;

function geoReason(phase: GeoPhase, pet: PetRow): string {
  if (phase === "city")    return `Mesma cidade (${pet.city})`;
  if (phase === "baixada") return "Região da Baixada Santista";
  if (phase === "state")   return `Mesmo estado (${pet.state ?? "SP"})`;
  return "";
}

// ── Score ─────────────────────────────────────────────────────────────────────

/**
 * Calcula score de compatibilidade (0–100) entre o pet encontrado
 * e um candidato "perdido".
 *
 * Critérios:
 *   Espécie igual           +30
 *   Cor similar (fuzzy)     +25
 *   Porte igual             +15
 *   Sexo igual              +10
 *   Geo (3 fases)           +5 / +12 / +20
 */
function calculateMatchScore(
  found: PetRow,
  lost: PetRow
): { score: number; reasons: string[]; geoPhase: GeoPhase } {
  let score = 0;
  const reasons: string[] = [];

  // Espécie (obrigatório para qualquer match relevante)
  if (found.species === lost.species) {
    score += 30;
    const label = found.species === "dog" ? "Cão" : found.species === "cat" ? "Gato" : "Mesma espécie";
    reasons.push(label);
  }

  // Cor (fuzzy — substring bidirecional, case-insensitive)
  const colorA = found.color?.toLowerCase() ?? "";
  const colorB = lost.color?.toLowerCase() ?? "";
  if (colorA && colorB && (colorA.includes(colorB) || colorB.includes(colorA))) {
    score += 25;
    reasons.push(`Cor similar (${found.color})`);
  }

  // Porte
  if (found.size && lost.size && found.size === lost.size) {
    score += 15;
    const sizeMap = { small: "Pequeno", medium: "Médio", large: "Grande" };
    reasons.push(`Porte ${sizeMap[found.size] ?? found.size}`);
  }

  // Sexo (ignora "unknown" em ambos os lados)
  if (
    found.sex && lost.sex &&
    found.sex !== "unknown" && lost.sex !== "unknown" &&
    found.sex === lost.sex
  ) {
    score += 10;
    reasons.push(found.sex === "male" ? "Macho" : "Fêmea");
  }

  // Geográfico (3 fases)
  const phase = getGeoPhase(found, lost);
  const geoBonus = GEO_BONUS[phase];
  if (geoBonus > 0) {
    score += geoBonus;
    reasons.push(geoReason(phase, found));
  }

  return { score: Math.min(score, 100), reasons, geoPhase: phase };
}

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Busca pets "perdidos" ativos que estejam dentro do escopo geográfico
 * do pet encontrado (cidade + Baixada Santista + estado).
 * Uma única query — filtragem de score é feita em memória.
 */
async function findCandidates(found: PetRow): Promise<PetRow[]> {
  const supabase = createServiceClient();

  // Constrói filtro OR para as 3 fases geográficas
  const cityFilter = `city.ilike.${found.city}`;

  // Fase 2: se a cidade do pet encontrado está na Baixada, inclui todas
  const baixadaFilters = BAIXADA_SET.has(found.city.trim().toLowerCase())
    ? BAIXADA_SANTISTA.map((c) => `city.ilike.${c}`)
    : [];

  // Fase 3: mesmo estado
  const stateFilter = found.state ? `state.eq.${found.state}` : null;

  const orParts = [cityFilter, ...baixadaFilters];
  if (stateFilter) orParts.push(stateFilter);

  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("kind", "lost")      // só perdidos
    .eq("status", "active")
    .neq("id", found.id)
    .or(orParts.join(","));

  if (error) {
    console.error("[Matching] Erro ao buscar candidatos:", error.message);
    return [];
  }

  return (data ?? []) as PetRow[];
}

// ── Match pipeline ────────────────────────────────────────────────────────────

/**
 * Executa o pipeline completo de matching para o pet encontrado.
 * Retorna matches com score >= MATCH_THRESHOLD, ordenados por score desc.
 */
async function findMatches(found: PetRow): Promise<PetMatch[]> {
  const candidates = await findCandidates(found);

  if (candidates.length === 0) return [];

  return candidates
    .map((lost) => {
      const { score, reasons, geoPhase } = calculateMatchScore(found, lost);
      return {
        id: lost.id,
        matchScore: score,
        matchReasons: reasons,
        geoPhase,
        matchPet: lost,
      };
    })
    .filter((m) => m.matchScore >= MATCH_THRESHOLD)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, MAX_MATCHES);
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Ponto de entrada público.
 * Deve ser chamado APENAS quando kind === "found" é cadastrado.
 *
 * Fluxo:
 *  1. Carrega o pet encontrado
 *  2. Executa pipeline de matches
 *  3. Filtra matches com score >= 60% que tenham tutor autenticado
 *  4. Resolve emails dos tutores em paralelo
 *  5. Dispara e-mails em paralelo (best-effort — não bloqueia cadastro)
 */
export async function triggerPetMatching(newPetId: string): Promise<void> {
  try {
    const supabase = createServiceClient();

    const { data: petData, error: petError } = await supabase
      .from("pets")
      .select("*")
      .eq("id", newPetId)
      .single();

    if (petError || !petData) {
      console.error("[Matching] Pet não encontrado:", newPetId);
      return;
    }

    const found = petData as PetRow;

    // Guarda: só processar pets "encontrados"
    if (found.kind !== "found") {
      console.log(`[Matching] Ignorado — kind='${found.kind}' (trigger só em 'found')`);
      return;
    }

    const matches = await findMatches(found);

    if (matches.length === 0) {
      console.log(`[Matching] Nenhum match ≥${MATCH_THRESHOLD}% para ${newPetId}`);
      return;
    }

    console.log(
      `[Matching] ${matches.length} match(es) para ${newPetId}: ` +
        matches.map((m) => `${m.id}(${m.matchScore}%/${m.geoPhase})`).join(", ")
    );

    // Apenas matches com tutor autenticado recebem e-mail
    const notifiable = matches.filter((m) => !!m.matchPet.owner_id);

    if (notifiable.length === 0) {
      console.log("[Matching] Matches encontrados, mas tutores sem owner_id — sem e-mail.");
      return;
    }

    // Resolve e-mails de todos os tutores em paralelo (1 round-trip por owner)
    const ownerIds = notifiable.map((m) => m.matchPet.owner_id as string);
    const emailResults = await Promise.all(
      ownerIds.map((id) =>
        supabase.auth.admin
          .getUserById(id)
          .then((r) => ({ id, email: r.data.user?.email ?? null }))
          .catch(() => ({ id, email: null }))
      )
    );
    const emailById = new Map(emailResults.map((r) => [r.id, r.email]));

    // Dispara e-mails em paralelo — best-effort (erro em um não cancela os outros)
    await Promise.allSettled(
      notifiable.map(async (match) => {
        const ownerId = match.matchPet.owner_id as string;
        const email = emailById.get(ownerId);

        if (!email) {
          console.warn(`[Matching] E-mail não encontrado para owner ${ownerId}`);
          return;
        }

        await notificarMatchPet({
          recipientEmail: email,
          matchScore: match.matchScore,
          newPetKind: found.kind,
          newPetName: found.name ?? "um pet",
          newPetCity: found.city,
          matchReasons: match.matchReasons,
          newPetUrl: `/pets/${newPetId}`,
          matchPetUrl: `/pets/${match.id}`,
        });

        console.log(
          `[Matching] ✉️  ${email} — ${match.matchScore}% (${match.geoPhase}) pet=${match.id}`
        );
      })
    );
  } catch (err) {
    // Matching é best-effort — erro não deve quebrar o cadastro do pet
    console.error("[Matching] Erro inesperado:", err);
  }
}
