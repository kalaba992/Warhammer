# KB Ingestion Runbook (ZIP/PDF → Convex)

This runbook uses the repo’s existing tooling to ingest PDF documents (packed in a ZIP) into the Convex SoT Knowledge Base with deterministic IDs and citation guardrails.

## Preconditions

- Node.js 18+
- Python 3.x (`python3`)
- A Convex deployment URL that supports HTTP queries/mutations (must be `https://...convex.cloud`)

## 0) Install dependencies

From repo root:

```bash
npm ci
```

Install Python dependency for PDF parsing:

```bash
python3 -m pip install -r tools/convex_kb_zip_parser/requirements.txt
```

## 1) Set Convex URL (required)

Set one of these environment variables:

- `CONVEX_URL` (preferred for tools), or
- `CONVEX_DEPLOYMENT`

Example:

```bash
export CONVEX_DEPLOYMENT="https://<your-deployment>.convex.cloud"
```

## 2) Parse a ZIP into a JSONL bundle (writes under repo root)

Choose a corpus version string you will reuse across import and smoke check.

```bash
python3 tools/convex_kb_zip_parser/parse_zip_to_convex_bundle.py \
  --zip "/absolute/path/to/your-archive.zip" \
  --out "./kb_ingest/out_convex_bundle" \
  --tenant-id "default" \
  --corpus-version "0.1.0" \
  --trust-level "internal"
```

Expected outputs:

- `kb_ingest/out_convex_bundle/documents.jsonl`
- `kb_ingest/out_convex_bundle/citations.jsonl`
- `kb_ingest/out_convex_bundle/chunks.jsonl`
- `kb_ingest/out_convex_bundle/report.json`

## 3) Import JSONL into Convex

```bash
npx tsx tools/convex_kb_zip_parser/convex_import.ts \
  --dir "./kb_ingest/out_convex_bundle" \
  --tenant "default" \
  --corpus-version "0.1.0" \
  --source-zip "/absolute/path/to/your-archive.zip"
```

Notes:

- Import order is enforced by the script: documents → citations → chunks.
- Chunks are imported in batches of 100.

## 4) Verify ingest (counts + hydration)

This checks:

- Convex ingestion_report counts match `report.json`
- Sample chunk hydration returns citation + document + page range

```bash
npx tsx tools/smokeCheck.ts \
  --report "./kb_ingest/out_convex_bundle/report.json" \
  --tenant "default" \
  --corpus-version "0.1.0"
```

## 5) Package repo-local docs (optional)

If you want a single zip of the repo’s documentation files (repo-local only):

```bash
bash tools/zip_repo_docs.sh
```

This writes `artifacts/repo-docs.zip` at repo root.

## Operational constraints

- The parser extracts one text chunk per PDF page and streams output (no “load all pages into memory” buffering).
- Document metadata defaults in the parser are currently hard-coded (e.g., jurisdiction/language/effective dates). If you ingest non-matching documents, adjust the parser or extend it with CLI flags before import.
