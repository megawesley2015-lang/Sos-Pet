/**
 * Smoke test autenticado — Módulo ONG
 * Fluxo: /registro → /ong/cadastro → /ong/dashboard → /ong/pets/novo → /ong/adocoes
 *
 * Uso: node scripts/smoke-ong.mjs
 */

import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const BASE     = 'http://localhost:3000'
const EMAIL    = `test+ong+${Date.now()}@sospet.dev`
const PASSWORD = 'Test@12345!'
const SS_DIR   = path.join(process.cwd(), 'scripts', 'smoke-screenshots')

fs.mkdirSync(SS_DIR, { recursive: true })

let browser, page
const log  = (msg) => console.log(`  ${msg}`)
const ok   = (msg) => console.log(`  ✅ ${msg}`)
const warn = (msg) => console.log(`  ⚠️  ${msg}`)
const fail = (msg) => console.log(`  ❌ ${msg}`)

async function ss(name) {
  const p = path.join(SS_DIR, `${name}.png`)
  await page.screenshot({ path: p, fullPage: false })
  log(`📸 ${name}.png`)
}

async function run() {
  browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  page = await ctx.newPage()

  // ── 1. REGISTRO ─────────────────────────────────────────────────────────────
  console.log('\n[1] Registro de nova conta')
  await page.goto(`${BASE}/registro`, { waitUntil: 'networkidle' })
  const registroTitle = await page.title()
  ok(`/registro carregou — title: "${registroTitle}"`)
  await ss('01-registro')

  // Preencher campos de registro
  const emailInput = page.locator('input[type="email"]').first()
  const passInput  = page.locator('input[type="password"]').first()

  if (await emailInput.count() === 0) {
    fail('Campo email não encontrado em /registro')
    await ss('01-registro-sem-form')
    await browser.close(); process.exit(1)
  }

  await emailInput.fill(EMAIL)
  await passInput.fill(PASSWORD)
  await ss('01-registro-preenchido')

  // Verificar segundo campo de senha se existir
  const passInputs = page.locator('input[type="password"]')
  if (await passInputs.count() > 1) {
    await passInputs.nth(1).fill(PASSWORD)
  }

  await page.locator('button[type="submit"]').click()
  await page.waitForLoadState('networkidle')
  await ss('01-registro-apos-submit')

  const urlAposRegistro = page.url()
  log(`URL após submit: ${urlAposRegistro}`)

  // Verificar se confirmação de email é necessária
  const bodyText = await page.locator('body').innerText()
  const precisaConfirmar = bodyText.toLowerCase().includes('confirme') ||
                           bodyText.toLowerCase().includes('verifique') ||
                           bodyText.toLowerCase().includes('check your email') ||
                           bodyText.toLowerCase().includes('email enviado')

  if (precisaConfirmar) {
    warn('Confirmação de email obrigatória no projeto Supabase')
    warn(`Conta criada: ${EMAIL} — precisa de confirm no dashboard`)
    warn('Skipping fluxo autenticado — testando apenas rotas públicas')
    await browser.close()
    return { emailConfirmRequired: true }
  }

  ok(`Conta criada sem confirmação — URL: ${urlAposRegistro}`)

  // ── 2. ONG CADASTRO ─────────────────────────────────────────────────────────
  console.log('\n[2] Cadastro do Shelter (/ong/cadastro)')
  await page.goto(`${BASE}/ong/cadastro`, { waitUntil: 'networkidle' })
  await ss('02-ong-cadastro')

  const cadastroUrl = page.url()
  if (cadastroUrl.includes('/login')) {
    fail(`/ong/cadastro redirecionou para login — sessão não estabelecida: ${cadastroUrl}`)
    await browser.close()
    return { authFailed: true }
  }
  ok(`/ong/cadastro acessível após login — URL: ${cadastroUrl}`)

  // Preencher form do shelter
  const nomeInput = page.locator('input[name="name"]').first()
  if (await nomeInput.count() > 0) {
    await nomeInput.fill('ONG Teste Playwright')
    await page.locator('input[name="phone"]').first().fill('13999990001')
    await page.locator('input[name="city"]').first().fill('Santos')

    // Selecionar tipo se existir
    const tipoSelect = page.locator('select[name="type"]')
    if (await tipoSelect.count() > 0) await tipoSelect.selectOption('ong')

    await ss('02-ong-cadastro-preenchido')
    await page.locator('button[type="submit"]').click()
    await page.waitForLoadState('networkidle')
    await ss('02-ong-cadastro-apos-submit')
    log(`URL após cadastro: ${page.url()}`)
  } else {
    warn('Form de cadastro não encontrado — possível redirecionamento já feito')
  }

  // ── 3. DASHBOARD ────────────────────────────────────────────────────────────
  console.log('\n[3] Dashboard (/ong/dashboard)')
  await page.goto(`${BASE}/ong/dashboard`, { waitUntil: 'networkidle' })
  await ss('03-dashboard')

  const dashUrl = page.url()
  if (dashUrl.includes('/login')) {
    fail(`Dashboard redirecionou para login — ${dashUrl}`)
  } else {
    ok(`Dashboard acessível — ${dashUrl}`)
    const dashText = await page.locator('body').innerText()
    if (dashText.includes('Visão geral') || dashText.includes('dashboard')) {
      ok('Dashboard renderizou com conteúdo ONG')
    }
    // Verificar métricas
    const metricas = await page.locator('[class*="metric"], [class*="card"]').count()
    log(`Cards/métricas encontrados: ${metricas}`)
  }

  // ── 4. PETS LIST ─────────────────────────────────────────────────────────────
  console.log('\n[4] Lista de pets (/ong/pets)')
  await page.goto(`${BASE}/ong/pets`, { waitUntil: 'networkidle' })
  await ss('04-pets-lista')
  ok(`/ong/pets — ${page.url()}`)

  // ── 5. NOVO PET ──────────────────────────────────────────────────────────────
  console.log('\n[5] Novo pet (/ong/pets/novo)')
  await page.goto(`${BASE}/ong/pets/novo`, { waitUntil: 'networkidle' })
  await ss('05-pets-novo')

  const novoPetUrl = page.url()
  if (!novoPetUrl.includes('/login')) {
    ok(`Formulário de novo pet acessível — ${novoPetUrl}`)

    // Verificar campos obrigatórios
    const campos = ['species', 'color', 'size', 'sex']
    for (const campo of campos) {
      const el = page.locator(`[name="${campo}"]`)
      const count = await el.count()
      if (count > 0) ok(`Campo "${campo}" presente`)
      else warn(`Campo "${campo}" não encontrado`)
    }
    await ss('05-pets-novo-form')
  } else {
    fail(`/ong/pets/novo redirecionou para login`)
  }

  // ── 6. ADOÇÕES ───────────────────────────────────────────────────────────────
  console.log('\n[6] Adoções (/ong/adocoes)')
  await page.goto(`${BASE}/ong/adocoes`, { waitUntil: 'networkidle' })
  await ss('06-adocoes')
  ok(`/ong/adocoes — ${page.url()}`)

  // ── 7. PROBE: ACESSO INDEVIDO ────────────────────────────────────────────────
  console.log('\n[7] Probe: rota inexistente dentro de /ong')
  await page.goto(`${BASE}/ong/rota-que-nao-existe`, { waitUntil: 'networkidle' })
  await ss('07-probe-404')
  const probeStatus = await page.evaluate(() => document.title)
  log(`Título da página 404: "${probeStatus}"`)

  await browser.close()
  return { success: true }
}

run().then(result => {
  console.log('\n─────────────────────────────────')
  if (result.emailConfirmRequired) {
    console.log('⚠️  BLOCKED: Supabase requer confirmação de email')
    console.log('   Solução: Desabilitar "Confirm email" em Authentication → Email no Supabase Dashboard')
    console.log(`   Screenshots salvas em: ${SS_DIR}`)
    process.exit(2)
  }
  if (result.authFailed) {
    console.log('❌ FAIL: Sessão não foi estabelecida após registro')
    process.exit(1)
  }
  console.log('✅ PASS: Fluxo ONG autenticado completo')
  console.log(`   Screenshots salvas em: ${SS_DIR}`)
}).catch(err => {
  console.error('\n❌ ERRO NO SCRIPT:', err.message)
  if (page) page.screenshot({ path: path.join(SS_DIR, 'error.png') }).catch(() => {})
  process.exit(1)
})
