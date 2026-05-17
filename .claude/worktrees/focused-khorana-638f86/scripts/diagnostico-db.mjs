#!/usr/bin/env node
/**
 * Diagnóstico completo do banco SOS Pet.
 * node scripts/diagnostico-db.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

function loadEnv() {
  let main = process.cwd();
  try {
    const list = execSync("git worktree list --porcelain", { encoding: "utf8" });
    const m = list.match(/^worktree (.+)/m);
    if (m) main = m[1].trim();
  } catch {}
  for (const p of [join(process.cwd(), ".env.local"), join(main, ".env.local")]) {
    try {
      for (const line of readFileSync(p, "utf8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const idx = t.indexOf("=");
        if (idx === -1) continue;
        const key = t.slice(0, idx).trim();
        const val = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
      break;
    } catch {}
  }
}
loadEnv();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

console.log("\n🔍 SOS Pet — Diagnóstico do Banco\n");

// ── Pets ─────────────────────────────────────────────────────
const { count: totalPets }  = await sb.from("pets").select("*", { count: "exact", head: true });
const { count: lostPets }   = await sb.from("pets").select("*", { count: "exact", head: true }).eq("status","active").eq("kind","lost");
const { count: foundPets }  = await sb.from("pets").select("*", { count: "exact", head: true }).eq("status","active").eq("kind","found");
const { count: draftPets }  = await sb.from("pets").select("*", { count: "exact", head: true }).eq("status","draft");
console.log(`🐾 Pets: ${totalPets} total | ${lostPets} perdidos ativos | ${foundPets} encontrados | ${draftPets} draft`);

// ── Loja ─────────────────────────────────────────────────────
const { count: produtos } = await sb.from("store_products").select("*", { count: "exact", head: true });
const { count: ativos }   = await sb.from("store_products").select("*", { count: "exact", head: true }).eq("active", true);
const { count: comFoto }  = await sb.from("store_products").select("*", { count: "exact", head: true }).not("photo_url","is",null);
console.log(`🛍️  Loja: ${produtos} produtos | ${ativos} ativos | ${comFoto} com foto`);

// ── Tabelas ONG ──────────────────────────────────────────────
const tabelas = ["prontuarios","vacinas","medicacoes","adocoes","ong_details"];
const statusTabelas = [];
for (const t of tabelas) {
  const { error } = await sb.from(t).select("*", { count: "exact", head: true });
  statusTabelas.push(`${error ? "❌" : "✅"} ${t}`);
}
console.log(`\n🏥 Tabelas ONG:\n  ${statusTabelas.join("\n  ")}`);

// ── Usuários ─────────────────────────────────────────────────
const { data: roles } = await sb.from("profiles").select("role");
const roleCount = (roles ?? []).reduce((acc, r) => {
  acc[r.role] = (acc[r.role] ?? 0) + 1;
  return acc;
}, {});
console.log(`\n👤 Usuários: ${JSON.stringify(roleCount)}`);

// ── Resumo ───────────────────────────────────────────────────
console.log("\n📋 AÇÕES NECESSÁRIAS:");
if ((lostPets ?? 0) === 0)
  console.log("  ⚠️  Nenhum pet perdido ativo → carrossel ficará oculto até ter pets");
if ((produtos ?? 0) < 17)
  console.log(`  ⚠️  Apenas ${produtos} produtos → rodar seed-loja.sql para os 7 fornecedores novos`);
if (statusTabelas.some(s => s.startsWith("❌")))
  console.log("  ❌  Tabelas ONG ausentes → rodar supabase/migrations/20260505_ong_panel.sql");
if (!roleCount?.ong)
  console.log("  ℹ️  Nenhum usuário com role=ong ainda");
console.log("");
