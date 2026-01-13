# Carinski Alat (all-for-customs)

AI-powered customs classification system with evidence-first, audit-grade operations.

## Getting started (repo root)

Requirements:

- Node.js 18+

```bash
npm ci
npm run dev
```

Quality gates:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Repository layout

- apps/frontend: React app
- apps/backend: Backend app
- apps/convex: Convex app workspace
- packages/*: shared packages
- convex/: Convex functions and schema
- functions/: Cloudflare Pages Functions
- tools/: operational tooling (import/smoke checks)
- config/: security/architecture/CI documentation

## Documentation entry points

- GitHub push/start: [START_OVDJE.md](START_OVDJE.md)
- Master index: [MASTER_INDEX.md](MASTER_INDEX.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Implementation notes: [IMPLEMENTATION.md](IMPLEMENTATION.md)
- Deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- Admin operations: [ADMIN_RUNBOOK.md](ADMIN_RUNBOOK.md)

## Knowledge base ingestion (ZIP/PDF → Convex)

This repo includes a deterministic ingestion toolchain:

- Tool docs: [tools/convex_kb_zip_parser/README.md](tools/convex_kb_zip_parser/README.md)
- End-to-end runbook: [RUNBOOK_KB_INGESTION.md](RUNBOOK_KB_INGESTION.md)
