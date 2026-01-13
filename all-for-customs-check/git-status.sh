#!/bin/bash

# Git Status Helper Script
# Shows current git status and provides clear next steps

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║       ${CYAN}CARINSKI ALAT - Git Status & Helper${BLUE}              ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}✗ Git nije inicijalizovan${NC}"
    echo ""
    echo -e "${YELLOW}RJEŠENJE:${NC}"
    echo -e "  git init"
    echo -e "  git add ."
    echo -e "  git commit -m \"Initial commit\""
    exit 1
fi

echo -e "${GREEN}✓ Git je inicijalizovan${NC}"
echo ""

# Check for remote
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📡 REMOTE REPOSITORY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if ! git remote | grep -q origin; then
    echo -e "${RED}✗ Remote 'origin' nije konfigurisan${NC}"
    echo ""
    echo -e "${YELLOW}ŠTA DALJE:${NC}"
    echo -e "  1. Kreiraj GitHub repository:"
    echo -e "     ${CYAN}https://github.com/new${NC}"
    echo -e "     Repository name: ${GREEN}all-for-customs${NC}"
    echo ""
    echo -e "  2. Dodaj remote (zameni TVOJE_IME sa GitHub username):"
    echo -e "     ${GREEN}git remote add origin https://github.com/TVOJE_IME/all-for-customs.git${NC}"
    echo ""
    echo -e "  3. Push kod na GitHub:"
    echo -e "     ${GREEN}./git-save.sh \"Initial commit\"${NC}"
    echo ""
    echo -e "${CYAN}📚 Detaljne upute: START_OVDJE.md${NC}"
else
    REMOTE_URL=$(git remote get-url origin)
    echo -e "${GREEN}✓ Remote 'origin' je konfigurisan${NC}"
    echo -e "  URL: ${CYAN}${REMOTE_URL}${NC}"
    
    # Extract username and repo from URL
    if [[ $REMOTE_URL =~ github.com[:/]([^/]+)/([^/.]+) ]]; then
        USERNAME="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        echo ""
        echo -e "${CYAN}🌐 GitHub URL:${NC}"
        echo -e "  https://github.com/${USERNAME}/${REPO}"
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 GIT STATUS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get status
STATUS_OUTPUT=$(git status --short)

if [ -z "$STATUS_OUTPUT" ]; then
    echo -e "${GREEN}✓ Nema novih promjena${NC}"
    echo -e "  Sve je commit-ovano i push-ovano."
else
    echo -e "${YELLOW}⚠ Imaš nepotvrđene promjene:${NC}"
    echo ""
    git status --short | while IFS= read -r line; do
        echo -e "  ${YELLOW}${line}${NC}"
    done
    
    echo ""
    echo -e "${CYAN}ŠTA DALJE:${NC}"
    echo -e "  ${GREEN}./git-save.sh \"Opis tvoje promjene\"${NC}"
    echo ""
    echo -e "  ILI ručno:"
    echo -e "  ${GREEN}git add .${NC}"
    echo -e "  ${GREEN}git commit -m \"Opis promjene\"${NC}"
    echo -e "  ${GREEN}git push${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📜 ZADNJIH 5 COMMIT-OVA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if git log --oneline -5 >/dev/null 2>&1; then
    git log --oneline -5 --color=always | while IFS= read -r line; do
        echo -e "  ${line}"
    done
else
    echo -e "${YELLOW}  Još nema commit-ova${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔧 BRZE KOMANDE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}./git-status.sh${NC}          - Prikaži ovaj pregled ponovo"
echo -e "  ${GREEN}./git-save.sh \"Poruka\"${NC}  - Snimi sve promjene na GitHub"
echo -e "  ${GREEN}git status${NC}               - Vidi status"
echo -e "  ${GREEN}git log --oneline${NC}        - Vidi istoriju"
echo -e "  ${GREEN}git diff${NC}                 - Vidi šta je promijenjeno"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📚 DOKUMENTACIJA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}START_OVDJE.md${NC}                    - Početak (vizuelni vodič)"
echo -e "  ${CYAN}BRZI_VODIC.md${NC}                     - 3 koraka do GitHub-a"
echo -e "  ${CYAN}KAKO_SNIMITI_NA_GITHUB.md${NC}        - Detaljne upute + rješenja"
echo -e "  ${CYAN}DEPLOYMENT.md${NC}                     - Cloudflare Pages deployment"
echo -e "  ${CYAN}README.md${NC}                         - Glavna dokumentacija"
echo ""
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
