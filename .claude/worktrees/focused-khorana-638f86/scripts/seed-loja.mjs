#!/usr/bin/env node
/**
 * Seed inicial da Loja SOS Pet.
 *
 * Popula a tabela store_products com os produtos curados para a estratégia
 * de segurança + bem-estar descrita no documento de validação.
 *
 * Uso:
 *   node scripts/seed-loja.mjs
 *
 * Requer as variáveis no .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * ⚠️  URLs externas marcadas com (AFILIADO) precisam ser substituídas
 *     pelos seus links reais de afiliado (Petz, Shopee, etc.).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

// Lê .env.local — aceita DOTENV_PATH explícito, ou faz busca automática
function loadEnv() {
  // Busca o worktree principal (suporte a git worktrees)
  let mainWorktree = process.cwd();
  try {
    const list = execSync("git worktree list --porcelain", { encoding: "utf8" });
    const firstMatch = list.match(/^worktree (.+)/m);
    if (firstMatch) mainWorktree = firstMatch[1].trim();
  } catch { /* ignora */ }

  const candidates = [
    process.env.DOTENV_PATH,
    join(process.cwd(), ".env.local"),
    join(mainWorktree, ".env.local"),
  ].filter(Boolean);

  for (const path of candidates) {
    try {
      const raw = readFileSync(path, "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
      break;
    } catch { /* tenta o próximo */ }
  }
}

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  process.exit(1);
}

const supabase = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Produtos ────────────────────────────────────────────────────────────────
// Estratégia: foco em segurança + itens de alta recorrência mensal.
// checkout_type:
//   "internal" → checkout próprio (Mercado Pago, ex: plaquinha)
//   "external" → redireciona para o fornecedor (afiliado)

const PRODUTOS = [
  // ── DESTAQUES (featured: true) ───────────────────────────────────────────

  {
    name: "Plaquinha QR Code SOS Pet",
    description:
      "Plaquinha de alumínio personalizada com QR Code, nome e telefone gravados a laser. Qualquer pessoa que encontrar seu pet escaneie e vê seu contato na hora — sem precisar de app. Perfil digital ativo no SOS Pet incluso.",
    price_cents: 3990,
    original_price_cents: null,
    supplier_name: "SOS Pet",
    category: "plaquinha",
    checkout_type: "internal",
    external_url: null,
    featured: true,
    active: true,
    sort_order: 1,
  },
  {
    name: "Coleira Refletiva com Placa de Identificação",
    description:
      "Coleira com faixa 360° reflexiva para visibilidade total à noite. Material nylon reforçado, ajustável, com argola inox para plaquinha. Disponível nos tamanhos P, M, G e GG. Reduz riscos em passeios noturnos.",
    price_cents: 4590,
    original_price_cents: 6990,
    supplier_name: "Petz",
    category: "coleira",
    checkout_type: "external",
    external_url: "https://www.petz.com.br/cachorro/coleiras-guias-e-peitorais/coleiras",
    featured: true,
    active: true,
    sort_order: 2,
  },
  {
    name: "Peitoral Refletivo Safety Walk",
    description:
      "Peitoral com faixas refletivas e distribuição de força no peito (não no pescoço). Fácil de vestir, com dois pontos de fixação para maior controle. Ideal para cães agitados ou em treinamento.",
    price_cents: 6490,
    original_price_cents: 8990,
    supplier_name: "Petz",
    category: "acessorio",
    checkout_type: "external",
    external_url: "https://www.petz.com.br/cachorro/coleiras-guias-e-peitorais/peitorais",
    featured: true,
    active: true,
    sort_order: 3,
  },
  {
    name: "Rastreador GPS para Pets",
    description:
      "Localize seu pet em tempo real pelo celular. Resistente à água (IPX5), bateria de até 7 dias, funciona em todo o Brasil via rede 4G. Compatível com cães e gatos acima de 3 kg. Assinatura de dados inclusa por 1 mês.",
    price_cents: 12990,
    original_price_cents: 18990,
    supplier_name: "Shopee",
    category: "acessorio",
    checkout_type: "external",
    external_url: "https://shopee.com.br/search?keyword=rastreador+gps+pet",
    featured: true,
    active: true,
    sort_order: 4,
  },

  // ── SEGURANÇA ─────────────────────────────────────────────────────────────

  {
    name: "Coleira Antipuxão com Alça de Controle",
    description:
      "Coleira com alça integrada para maior controle em situações de risco. Dois pontos de fixação, fechamento rápido e material resistente a puxões fortes. Recomendada para cães de médio e grande porte.",
    price_cents: 5290,
    original_price_cents: null,
    supplier_name: "Petz",
    category: "coleira",
    checkout_type: "external",
    external_url: "https://www.petz.com.br/cachorro/coleiras-guias-e-peitorais/coleiras",
    featured: false,
    active: true,
    sort_order: 5,
  },
  {
    name: "Tag Metálica de Identificação Personalizada",
    description:
      "Plaquinha redonda de metal com gravação a laser — nome + telefone. Opção econômica e durável para colares e peitorais. Não enferruja, não desbota. Ótima para quem ainda não tem a plaquinha QR Code.",
    price_cents: 1890,
    original_price_cents: null,
    supplier_name: "Shopee",
    category: "plaquinha",
    checkout_type: "external",
    external_url: "https://shopee.com.br/search?keyword=tag+identificacao+pet+gravada",
    featured: false,
    active: true,
    sort_order: 6,
  },

  // ── HIGIENE (alta recorrência mensal) ─────────────────────────────────────

  {
    name: "Shampoo Hipoalergênico para Cães",
    description:
      "Shampoo sem fragrância, sem corantes e sem sulfatos para pets de pele sensível. pH neutro, indicado por veterinários, seguro para filhotes acima de 8 semanas. 500 ml.",
    price_cents: 3290,
    original_price_cents: null,
    supplier_name: "Petz",
    category: "higiene",
    checkout_type: "external",
    external_url: "https://www.petz.com.br/cachorro/banho-e-tosa/shampoos",
    featured: false,
    active: true,
    sort_order: 7,
  },
  {
    name: "Kit Primeiros Socorros Veterinário",
    description:
      "Kit completo para emergências: ataduras, esparadrapo, antisséptico, pinça, luvas descartáveis, termômetro e manual de primeiros socorros para pets. Todo tutor deveria ter em casa.",
    price_cents: 8990,
    original_price_cents: null,
    supplier_name: "Petz",
    category: "higiene",
    checkout_type: "external",
    external_url: "https://www.petz.com.br/cachorro/saude/primeiros-socorros",
    featured: false,
    active: true,
    sort_order: 8,
  },

  // ── ACESSÓRIOS ────────────────────────────────────────────────────────────

  {
    name: "Bebedouro Portátil para Passeios",
    description:
      "Garrafa com bebedouro retrátil embutido. Não deixe seu pet com sede durante caminhadas. Capacidade de 350 ml, sem BPA, encaixa em qualquer bolsa. Basta apertar para liberar a água.",
    price_cents: 2990,
    original_price_cents: null,
    supplier_name: "Shopee",
    category: "acessorio",
    checkout_type: "external",
    external_url: "https://shopee.com.br/search?keyword=bebedouro+portatil+cachorro",
    featured: false,
    active: true,
    sort_order: 9,
  },

  // ── ALIMENTAÇÃO (recorrência) ─────────────────────────────────────────────

  {
    name: "Petisco Natural Palito de Frango",
    description:
      "Petisco 100% natural de frango desidratado. Sem conservantes, corantes ou glúten. Rico em proteína, baixo em gordura. Ideal para recompensas no treinamento. Embalagem de 100 g.",
    price_cents: 2490,
    original_price_cents: null,
    supplier_name: "Petz",
    category: "alimentacao",
    checkout_type: "external",
    external_url: "https://www.petz.com.br/cachorro/petiscos-e-ossos/petiscos-naturais",
    featured: false,
    active: true,
    sort_order: 10,
  },
];

// ─── Execução ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🐾 SOS Pet — Seed da Loja\n");

  // Verifica se já existem produtos
  const { count } = await supabase
    .from("store_products")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    console.log(`⚠️  Já existem ${count} produto(s) na tabela store_products.`);
    console.log("   Para re-seeder, limpe a tabela primeiro:");
    console.log("   DELETE FROM store_products;\n");
    process.exit(0);
  }

  let ok = 0;
  let fail = 0;

  for (const produto of PRODUTOS) {
    const { error } = await supabase.from("store_products").insert(produto);
    if (error) {
      console.error(`  ✗ ${produto.name}: ${error.message}`);
      fail++;
    } else {
      console.log(`  ✓ ${produto.name}`);
      ok++;
    }
  }

  console.log(`\n${ok} produto(s) inserido(s), ${fail} erro(s).`);

  if (ok > 0) {
    console.log("\n✅ Loja populada com sucesso!");
    console.log("   Acesse /admin/loja para gerenciar os produtos.");
    console.log("   Acesse /loja para ver o resultado público.\n");
    console.log("⚠️  Lembre de atualizar os external_url com seus links de afiliado:");
    console.log("   Petz: https://programa-afiliados.petz.com.br");
    console.log("   Shopee: https://affiliate.shopee.com.br\n");
  }
}

seed().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
