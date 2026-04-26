#!/usr/bin/env node
/**
 * Pré-deploy — roda antes de subir pra produção.
 *
 *  1. typecheck (tsc --noEmit)
 *  2. build (next build)
 *  3. .gitignore audit (.env*.local não pode estar comitado)
 *  4. grep por SUPABASE_SERVICE_ROLE_KEY hardcoded fora de .env*
 *
 * Uso local:
 *   node scripts/pre-deploy.mjs
 *
 * Cross-platform (Windows/Mac/Linux). Não precisa de bash.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = process.cwd();
let failed = 0;

function header(title) {
  console.log(`\n\x1b[36m▶ ${title}\x1b[0m`);
}
function ok(msg) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}
function fail(msg) {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  failed++;
}
function warn(msg) {
  console.log(`  \x1b[33m!\x1b[0m ${msg}`);
}

// --- Step 1: typecheck ---
header("1. TypeScript typecheck");
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  ok("sem erros de tipo");
} catch {
  fail("typecheck falhou — corrija os erros acima");
}

// --- Step 2: build ---
header("2. Next build");
try {
  execSync("npx next build", { stdio: "inherit" });
  ok("build concluído");
} catch {
  fail("build falhou — corrija os erros acima");
}

// --- Step 3: .gitignore audit ---
header("3. .gitignore audit");
if (!existsSync(join(ROOT, ".gitignore"))) {
  fail(".gitignore não existe");
} else {
  const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
  const lines = gitignore
    .split("\n")
    .map((l) => l.trim().replace(/^\//, "").replace(/\/$/, ""));
  const required = [".env", ".env*.local", "node_modules", ".next", ".vercel"];
  const missing = required.filter((needle) => !lines.includes(needle));
  if (missing.length === 0) {
    ok("inclui as entradas obrigatórias");
  } else {
    fail(`.gitignore não inclui: ${missing.join(", ")}`);
  }
}

// --- Step 4: secret leak audit ---
header("4. Secret leak audit");
const SECRET_PATTERNS = [
  // Substring que deve aparecer SÓ em .env.local e .env.example,
  // nunca em código-fonte hardcoded.
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?eyJ/,
];
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  "scripts",
]);
const SKIP_FILES = new Set([
  ".env",
  ".env.local",
  ".env.example",
  ".env.production",
  ".env.development",
]);
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

let leaks = 0;
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
    } else if (
      ALLOWED_EXT.has("." + entry.split(".").pop()) &&
      !SKIP_FILES.has(entry)
    ) {
      const content = readFileSync(path, "utf8");
      for (const re of SECRET_PATTERNS) {
        if (re.test(content)) {
          fail(`secret hardcoded em ${path.replace(ROOT + sep, "")}`);
          leaks++;
        }
      }
    }
  }
}
walk(ROOT);
if (leaks === 0) ok("nenhum secret hardcoded em código-fonte");

// --- Final ---
console.log();
if (failed === 0) {
  console.log(
    "\x1b[32m✓ Tudo certo — pode fazer git push.\x1b[0m\n"
  );
  process.exit(0);
} else {
  console.log(
    `\x1b[31m✗ ${failed} verificação(ões) falharam — não suba ainda.\x1b[0m\n`
  );
  process.exit(1);
}
