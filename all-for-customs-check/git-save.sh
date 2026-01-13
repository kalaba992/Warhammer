#!/bin/bash

# Quick Git Save Script for Carinski Alat
# Usage: ./git-save.sh "Your commit message"

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Carinski Alat - Git Save Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}Git not initialized. Initializing...${NC}"
    git init
    git branch -M main
fi

# Check if remote exists
if ! git remote | grep -q origin; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  GitHub remote nije konfigurisan!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}KORACI ZA SETUP:${NC}"
    echo ""
    echo -e "1️⃣  Kreiraj GitHub repository:"
    echo -e "   ${CYAN}https://github.com/new${NC}"
    echo -e "   Repository name: ${GREEN}all-for-customs${NC}"
    echo ""
    echo -e "2️⃣  Dodaj remote (ZAMENI USERNAME sa tvojim GitHub username-om):"
    echo -e "   ${GREEN}git remote add origin https://github.com/USERNAME/all-for-customs.git${NC}"
    echo ""
    echo -e "3️⃣  Pokreni ponovo:"
    echo -e "   ${GREEN}./git-save.sh \"Initial commit\"${NC}"
    echo ""
    echo -e "${BLUE}📚 Za detaljne upute vidi:${NC}"
    echo -e "   ${CYAN}START_OVDJE.md${NC} (vizuelni vodič)"
    echo -e "   ${CYAN}BRZI_VODIC.md${NC} (3 koraka)"
    echo ""
    exit 1
fi

# Get commit message
if [ -z "$1" ]; then
    COMMIT_MSG="Auto-save: $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

echo ""
echo -e "${BLUE}📝 Staging changes...${NC}"
git add .

echo ""
echo -e "${BLUE}📊 Status:${NC}"
git status --short

echo ""
echo -e "${BLUE}💾 Committing with message:${NC}"
echo -e "   ${GREEN}${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG" || {
    echo -e "${RED}Nothing to commit or commit failed${NC}"
    exit 0
}

echo ""
echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
git push -u origin main || git push

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Successfully saved to GitHub!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Extract GitHub URL info
REMOTE_URL=$(git remote get-url origin)
if [[ $REMOTE_URL =~ github.com[:/]([^/]+)/([^/.]+) ]]; then
    USERNAME="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
    
    echo -e "${BLUE}🌐 Repository URL:${NC}"
    echo -e "   ${CYAN}https://github.com/${USERNAME}/${REPO}${NC}"
    echo ""
    echo -e "${BLUE}📊 Actions (CI/CD):${NC}"
    echo -e "   ${CYAN}https://github.com/${USERNAME}/${REPO}/actions${NC}"
    echo ""
fi

echo -e "${BLUE}📚 Sljedeći koraci:${NC}"
echo -e "   ${GREEN}1.${NC} Provjeri repository na GitHub-u"
echo -e "   ${GREEN}2.${NC} Pročitaj ${CYAN}DEPLOYMENT.md${NC} za Cloudflare setup"
echo -e "   ${GREEN}3.${NC} Deploy aplikaciju na Cloudflare Pages"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
