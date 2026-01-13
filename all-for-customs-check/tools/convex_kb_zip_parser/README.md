<!-- markdownlint-disable MD022 MD031 MD032 MD040 MD041 MD034 -->

# Convex Knowledge Base ZIP Parser & Importer

Toolkit for ingesting PDF documents from ZIP archives into Convex SoT Knowledge Base.

## Overview

This toolset consists of:
1. **parse_zip_to_convex_bundle.py** - Python script to extract PDFs from ZIP and generate JSONL
2. **convex_import.ts** - TypeScript importer to load JSONL into Convex
3. **smokeCheck.ts** - Verification tool (located in `tools/`)

## Prerequisites

### Python Dependencies
```bash
python3 -m pip install -r requirements.txt
```

### Node.js Dependencies
```bash
npm install  # from workspace root
```

### Environment Variables
```bash
export CONVEX_DEPLOYMENT="https://your-deployment.convex.cloud"
```

Get from `.env.local` in workspace root:
```bash
export CONVEX_DEPLOYMENT="$(grep CONVEX_DEPLOYMENT .env.local | cut -d '=' -f2)"
```

## Workflow

### Step 1: Parse ZIP to JSONL

```bash
python3 parse_zip_to_convex_bundle.py \
  --zip "/path/to/B-H-Objededinjeni-spisak-03-2015.zip" \
  --out "./out_convex_bundle" \
  --tenant-id "default" \
  --corpus-version "0.1.0" \
  --trust-level "internal"
```

**Outputs:**
- `out_convex_bundle/documents.jsonl` - Document metadata
- `out_convex_bundle/citations.jsonl` - Citations with page locators
- `out_convex_bundle/chunks.jsonl` - Text chunks with deterministic IDs
- `out_convex_bundle/report.json` - Count summary

### Step 2: Import JSONL into Convex

```bash
npx tsx convex_import.ts --dir ./out_convex_bundle --tenant default
```

**Import Order (enforced):**
1. Documents
2. Citations
3. Chunks (batched, 100 per call)

**Guardrails:**
- Citation MUST have `snapshot_hash_sha256` + `page_from` + `page_to`
- Chunks inserted with `index_pending=true`

### Step 3: Verify Import

```bash
\# Note: smokeCheck requires --corpus-version
npx tsx ../smokeCheck.ts \
  --report ./out_convex_bundle/report.json \
  --tenant default \
  --corpus-version "0.1.0"
```

**Verifies:**
- Document/citation/chunk counts match `report.json`
- `hydrateChunks` returns valid citation + document bundles
- Citations have required page ranges

**Expected Output:**
```
✅ Counts match:
   Documents: 42
   Citations: 1250
   Chunks: 1250

✅ Hydration test passed (10 random chunks)
```

## Architecture

### Deterministic ID Generation

All IDs are generated deterministically using SHA-256 hashing:

```python
# Python (parser)
document_id = "doc_" + sha256(source_url)[:12]
chunk_id = "chk_" + sha256(f"{doc_id}:{ordinal}:{text_hash}")[:16]
citation_id = "cit_" + sha256(f"{chunk_id}:{snapshot_hash}:{locator}")[:16]
```

```typescript
// TypeScript (Convex idUtils.ts)
documentId = "doc_" + sha256Hex(source_url).slice(0, 12)
chunkId = "chk_" + sha256Hex(`${doc_id}:${ordinal}:${text_hash}`).slice(0, 16)
citationId = "cit_" + sha256Hex(`${chunk_id}:${snapshot_hash}:${locator}`).slice(0, 16)
```

### Citation Guardrails

Every citation **MUST** include:
- `snapshot_hash_sha256` - PDF content hash (proof of evidence)
- `page_from` - Start page number (1-based)
- `page_to` - End page number (1-based)

Enforced in:
- `convex/functions/ingestion_worker.ts`
- `convex/functions/indexing_worker.ts`
- `convex/functions/decisions.ts`

## Troubleshooting

### "No matching export for mutation/query"
✅ Fixed: All Convex functions now import from `../_generated/server`

### "Could not resolve crypto"
✅ Fixed: Using WebCrypto (`crypto.subtle.digest`) instead of Node.js `crypto`

### "smokeCheck.ts bundling error"
✅ Fixed: Moved to `tools/` (outside `convex/` to isolate Node imports)

### Import fails with "missing snapshot_hash_sha256"
Check parser output - all citations must have `snapshot_hash_sha256` field set to PDF content hash.

### Counts don't match in smokeCheck
- Verify JSONL files were fully written (no truncation)
- Check `report.json` accuracy
- Confirm `tenant_id` matches in parser, importer, and smokeCheck

## Next Steps

After successful import + verification:

1. **Run indexer worker** to process `index_pending=true` chunks
2. **Test classification** with real documents (no more `0000.00.00` errors)
3. **Monitor audit trail** via `ingestion_runs` table

## Support

For issues related to:
- **Parser**: Check PyMuPDF version, PDF format compatibility
- **Importer**: Verify `CONVEX_DEPLOYMENT`, check Convex logs
- **Schema**: Review `convex/schema.ts` indexes
- **Guardrails**: See `ARCHITECTURE.md` for citation requirements
