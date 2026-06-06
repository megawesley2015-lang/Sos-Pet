#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/monitor.sh
# Diagnóstico completo do SOS Pet: TypeScript · Build · npm audit · ESLint
#
# Uso:
#   bash scripts/monitor.sh [PROJECT_PATH]
#
# Se PROJECT_PATH não for passado, usa o diretório atual.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_PATH="${1:-$(pwd)}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

CRITICAL=0
WARNINGS=0
OK=0

echo -e "${CYAN}────────────────────────────────────────────────${NC}"
echo -e "${CYAN}🩺 DIAGNÓSTICO DO PROJETO — SOS Pet${NC}"
echo -e "${CYAN}📅 $TIMESTAMP${NC}"
echo -e "${CYAN}────────────────────────────────────────────────${NC}"

cd "$PROJECT_PATH"

# ─── 1. TypeScript ────────────────────────────────────────────────────────────
echo -e "\n${CYAN}[1/4] Verificando TypeScript...${NC}"
TS_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
if [ -z "$TS_OUTPUT" ]; then
  echo -e "${GREEN}✅ TypeScript: sem erros de tipo${NC}"
  ((OK++))
else
  TS_COUNT=$(echo "$TS_OUTPUT" | grep -c "error TS" || true)
  echo -e "${RED}🔴 TypeScript: $TS_COUNT erro(s) encontrado(s)${NC}"
  echo "$TS_OUTPUT" | head -30
  ((CRITICAL++))
fi

# ─── 2. npm audit ─────────────────────────────────────────────────────────────
echo -e "\n${CYAN}[2/4] Auditoria de dependências (npm audit)...${NC}"
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || true)
if echo "$AUDIT_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    vulns = data.get('vulnerabilities', {})
    critical = [v for v in vulns.values() if v['severity'] in ['critical','high']]
    if critical:
        for v in critical:
            print(f\"[{v['severity'].upper()}] {v.get('name','?')}: {v.get('title','')}\")
        sys.exit(1)
except: pass
" 2>/dev/null; then
  echo -e "${GREEN}✅ npm audit: 0 vulnerabilidades críticas/altas${NC}"
  ((OK++))
else
  echo -e "${RED}🔴 Vulnerabilidades encontradas — veja acima${NC}"
  ((CRITICAL++))
fi

# ─── 3. ESLint ────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}[3/4] Verificando ESLint...${NC}"
ESLINT_OUTPUT=$(npx eslint . --ext .ts,.tsx --format json 2>/dev/null || true)
ESLINT_ERRORS=$(echo "$ESLINT_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    count = sum(1 for f in data for m in f['messages'] if m['severity'] == 2)
    print(count)
except: print(0)
" 2>/dev/null || echo "0")

if [ "$ESLINT_ERRORS" -eq 0 ]; then
  echo -e "${GREEN}✅ ESLint: sem erros${NC}"
  ((OK++))
else
  echo -e "${YELLOW}🟡 ESLint: $ESLINT_ERRORS erro(s)${NC}"
  echo "$ESLINT_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for f in data:
        errors = [m for m in f['messages'] if m['severity'] == 2]
        if errors:
            path = f['filePath'].split('sos-pet/')[-1]
            for e in errors[:3]:
                print(f\"  {path}:{e['line']} — {e['message']}\")
except: pass
  " 2>/dev/null
  ((WARNINGS++))
fi

# ─── 4. Padrões de segurança (grep) ───────────────────────────────────────────
echo -e "\n${CYAN}[4/4] Escaneando padrões de segurança...${NC}"
SECURITY_ISSUES=0

check_pattern() {
  local label="$1"
  local pattern="$2"
  local severity="$3"
  local result
  result=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
    -E "$pattern" . 2>/dev/null | head -5 || true)
  if [ -n "$result" ]; then
    if [ "$severity" = "critical" ]; then
      echo -e "${RED}  🔴 $label${NC}"
      echo "$result" | sed 's/^/    /'
      ((CRITICAL++))
    else
      echo -e "${YELLOW}  🟡 $label${NC}"
      echo "$result" | sed 's/^/    /'
      ((WARNINGS++))
    fi
    ((SECURITY_ISSUES++))
  fi
}

check_pattern "Chave/secret exposto em NEXT_PUBLIC_" \
  'NEXT_PUBLIC_.*(KEY|SECRET|TOKEN|PASSWORD)' "critical"

check_pattern "dangerouslySetInnerHTML detectado" \
  'dangerouslySetInnerHTML' "medium"

check_pattern "SQL injection via template literal" \
  'SELECT.*\$\{' "critical"

check_pattern "serviceRoleKey fora de server-only" \
  'serviceRoleKey' "critical"

check_pattern "console.log com dados de usuário" \
  'console\.log.*(user|token|password|email)' "medium"

if [ "$SECURITY_ISSUES" -eq 0 ]; then
  echo -e "${GREEN}✅ Segurança: nenhum padrão crítico detectado${NC}"
  ((OK++))
fi

# ─── Sumário ──────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}────────────────────────────────────────────────${NC}"
echo -e "📊 SUMÁRIO"
echo -e "${GREEN}  ✅ $OK verificações OK${NC}"
echo -e "${YELLOW}  ⚠️  $WARNINGS avisos${NC}"
echo -e "${RED}  🚨 $CRITICAL problemas críticos${NC}"
echo -e "${CYAN}────────────────────────────────────────────────${NC}"

if [ "$CRITICAL" -gt 0 ]; then
  echo -e "${RED}❌ Deploy bloqueado — corrija os problemas críticos antes de subir.${NC}"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Deploy possível, mas resolva os avisos em breve.${NC}"
  exit 0
else
  echo -e "${GREEN}🚀 Projeto saudável — pode deployar!${NC}"
  exit 0
fi
