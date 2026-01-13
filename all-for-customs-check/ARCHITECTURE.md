# ARCHITECTURE.md

## System Architecture Overview

### 1. Core Components
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS, Radix UI, Framer Motion, shadcn/ui, Sonner, React Hook Form
- **Backend/AI:** OpenAI GPT-4o (classification), Convex (serverless DB, audit log, ingestion, deterministic IDs), SheetJS (Excel), PapaParse (CSV)
- **Integrations:** Cloudflare Pages (deployment), Spark KV (persistent storage), HTTPS-only, audit logging

### 2. Key Features
- ChatGPT-style classification interface (8-digit HS code, confidence, reasoning, legal basis)
- 3-layer anti-hallucination validation (TARIC, trust score, hierarchical check)
- Batch upload (up to 50 docs), CSV/Excel import (up to 100 rows), professional Excel export
- Classification history, audit trail, favorites, advanced dashboard, admin (God Mode), knowledge base import
- Multilingual (12 languages, Latin/Cyrillic, real-time conversion)

### 3. Code Structure
- `src/components/` – UI (upload, history, dashboard, admin, import, etc.)
- `src/lib/` – AI service, Excel/CSV, DB, utils, translations
- `src/types/` – TypeScript types
- `convex/` – backend functions, schema, deterministic IDs, ingestion pipeline
- Documentation: `README.md`, `IMPLEMENTATION.md`, `PRD.md`, `ROADMAP.md`

---

## Bulletproof Agent Contract Alignment

### Fully Implemented
- Audit-grade ingestion/log (Convex, audit trail, deterministic IDs)
- Zero tolerance anti-hallucination (3-layer validation, blocking, scoring)
- Legal defensibility (confidence, reasoning, legal basis, precedents)
- Batch/bulk processing (multi-file, CSV/Excel, export, edge case handling)
- Multilingual & script conversion (12 languages, Latin/Cyrillic, localized export)
- Admin/God Mode (RBAC, audit log, admin dashboard, restricted access)
- Knowledge base import (bulk import, validation, audit)
- Professional Excel export (formatted, localized, filters, timestamped)
- Edge case handling (empty rows, parsing errors, filter zero results, offline, etc.)
- Deployment/CI (Cloudflare Pages, build/test/lint, deployment checklist)

### Planned (per Roadmap)
- API access (REST API for programmatic classification)
- Mobile apps, ERP integrations, blockchain verification
- Advanced analytics (predictive, ML insights)
- Automated tariff calculation, declarations
- Customs broker marketplace

---

## Conclusion

- **System is fully aligned with bulletproof agent contract prompt for all core, audit, legal, batch, multilingual, admin, and edge case requirements.**
- **All key architectural and security guidelines are implemented.**
- **Advanced enterprise/integration features are planned in the roadmap.**
- **Documentation is comprehensive; all processes and edge cases are covered.**

---

*This file is auto-generated from current documentation and implementation. For details, see README.md, IMPLEMENTATION.md, PRD.md, and ROADMAP.md.*
