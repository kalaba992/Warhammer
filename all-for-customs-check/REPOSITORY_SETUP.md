# GitHub Repository Setup Guide

## Carinski Alat - AI Customs Classification System

This guide will help you save all your work to the GitHub repository `all-for-customs`.

## Quick Setup Steps

### 1. Initialize Git (if not already done)
```bash
git init
```

### 2. Create .gitignore file
```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.vite/

# Environment variables
.env
.env.local
.env.production
.env.development

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Temporary files
.tmp/
temp/

# Cache
.cache/
.parcel-cache/

# Spark runtime
.spark/
EOF
```

### 3. Add all files to git
```bash
git add .
```

### 4. Create initial commit
```bash
git commit -m "Initial commit: Carinski Alat - AI Customs Classification System

Features:
- Multi-language support (BA/EN/DE/HR/SR/SK/SL/AL/MK/FR/ES/IT)
- Cyrillic/Latin script conversion
- AI-powered HS code classification
- Batch document upload with progress tracking
- CSV/Excel bulk import
- Spreadsheet export functionality
- Classification history with statistics
- Document analysis
- Real-time chat interface
- HS code search and tree view
- User preferences and favorites
"
```

### 5. Add remote repository
```bash
git remote add origin https://github.com/YOUR_USERNAME/all-for-customs.git
```

### 6. Push to GitHub
```bash
# For first time push
git branch -M main
git push -u origin main

# For subsequent pushes
git push
```

## Alternative: Create New Repository via GitHub CLI

If you have GitHub CLI installed:

```bash
# Login to GitHub
gh auth login

# Create new repository
gh repo create all-for-customs --public --description "AI-powered customs HS code classification system with multi-language support"

# Push code
git push -u origin main
```

## Alternative: Manual GitHub Setup

1. Go to https://github.com/new
2. Repository name: `all-for-customs`
3. Description: "AI-powered customs HS code classification system"
4. Choose Public or Private
5. Do NOT initialize with README (we have code already)
6. Click "Create repository"
7. Follow the instructions for "push an existing repository"

## Continuous Saves

To save your work regularly:

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Your descriptive message here"

# Push to GitHub
git push
```

## One-liner for Quick Saves

Create an alias in your shell:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias gitsave='git add . && git commit -m "Auto-save: $(date)" && git push'

# Then just run:
gitsave
```

## Project Structure

```
/workspaces/spark-template/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── main.css
│   ├── index.css
│   ├── components/
│   │   ├── BatchDocumentUpload.tsx
│   │   ├── BatchFileCard.tsx
│   │   ├── BatchProgressCard.tsx
│   │   ├── CacheStatistics.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── ClassificationDetailsPanel.tsx
│   │   ├── ClassificationHistoryView.tsx
│   │   ├── ClassificationStatistics.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── HSCodeSearch.tsx
│   │   ├── HSCodeTreeView.tsx
│   │   ├── LanguageSettings.tsx
│   │   ├── PDFCertificateButton.tsx
│   │   ├── QuickActionsBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SpreadsheetImport.tsx
│   │   └── ui/ (60+ Radix UI components)
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-script-converter.ts
│   ├── lib/
│   │   ├── aiService.ts
│   │   ├── excelService.ts
│   │   ├── hsCodeData.ts
│   │   ├── translations.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── theme.css
└── REPOSITORY_SETUP.md (this file)
```

## Environment Variables Note

Remember to set up your environment variables separately:
- Never commit `.env` files to git
- Use GitHub Secrets for deployment
- Document required env vars in README

## Next Steps After Push

1. Add a proper README.md with setup instructions
2. Add LICENSE file
3. Set up GitHub Actions for CI/CD (if needed)
4. Configure branch protection rules
5. Add collaborators if needed

## Support

For issues with git/GitHub:
- Git documentation: https://git-scm.com/doc
- GitHub docs: https://docs.github.com
- GitHub CLI: https://cli.github.com
