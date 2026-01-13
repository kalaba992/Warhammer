# FORENSIC REPO REVIEW v2 — EVIDENCE-ONLY (FAIL-CLOSED)

> Read-only repo audit. No assumptions beyond reproduced evidence.
>
> **Redaction rule:** HS-like numeric patterns are omitted/redacted.

## A) Identity (Deterministic)

### Repo identity

**Command**

```powershell
Get-Location | Select-Object -ExpandProperty Path
git remote -v
```

**Output (captured)**

- `WORKDIR: C:\temp\all-for-customs-merge`
- `origin  https://github.com/kalaba992/all-for-customs.git (fetch)`
- `origin  https://github.com/kalaba992/all-for-customs.git (push)`

### Baseline vs HEAD

**Command**

```powershell
(Get-Content .spark-initial-sha -Raw).Trim()
(git rev-parse HEAD).Trim()
```

**Output (captured)**

- BASE: `445b731d70c251cfc274aae6607684cc294e4cb0`
- HEAD: `48fb85d9a2c28329a2606b4d9839ab900f0d96d7`

### File counts

**Command**

```powershell
$base = (Get-Content .spark-initial-sha -Raw).Trim()
"BASE_FILES: {0}" -f ((git ls-tree --name-only -r $base | Measure-Object).Count)
"HEAD_FILES: {0}" -f ((git ls-tree --name-only -r HEAD | Measure-Object).Count)
```

**Output (captured)**

- `BASE_FILES: 69`
- `HEAD_FILES: 292`

### Author summary

**Command**

```powershell
$base = (Get-Content .spark-initial-sha -Raw).Trim()
git shortlog -sne "$base..HEAD"
```

**Output (captured)**

- `170  kalaba992 <kalaba.992@gmail.com>`
- `27  Kalaba Developer <kalaba.992@gmail.com>`
- `23  copilot-swe-agent[bot] <198982749+Copilot@users.noreply.github.com>`
- `13  dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>`
- `2  Copilot <198982749+Copilot@users.noreply.github.com>`

## Tooling Constraints (Proven)

### ripgrep availability

**Command**

```powershell
where.exe rg
```

**Output (captured)**

- `INFO: Could not find files for the given pattern(s).`
- `WHERE_RG_EXIT_CODE: 1`

**Implication:** keyword scans are executed via `grep` with explicit excludes.

## B) Change Index (Baseline → HEAD)

### Change-type counts

**Command**

```powershell
$base = (Get-Content .spark-initial-sha -Raw).Trim()
git diff --name-status "$base..HEAD" |
  ForEach-Object { ($_ -split "\s+")[0] } |
  Group-Object |
  Sort-Object Name |
  ForEach-Object { "{0} {1}" -f $_.Name, $_.Count }
```

**Output (captured)**

- `A 223`
- `M 25`

### Diff stat (excerpt)

**Command**

```powershell
$base = (Get-Content .spark-initial-sha -Raw).Trim()
git diff --stat "$base..HEAD" | Select-Object -First 40
```

**Output (captured)**

- Excerpt (first 40 lines):
  - `.devcontainer/devcontainer.json                    |     30 +`
  - `.devcontainer/onCreate.sh                          |     36 +`
  - `.devcontainer/postStartCommand.sh                  |     42 +`
  - `.devcontainer/refreshTools.sh                      |     20 +`
  - `.devcontainer/spark.conf                           |     48 +`
  - `.env.example                                       |     12 +`
  - `.file-manifest                                     |     99 +`
  - `.github/workflows/ci.yml                           |     77 +`
  - `.github/workflows/cloudflare-pages.yml             |     56 +`
  - `.github/workflows/security-sbom.yml                |    253 +`
  - `.gitignore                                         |     90 +-`
  - `DEPLOYMENT.md                                      |    249 +`

## C) Architecture / Routing Systems (FAIL-CLOSED)

### New subsystems exist at HEAD and are absent at BASE (PROVEN)

**Command**

```powershell
$base = (Get-Content .spark-initial-sha -Raw).Trim()
$paths = @(
  'src/lib/aiService.ts',
  'src/lib/convexRetrieval.ts',
  'src/lib/stop-json-handler.ts',
  'src/lib/system-integration.ts',
  'src/lib/validation.ts',
  'src/lib/gir-engine.ts',
  'convex/schema.ts',
  'convex/functions/retrieval.ts',
  'convex/functions/decisions.ts',
  'functions/api/retrieveEvidence.ts',
  'functions/api/llm.ts',
  '.github/workflows/ci.yml',
  '.github/workflows/cloudflare-pages.yml'
)

foreach ($p in $paths) {
  git cat-file -e "$base`:$p" 2>$null
  if ($LASTEXITCODE -eq 0) { "$p: BASE_OK" } else { "$p: BASE_MISSING" }
}
```

**Output (captured)**

- `src/lib/aiService.ts: BASE_MISSING`
- `src/lib/convexRetrieval.ts: BASE_MISSING`
- `src/lib/stop-json-handler.ts: BASE_MISSING`
- `src/lib/system-integration.ts: BASE_MISSING`
- `src/lib/validation.ts: BASE_MISSING`
- `src/lib/gir-engine.ts: BASE_MISSING`
- `convex/schema.ts: BASE_MISSING`
- `convex/functions/retrieval.ts: BASE_MISSING`
- `convex/functions/decisions.ts: BASE_MISSING`
- `functions/api/retrieveEvidence.ts: BASE_MISSING`
- `functions/api/llm.ts: BASE_MISSING`
- `.github/workflows/ci.yml: BASE_MISSING`
- `.github/workflows/cloudflare-pages.yml: BASE_MISSING`

### Convex schema exists (PROVEN)

**Command**

```powershell
$ln = 0
Get-Content -Path 'convex/schema.ts' | ForEach-Object {
  $ln++
  if ($ln -le 120) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- Excerpt:
  - `   2: import { defineSchema, defineTable } from "convex/server";`
  - `   5: export default defineSchema({`
  - `  15:   tenant_settings: defineTable({`
  - `  17:     active_corpus_version: v.string(),`
  - `  56:   ingestion_runs: defineTable({`
  - `  78:   documents: defineTable({`
  - `  94:     corpus_version: v.string(),`

### Cloudflare Pages Function proxy for evidence retrieval exists (PROVEN)

**Command**

```powershell
$ln = 0
Get-Content -Path 'functions/api/retrieveEvidence.ts' | ForEach-Object {
  $ln++
  if ($ln -le 120) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- Excerpt:
  - `  18: export const onRequest: PagesFunction<Env> = async ({ request, env }) => {`
  - `  20:     const convexUrl = (env.CONVEX_URL || env.VITE_CONVEX_URL || '').trim()`
  - `  39:     const response = await fetch(`${convexUrl}/api/query`, {`
  - `  43:         path: 'functions/retrieval:retrieveEvidence',`

### Cloudflare Pages Function proxy for OpenAI exists (PROVEN)

**Command**

```powershell
$ln = 0
Get-Content -Path 'functions/api/llm.ts' | ForEach-Object {
  $ln++
  if ($ln -le 120) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- Excerpt:
  - `   2:   OPENAI_API_KEY: string`
  - `  24:     const apiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || ''`
  - `  45:     const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {`
  - 49: `Authorization: \`Bearer ${apiKey}\``

### Anything beyond repo text (UNKNOWN)

- Runtime wiring in production (Cloudflare + Convex availability, env vars, deployed behavior) is **UNKNOWN** in a read-only repo audit.

## D) Decision Logic: STOP/FINAL, guardrails, VAKUM (FAIL-CLOSED)

### VAKUM keyword scan (PROVEN ABSENT AS TEXT)

**Command**

```powershell
git grep -n -I -E -e "VAKUM|vakum|vacuum|VACUUM" -- src convex functions apps packages config
"VAKUM_EXIT_CODE: {0}" -f $LASTEXITCODE
```

**Output (captured)**

- `VAKUM_EXIT_CODE: 1`

### STOP/FINAL scan (clean, excludes node_modules) (PROVEN)

**Command**

```powershell
git grep -n -I -E -e "\b(STOP|FINAL)\b" -- src convex functions apps packages config | Select-Object -First 120
```

**Output (captured)**

- Excerpt:
  - `apps/convex/schema.ts:120:    status: v.union(v.literal("FINAL"), v.literal("STOP")),`
  - `convex/functions/retrieval.ts:225:    // 4) Hydrate + hard guardrails (STOP bez dokaza)`
  - `src/lib/aiService.ts:116:      // STOP: No citable evidence found - return graceful error response`
  - `src/lib/aiService.ts:146:       hsCode: 'PENDING',`

### Retrieval guardrails (PROVEN)

**Command**

```powershell
$start = 200; $end = 270; $ln = 0
Get-Content -Path 'convex/functions/retrieval.ts' | ForEach-Object {
  $ln++
  if ($ln -ge $start -and $ln -le $end) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- Excerpt:
  - ` 225:     // 4) Hydrate + hard guardrails (STOP bez dokaza)`
  - ` 234:     // Enforce citation proof (snapshot_hash + page range) na output-u`
  - ` 237:       return Boolean(c?.snapshot_hash_sha256 && c?.locator?.page_from && c?.locator?.page_to);`
  - ` 240:     if (safe.length === 0) {`
  - ` 242:         ok: false as const,`
  - ` 243:         reason: "no_citable_evidence" as const,`

### Application-level fail-closed behavior on retrieval stop (PROVEN)

**Commands**

```powershell
# Call sites
git grep -n -I "retrieveEvidence(" -- src/lib

# Control flow excerpt with HS-like redaction applied
$start = 90; $end = 170; $ln = 0
Get-Content -Path 'src/lib/aiService.ts' | ForEach-Object {
  $ln++
  if ($ln -ge $start -and $ln -le $end) {
    $redacted = $_ -replace '\b\d{2,4}(?:\.\d{2}){1,3}\b','HS_REDACTED'
    "{0,4}: {1}" -f $ln, $redacted
  }
}
```

**Output (captured)**

- Call sites:
  - `src/lib/aiService.ts:109:    const retrieval = await retrieveEvidence(productDescription, {`
  - `src/lib/aiService.ts:326:    const retrieval = await retrieveEvidence(question, {`
  - `src/lib/convexRetrieval.ts:72:export async function retrieveEvidence(`
- Fail-closed behavior excerpt:
  - ` 115:     if (!retrieval.ok) {`
  - ` 116:       // STOP: No citable evidence found - return graceful error response`
  - ` 146:       hsCode: 'PENDING',`

### Decision finalization constraints (PROVEN)

**Command**

```powershell
$ln = 0
Get-Content -Path 'convex/functions/decisions.ts' | ForEach-Object {
  $ln++
  if ($ln -le 140) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- `status` is `FINAL|STOP`.
- If `FINAL` and `citation_ids.length === 0` → returns `{ ok:false, error:"missing_citations" }`.
- If `STOP` and missing `reason` → returns `{ ok:false, error:"missing_reason" }`.
- If `FINAL` and any citation lacks `snapshot_hash_sha256` or page range → returns `{ ok:false, error:"missing_citation_proof" }`.

### VAKUM verdict (FAIL-CLOSED)

- “VAKUM feature exists” → **UNKNOWN** (no textual evidence).
- “No hidden VAKUM behavior” → **UNKNOWN** (runtime cannot be proven read-only).
- What is proven: explicit retrieval gating + STOP/PENDING behavior + backend no-citable-evidence guardrails.

## E) Data / Schema / Versioning (FAIL-CLOSED)

### Convex schema includes corpus_version and ingestion tables (PROVEN)

**Command**

```powershell
$ln = 0
Get-Content -Path 'convex/schema.ts' | ForEach-Object {
  $ln++
  if ($ln -le 120) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- Excerpt:
  - `  15:   tenant_settings: defineTable({`
  - `  17:     active_corpus_version: v.string(),`
  - `  41:   ingestion_reports: defineTable({`
  - `  56:   ingestion_runs: defineTable({`
  - `  94:     corpus_version: v.string(),`

### Decisions table includes FINAL/STOP (PROVEN)

**Command**

```powershell
$start = 90; $end = 150; $ln = 0
Get-Content -Path 'apps/convex/schema.ts' | ForEach-Object {
  $ln++
  if ($ln -ge $start -and $ln -le $end) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- `decisions.status` is `v.union(v.literal("FINAL"), v.literal("STOP"))`.

### Anything beyond schema text (UNKNOWN)

- Exact corpus version bump rules and operational enforcement across ingestion → retrieval → decisioning are **UNKNOWN** unless evidenced by additional code paths or runtime logs.

## F) Tests / CI / Deploy (FAIL-CLOSED)

### Tests present (PROVEN)

**Command**

```powershell
git ls-files | Where-Object { $_ -match '\.(test|spec)\.(ts|tsx)$' } | Select-Object -First 200
```

**Output (captured)**

- `apps/backend/src/contracts/api.test.ts`
- `src/lib/dataset-driven-classification.test.ts`
- `src/lib/validation.edge.test.ts`

### CI workflow behavior (PROVEN)

**Command**

```powershell
$ln = 0
Get-Content -Path '.github/workflows/ci.yml' | ForEach-Object {
  $ln++
  if ($ln -le 160) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- In `build` job: `continue-on-error: true` for `Run linter` and `Type check`.
- `Run tests` is present without `continue-on-error` (default behavior applies).
- Separate `lint` job runs ESLint with `continue-on-error: false`.

### Cloudflare Pages deploy workflow (PROVEN)

**Command**

```powershell
$ln = 0
Get-Content -Path '.github/workflows/cloudflare-pages.yml' | ForEach-Object {
  $ln++
  if ($ln -le 160) { "{0,4}: {1}" -f $ln, $_ }
}
```

**Output (captured)**

- Lint runs with `continue-on-error: true`.
- Builds and deploys via `cloudflare/pages-action@v1`.

## G) Secret-pattern Scan (Tracked Files Only) (FAIL-CLOSED)

> Scope note: this scan is **tracked files only** (`git grep`). Untracked/local files are out of scope.

### Tracked env files (PROVEN)

**Command**

```powershell
git ls-files | Where-Object { $_ -match '(^|/)\.env(\.|$)' } | Sort-Object
```

**Output (captured)**

- `.env.example`
- `apps/backend/.env.example`
- `apps/frontend/.env.example`

### OPENAI_API_KEY references (PROVEN)

**Command**

```powershell
git grep -n -I "OPENAI_API_KEY" | Select-Object -First 120
```

**Output (captured)**

- `.env.example:6:OPENAI_API_KEY=`
- `functions/api/llm.ts:24:    const apiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || ''`
- `DEPLOYMENT.md:220:OPENAI_API_KEY=sk-...` (placeholder)

### OpenAI token-like pattern (sk-...) strict scan (PROVEN)

**Command**

```powershell
git grep -n -I -E -e "sk-[A-Za-z0-9]{10,}" -- .
"OPENAI_SK_EXIT_CODE: {0}" -f $LASTEXITCODE
```

**Output (captured)**

- `NO_MATCHES`
- `OPENAI_SK_EXIT_CODE: 1`

### Private key block markers (PROVEN)

**Command**

```powershell
git grep -n -I -E -e "-----BEGIN (EC |RSA )?PRIVATE KEY-----" -- .
"EXIT_CODE: {0}" -f $LASTEXITCODE
```

**Output (captured)**

- `MANIFEST_8_KOMPONENTI.md:220:JWT_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"`
- `EXIT_CODE: 0`

### Common token patterns (PROVEN)

**Command**

```powershell
# GitHub PATs
git grep -n -I -E -e "\b(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b" -- .
"GITHUB_EXIT_CODE: {0}" -f $LASTEXITCODE

# AWS Access Key ID
git grep -n -I -E -e "\bAKIA[0-9A-Z]{16}\b" -- .
"AWS_EXIT_CODE: {0}" -f $LASTEXITCODE

# Google API key
git grep -n -I -E -e "\bAIza[0-9A-Za-z\-_]{20,}\b" -- .
"GOOGLE_EXIT_CODE: {0}" -f $LASTEXITCODE

# Slack token
git grep -n -I -E -e "\bxox[baprs]-[0-9A-Za-z-]{10,}\b" -- .
"SLACK_EXIT_CODE: {0}" -f $LASTEXITCODE
```

**Output (captured)**

- `GITHUB_EXIT_CODE: 1`
- `AWS_EXIT_CODE: 1`
- `GOOGLE_EXIT_CODE: 1`
- `SLACK_EXIT_CODE: 1`

## Risk Register (Evidence-tied)

- CI partial fail-open: `continue-on-error: true` for linter and type-check in `build` job may allow those failures to be non-blocking in that job.
- Evidence gating strictness: retrieval filters out results lacking citation proof fields; may cause frequent `no_citable_evidence` STOP if ingestion is incomplete.
- Runtime dependency: classification path returns PENDING when retrieval stops or errors; system depends on Convex availability.

## Next Actions (Evidence-tied)

- If CI must be strict: remove `continue-on-error: true` for tests/typecheck/lint in the `build` job and rely on hard-gating.
- If STOP/no-evidence is too frequent: ensure ingestion always produces citations with snapshot hash and page ranges.

---

Generated on: 2026-01-06

Evidence captured on: Windows PowerShell (UTF-8 console)
