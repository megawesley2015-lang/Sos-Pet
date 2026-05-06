/**
 * Smart Match System — cruzamento automático entre pets perdidos e encontrados.
 *
 * Quando um pet é cadastrado como "found", o sistema varre os pets "lost"
 * com critérios similares e notifica os tutores por email.
 *
 * Pontuação de compatibilidade (0–100):
 *   Espécie igual (obrigatório):  filtro
 *   Cidade igual/próxima:         30 pts
 *   Sexo igual (se ambos informados): 20 pts
 *   Cor similar:                  20 pts
 *   Porte igual:                  15 pts
 *   Raça igual:                   15 pts
 *
 * Limiar de notificação: ≥ 60 pts
 *
 * Expansão geográfica:
 *   Fase 1 — mesma cidade
 *   Fase 2 — Baixada Santista (se < 3 matches na Fase 1)
 *   Fase 3 — estado SP (se < 3 matches na Fase 2)
 */
import { createServiceClient } from "@/lib/supabase/server";
import { notificarAvistamento } from "@/lib/services/email";
import type { PetRow } from "@/lib/types/database";

// Cidades da Baixada Santista por proximidade ao Guarujá
const BAIXADA_SANTISTA = [
  "guarujá", "santos", "são vicente", "praia grande",
  "cubatão", "bertioga", "itanhaém", "mongaguá", "peruíbe",
];

const MATCH_THRESHOLD = 60;

// ─── Scoring ─────────────────────────────────────────────────────────────────

function normalizeColor(color: string): string[] {
  return color
    .toLowerCase()
    .replace(/[^a-záéíóúãõâêîôûàèìòùç\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function colorScore(found: string, lost: string): number {
  const f = new Set(normalizeColor(found));
  const l = normalizeColor(lost);
  const hits = l.filter((w) => f.has(w)).length;
  const total = Math.max(f.size, l.length, 1);
  return Math.round((hits / total) * 20);
}

function calcScore(found: PetRow, lost: PetRow): number {
  let score = 0;

  // Sexo (20 pts se ambos informados e iguais)
  if (
    found.sex && lost.sex &&
    found.sex !== "unknown" && lost.sex !== "unknown" &&
    found.sex === lost.sex
  ) {
    score += 20;
  }

  // Cor (até 20 pts por similaridade textual)
  score += colorScore(found.color, lost.color);

  // Porte (15 pts)
  if (found.size && lost.size && found.size === lost.size) {
    score += 15;
  }

  // Raça (15 pts — case-insensitive)
  if (
    found.breed && lost.breed &&
    found.breed.toLowerCase().trim() === lost.breed.toLowerCase().trim()
  ) {
    score += 15;
  }

  return score;
}

// ─── Busca e notificação ──────────────────────────────────────────────────────

export interface MatchResult {
  lostPetId: string;
  lostPetName: string | null;
  score: number;
  notified: boolean;
}

/**
 * Busca pets perdidos compatíveis com o pet encontrado recém-cadastrado.
 * Envia email ao tutor de cada match acima do limiar.
 * Retorna a lista de matches (para logging/auditoria).
 */
export async function findAndNotifyMatches(
  foundPet: PetRow
): Promise<MatchResult[]> {
  const service = createServiceClient();
  const results: MatchResult[] = [];

  // Fase 1 — mesma cidade
  // Fase 2 — Baixada Santista
  // Fase 3 — estado SP
  const cityNorm = foundPet.city.toLowerCase().trim();
  const inBaixada = BAIXADA_SANTISTA.includes(cityNorm);

  // Busca candidatos (mesma espécie, status ativo, kind=lost)
  const { data: candidatesRaw } = await service
    .from("pets")
    .select("*")
    .eq("kind", "lost")
    .eq("status", "active")
    .eq("species", foundPet.species)
    .neq("id", foundPet.id)
    .limit(200);

  const candidates = (candidatesRaw ?? []) as PetRow[];

  // Separa por fase geográfica
  const phase1 = candidates.filter(
    (p) => p.city.toLowerCase().trim() === cityNorm
  );
  const phase2 = inBaixada
    ? candidates.filter((p) =>
        BAIXADA_SANTISTA.includes(p.city.toLowerCase().trim()) &&
        p.city.toLowerCase().trim() !== cityNorm
      )
    : [];
  const phase3 = candidates.filter(
    (p) =>
      !BAIXADA_SANTISTA.includes(p.city.toLowerCase().trim()) &&
      (p.state?.toUpperCase() === "SP" || foundPet.state?.toUpperCase() === "SP")
  );

  // Prioriza fase 1; se < 3 matches, inclui fase 2; se ainda < 3, inclui fase 3
  let pool = phase1;
  if (pool.length < 3) pool = [...pool, ...phase2];
  if (pool.length < 3) pool = [...pool, ...phase3];

  // Avalia cada candidato
  for (const lost of pool) {
    const geoBonus = phase1.includes(lost) ? 30 : phase2.includes(lost) ? 15 : 5;
    const attrScore = calcScore(foundPet, lost);
    const total = Math.min(geoBonus + attrScore, 100);

    if (total < MATCH_THRESHOLD) continue;

    const result: MatchResult = {
      lostPetId: lost.id,
      lostPetName: lost.name,
      score: total,
      notified: false,
    };

    // Tenta notificar o tutor do pet perdido
    if (lost.owner_id) {
      try {
        const { data: authUser } = await service.auth.admin.getUserById(
          lost.owner_id
        );
        const email = authUser?.user?.email;

        if (email) {
          await notificarMatchEncontrado({
            tutorEmail: email,
            lostPetName: lost.name,
            lostPetId: lost.id,
            foundPetId: foundPet.id,
            foundCity: foundPet.city,
            score: total,
          });
          result.notified = true;
        }
      } catch {
        // best-effort — não bloqueia o cadastro
      }
    }

    results.push(result);

    // Máximo 5 notificações por evento (anti-spam)
    if (results.length >= 5) break;
  }

  return results;
}

// ─── Email de match ───────────────────────────────────────────────────────────

async function notificarMatchEncontrado(opts: {
  tutorEmail: string;
  lostPetName: string | null;
  lostPetId: string;
  foundPetId: string;
  foundCity: string;
  score: number;
}) {
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://sospet.com.br";

  const { sendEmail } = await import("@/lib/services/email");
  const pet = opts.lostPetName ?? "seu pet";
  const pct = opts.score;

  await sendEmail({
    to: opts.tutorEmail,
    subject: `🎯 Encontramos um pet parecido com ${pet}! — SOS Pet`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><style>
* { box-sizing:border-box; margin:0; padding:0; }
body { background:#0f1117; font-family:system-ui,sans-serif; color:#e5e7eb; }
.wrap { max-width:560px; margin:0 auto; padding:24px 16px; }
.card { background:#1a1d27; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,.08); }
.header { background:#f97316; padding:28px 32px; text-align:center; }
.header h1 { font-size:22px; font-weight:800; color:white; }
.body { padding:32px; }
.score { display:inline-block; background:rgba(249,115,22,.2); border:1px solid rgba(249,115,22,.4); color:#fb923c; border-radius:8px; padding:6px 14px; font-size:13px; font-weight:700; margin:12px 0; }
.btn { display:inline-block; background:#f97316; color:white; padding:12px 28px; text-decoration:none; border-radius:10px; font-weight:700; font-size:14px; margin-top:20px; }
p { font-size:14px; line-height:1.7; color:#9ca3af; margin-bottom:12px; }
strong { color:#f9fafb; }
.footer { text-align:center; padding:20px 32px; font-size:12px; color:#6b7280; }
</style></head>
<body>
<div class="wrap"><div class="card">
  <div class="header"><h1>🎯 Possível match encontrado!</h1></div>
  <div class="body">
    <p>Olá! Temos uma boa notícia sobre <strong>${pet}</strong>.</p>
    <p>Alguém acabou de cadastrar um pet <strong>encontrado em ${opts.foundCity}</strong> com características similares às de <strong>${pet}</strong>.</p>
    <div class="score">Compatibilidade: ${pct}%</div>
    <p>Pode não ser ele(a), mas vale conferir! Acesse o perfil do pet encontrado e compare as fotos e informações.</p>
    <a href="${APP_URL}/pets/${opts.foundPetId}" class="btn">Ver pet encontrado →</a>
    <p style="margin-top:20px; font-size:12px;">
      Você também pode acessar o perfil do seu pet:
      <a href="${APP_URL}/pets/${opts.lostPetId}" style="color:#f97316;">${APP_URL}/pets/${opts.lostPetId}</a>
    </p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} SOS Pet — Baixada Santista</div>
</div></div>
</body></html>`,
    text: `Encontramos um pet com ${pct}% de compatibilidade com ${pet} em ${opts.foundCity}. Veja: ${APP_URL}/pets/${opts.foundPetId}`,
  });
}
