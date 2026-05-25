#!/usr/bin/env node
/**
 * Seed — pets de teste com geolocalização
 *
 * Popula a tabela `pets` com dados fictícios para testar o mapa
 * e o carrossel da homepage.
 *
 * Uso:
 *   node scripts/seed-pets.mjs
 *   node scripts/seed-pets.mjs --clear   # apaga seeds anteriores antes de inserir
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ── 1. Carrega variáveis de ambiente de .env.local ───────────

function loadEnv() {
  const envPath = ".env.local";
  if (!existsSync(envPath)) {
    console.error("✗ .env.local não encontrado. Crie o arquivo com as chaves do Supabase.");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente em .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── 2. Dados de seed ─────────────────────────────────────────
//
// Coordenadas cobrindo São Paulo, Santos, Guarujá e ABC Paulista
// para testar a distribuição de pins no mapa.

const SEED_TAG = "[seed]"; // marca seeds para facilitar limpeza

const PETS = [
  // ── Perdidos ─────────────────────────────────────────────
  {
    kind: "lost",
    species: "dog",
    name: `${SEED_TAG} Rex`,
    color: "Caramelo",
    breed: "Vira-lata",
    size: "medium",
    sex: "male",
    neighborhood: "Gonzaga",
    city: "Santos",
    state: "SP",
    event_date: daysAgo(2),
    contact_name: "Maria Silva",
    contact_phone: "13999000001",
    contact_whatsapp: true,
    description: "Colarinho azul. Muito dócil. Desapareceu perto do canal.",
    latitude: -23.9435,
    longitude: -46.3322,
  },
  {
    kind: "lost",
    species: "cat",
    name: `${SEED_TAG} Mel`,
    color: "Laranja",
    breed: "Sem raça definida",
    size: "small",
    sex: "female",
    neighborhood: "Boqueirão",
    city: "Santos",
    state: "SP",
    event_date: daysAgo(1),
    contact_name: "João Pereira",
    contact_phone: "13988000002",
    contact_whatsapp: true,
    description: "Gata laranja com listras. Usa coleira rosa.",
    latitude: -23.9522,
    longitude: -46.3450,
  },
  {
    kind: "lost",
    species: "dog",
    name: `${SEED_TAG} Thor`,
    color: "Preto e branco",
    breed: "Border Collie",
    size: "large",
    sex: "male",
    neighborhood: "Vila Belmiro",
    city: "Santos",
    state: "SP",
    event_date: daysAgo(3),
    contact_name: "Ana Costa",
    contact_phone: "13977000003",
    contact_whatsapp: false,
    description: "Border Collie preto e branco. Muito ativo.",
    latitude: -23.9310,
    longitude: -46.3270,
  },
  {
    kind: "lost",
    species: "dog",
    name: `${SEED_TAG} Luna`,
    color: "Dourado",
    breed: "Golden Retriever",
    size: "large",
    sex: "female",
    neighborhood: "Jardim Paulista",
    city: "São Paulo",
    state: "SP",
    event_date: daysAgo(1),
    contact_name: "Carlos Mendes",
    contact_phone: "11999000004",
    contact_whatsapp: true,
    description: "Golden dócil, usa tag com nome. Desapareceu no parque.",
    latitude: -23.5641,
    longitude: -46.6537,
  },
  {
    kind: "lost",
    species: "cat",
    name: `${SEED_TAG} Simba`,
    color: "Malhado",
    breed: "Persa",
    size: "medium",
    sex: "male",
    neighborhood: "Pinheiros",
    city: "São Paulo",
    state: "SP",
    event_date: daysAgo(4),
    contact_name: "Fernanda Lima",
    contact_phone: "11988000005",
    contact_whatsapp: true,
    description: "Gato persa malhado, pelo longo. Fugiu pela janela.",
    latitude: -23.5635,
    longitude: -46.6892,
  },
  {
    kind: "lost",
    species: "dog",
    name: `${SEED_TAG} Bolt`,
    color: "Branco",
    breed: "Poodle",
    size: "small",
    sex: "male",
    neighborhood: "Enseada",
    city: "Guarujá",
    state: "SP",
    event_date: daysAgo(0),
    contact_name: "Roberto Santos",
    contact_phone: "13966000006",
    contact_whatsapp: true,
    description: "Poodle branco, muito calmo. Coleira verde.",
    latitude: -23.9978,
    longitude: -46.2577,
  },
  {
    kind: "lost",
    species: "dog",
    name: `${SEED_TAG} Buddy`,
    color: "Marrom",
    breed: "Labrador",
    size: "large",
    sex: "male",
    neighborhood: "Centro",
    city: "Santo André",
    state: "SP",
    event_date: daysAgo(5),
    contact_name: "Patrícia Alves",
    contact_phone: "11955000007",
    contact_whatsapp: false,
    description: "Labrador marrom. Chip implantado. Responde por Buddy.",
    latitude: -23.6639,
    longitude: -46.5339,
  },

  // ── Encontrados ───────────────────────────────────────────
  {
    kind: "found",
    species: "dog",
    name: null,
    color: "Preto",
    breed: "Desconhecida",
    size: "medium",
    sex: null,
    neighborhood: "José Menino",
    city: "Santos",
    state: "SP",
    event_date: daysAgo(1),
    contact_name: "Lucas Oliveira",
    contact_phone: "13944000008",
    contact_whatsapp: true,
    description: "Cachorro preto encontrado próximo ao aquário. Está bem cuidado.",
    latitude: -23.9648,
    longitude: -46.3283,
  },
  {
    kind: "found",
    species: "cat",
    name: null,
    color: "Cinza",
    breed: "Desconhecida",
    size: "small",
    sex: "female",
    neighborhood: "Embaré",
    city: "Santos",
    state: "SP",
    event_date: daysAgo(2),
    contact_name: "Juliana Rocha",
    contact_phone: "13933000009",
    contact_whatsapp: true,
    description: "Gatinha cinza, muito mansa. Parece ser doméstica.",
    latitude: -23.9680,
    longitude: -46.3350,
  },
  {
    kind: "found",
    species: "dog",
    name: null,
    color: "Bege",
    breed: "Shih Tzu",
    size: "small",
    sex: "female",
    neighborhood: "Brooklin",
    city: "São Paulo",
    state: "SP",
    event_date: daysAgo(0),
    contact_name: "Marcelo Teixeira",
    contact_phone: "11922000010",
    contact_whatsapp: true,
    description: "Shih Tzu com laço no pelo. Encontrada na rua.",
    latitude: -23.6177,
    longitude: -46.6887,
  },
  {
    kind: "found",
    species: "other",
    name: null,
    color: "Verde e amarelo",
    breed: "Periquito",
    size: "small",
    sex: null,
    neighborhood: "Praia Grande",
    city: "Praia Grande",
    state: "SP",
    event_date: daysAgo(1),
    contact_name: "Beatriz Ferreira",
    contact_phone: "13911000011",
    contact_whatsapp: true,
    description: "Periquito encontrado pousado no quintal. Parece manso.",
    latitude: -24.0059,
    longitude: -46.4127,
  },
  {
    kind: "found",
    species: "dog",
    name: null,
    color: "Caramelo e branco",
    breed: "Beagle",
    size: "medium",
    sex: "male",
    neighborhood: "Mauá",
    city: "Guarujá",
    state: "SP",
    event_date: daysAgo(3),
    contact_name: "Diego Nunes",
    contact_phone: "13900000012",
    contact_whatsapp: false,
    description: "Beagle com coleira vermelha. Sem plaquinha.",
    latitude: -23.9742,
    longitude: -46.2486,
  },
];

// ── 3. Utilitários ───────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function ok(msg)   { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
function fail(msg) { console.log(`  \x1b[31m✗\x1b[0m ${msg}`); }
function info(msg) { console.log(`  \x1b[36m•\x1b[0m ${msg}`); }

// ── 4. Main ──────────────────────────────────────────────────

async function main() {
  const clear = process.argv.includes("--clear");

  console.log("\n\x1b[36m▶ SOS Pet — Seed de pets de teste\x1b[0m\n");

  if (clear) {
    info(`Removendo seeds anteriores (description LIKE '%${SEED_TAG}%' OR name LIKE '%${SEED_TAG}%')…`);
    const { error: delError } = await supabase
      .from("pets")
      .delete()
      .or(`name.ilike.%${SEED_TAG}%,description.ilike.%${SEED_TAG}%`);

    if (delError) {
      fail(`Erro ao limpar seeds: ${delError.message}`);
    } else {
      ok("Seeds anteriores removidos.");
    }
    console.log();
  }

  let inserted = 0;
  let failed   = 0;

  for (const pet of PETS) {
    const label = pet.name ?? `${pet.kind}/${pet.species}`;
    const { error } = await supabase.from("pets").insert({
      ...pet,
      status: "active",
    });

    if (error) {
      fail(`${label}: ${error.message}`);
      failed++;
    } else {
      ok(`${label} (${pet.city} — ${pet.latitude}, ${pet.longitude})`);
      inserted++;
    }
  }

  console.log(`\n  Inseridos: \x1b[32m${inserted}\x1b[0m   Falhas: \x1b[${failed > 0 ? "31" : "2"}m${failed}\x1b[0m`);

  if (inserted > 0) {
    console.log("\n  \x1b[33m→ Abra a homepage no desktop para ver os pins no mapa e testar o carrossel.\x1b[0m");
  }

  console.log();
}

main().catch((err) => {
  console.error("\n✗ Erro inesperado:", err);
  process.exit(1);
});
