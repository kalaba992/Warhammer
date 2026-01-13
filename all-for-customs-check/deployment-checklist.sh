#!/usr/bin/env bash
# deployment-checklist.sh - Provera svih komponenti pre deployments

set -e

echo "=================================================="
echo "🔍 PROVERAVAMO SVE 8 KOMPONENTI"
echo "=================================================="
echo ""

# Boje
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Brojači
PASSED=0
FAILED=0
TOTAL=0

check_file() {
  local file=$1
  local description=$2
  TOTAL=$((TOTAL + 1))
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    echo "  📍 $file"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description"
    echo "  📍 $file (NOT FOUND)"
    FAILED=$((FAILED + 1))
  fi
}

check_directory() {
  local dir=$1
  local description=$2
  TOTAL=$((TOTAL + 1))
  
  if [ -d "$dir" ]; then
    echo -e "${GREEN}✓${NC} $description"
    echo "  📍 $dir"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description"
    echo "  📍 $dir (NOT FOUND)"
    FAILED=$((FAILED + 1))
  fi
}

# Proveravamo kompnente

echo -e "${BLUE}1. INPUT_CONTEXT Validator${NC}"
check_file "config/contract-validation.ts" "Config validation schema"
echo ""

echo -e "${BLUE}2. OpenAPI Contract Tests${NC}"
check_file "apps/backend/src/contracts/api.test.ts" "API contract tests"
echo ""

echo -e "${BLUE}3. JWS ES256 Signing${NC}"
check_file "src/lib/jws-signer.ts" "JWS cryptographic signer"
echo ""

echo -e "${BLUE}4. GIR Rules Engine${NC}"
check_file "src/lib/gir-engine.ts" "General Rules of Interpretation engine"
echo ""

echo -e "${BLUE}5. RFC3161 Timestamps${NC}"
check_file "src/lib/rfc3161-timestamp.ts" "RFC3161 time-stamp provider"
echo ""

echo -e "${BLUE}6. STOP JSON Handler${NC}"
check_file "src/lib/stop-json-handler.ts" "STOP JSON error responses"
echo ""

echo -e "${BLUE}7. GDPR DSR Endpoints${NC}"
check_file "src/lib/gdpr-dsr.ts" "GDPR Data Subject Rights"
echo ""

echo -e "${BLUE}8. SBOM + SAST/DAST/SCA Pipeline${NC}"
check_file ".github/workflows/security-sbom.yml" "GitHub Actions security pipeline"
check_file "scripts/generate-sbom.ts" "SBOM generation script"
echo ""

echo -e "${BLUE}BONUS: Immutable Audit Trail${NC}"
check_file "src/lib/immutable-audit-trail.ts" "Immutable append-only audit trail"
echo ""

echo -e "${BLUE}System Integration${NC}"
check_file "src/lib/system-integration.ts" "Master system integration hub"
echo ""

echo -e "${BLUE}Documentation${NC}"
check_file "KRITIČNA_IMPLEMENTACIJA_GOTOVA.md" "Critical implementation log"
check_file "FINALNI_STATUS_8_KOMPONENTI.md" "Final status report"
check_file "BRZI_VODIC_8_KOMPONENTI.md" "Quick start guide"
check_file "deployment-checklist.sh" "Deployment checklist"
echo ""

# Summary
echo "=================================================="
echo "📊 REZULTATI"
echo "=================================================="
echo -e "Total: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
else
  echo -e "${GREEN}Failed: 0${NC}"
fi

if [ $FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}🎉 SVI FAJLOVI SU PRISUTNI${NC}"
  echo ""
  echo "Sledeći koraci:"
  echo "1. npm install"
  echo "2. npm test"
  echo "3. npm run build"
  echo "4. npm run deploy"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}❌ NEDOSTAJU FAJLOVI${NC}"
  echo ""
  exit 1
fi
