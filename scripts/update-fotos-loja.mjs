#!/usr/bin/env node
/**
 * Atualiza as fotos dos produtos da loja SOS Pet.
 * Usa imagens do Unsplash (licença gratuita para uso comercial).
 *
 * Uso: node scripts/update-fotos-loja.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

// ── Carrega env ──────────────────────────────────────────────
function loadEnv() {
  let mainWorktree = process.cwd();
  try {
    const list = execSync("git worktree list --porcelain", { encoding: "utf8" });
    const m = list.match(/^worktree (.+)/m);
    if (m) mainWorktree = m[1].trim();
  } catch { /* ignora */ }

  for (const path of [join(process.cwd(), ".env.local"), join(mainWorktree, ".env.local")]) {
    try {
      for (const line of readFileSync(path, "utf8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const idx = t.indexOf("=");
        if (idx === -1) continue;
        const key = t.slice(0, idx).trim();
        const val = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
      break;
    } catch { /* tenta próximo */ }
  }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ── Mapeamento nome → URL da foto ────────────────────────────
// Fotos do Unsplash (uso livre) — substitua pelas fotos reais dos fornecedores
// quando tiver acesso. Via /admin/loja você edita individualmente.
const FOTOS = [
  {
    match: "Plaquinha QR Code SOS Pet",
    url: "https://images.unsplash.com/photo-1587300132061-2df72dfcc2d5?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cão usando plaquinha (coleira)",
  },
  {
    match: "Coleira Refletiva com Identificação",
    url: "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cachorro com coleira refletiva",
  },
  {
    match: "Peitoral Refletivo Safety Walk",
    url: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cão com peitoral",
  },
  {
    match: "Rastreador GPS para Pets",
    url: "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Dispositivo GPS / rastreador",
  },
  {
    match: "Coleira Antipuxão com Alça de Controle",
    url: "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cachorro com coleira / guia",
  },
  {
    match: "Tag Metálica de Identificação Personalizada",
    url: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Plaquinha / tag de pet",
  },
  {
    match: "Shampoo Hipoalergênico para Cães",
    url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Shampoo produto de beleza",
  },
  {
    match: "Kit Primeiros Socorros Veterinário",
    url: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Kit primeiros socorros",
  },
  {
    match: "Bebedouro Portátil para Passeios",
    url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cachorro bebendo água no passeio",
  },
  {
    match: "Petisco Natural Palito de Frango",
    url: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cachorro recebendo petisco",
  },
  {
    match: "Plaquinha de Silicone com QR Code",
    url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Gato com coleira e tag colorida",
  },
  {
    match: "Plaquinha Dupla Face Gravada a Laser",
    url: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Plaquinha metálica de pet",
  },
  {
    match: "Kit Identificação Completo",
    url: "https://images.unsplash.com/photo-1587300132061-2df72dfcc2d5?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cachorro com identificação",
  },
  {
    match: "Plaquinha Acrílico Personalizada",
    url: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cachorro e gato juntos (colorido)",
  },
  {
    match: "Medalha de Identificação Premium",
    url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Gato com medalha / tag",
  },
  {
    match: "Plaquinha + Camiseta Personalizada",
    url: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Cachorro com roupa / personalizado",
  },
  {
    match: "Produtos Personalizados Pet",
    url: "https://images.unsplash.com/photo-1581888227599-779811939961?w=600&h=600&fit=crop&auto=format&q=80",
    desc: "Pet com acessórios personalizados",
  },
];

// ── Execução ─────────────────────────────────────────────────
console.log("\n🖼️  SOS Pet — Atualização de fotos da loja\n");

let ok = 0;
let fail = 0;

for (const { match, url, desc } of FOTOS) {
  const { error, count } = await supabase
    .from("store_products")
    .update({ photo_url: url })
    .ilike("name", `%${match.slice(0, 20)}%`)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error(`  ✗ ${match}: ${error.message}`);
    fail++;
  } else if (count === 0) {
    console.warn(`  ⚠ ${match}: produto não encontrado`);
  } else {
    console.log(`  ✓ ${match} → ${desc}`);
    ok++;
  }
}

console.log(`\n${ok} foto(s) atualizada(s), ${fail} erro(s).\n`);
if (ok > 0) {
  console.log("✅ Acesse /loja para ver o resultado.\n");
  console.log("💡 Para trocar qualquer foto: /admin/loja → editar produto\n");
}
