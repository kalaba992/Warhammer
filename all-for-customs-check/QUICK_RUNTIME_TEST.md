# Quick Runtime Test (Cloudflare Pages)

This is a minimal checklist to validate the deployed runtime (Pages + Functions) without guessing.

## Preconditions

Cloudflare Pages → Settings → Environment variables (Production):

- `OPENAI_API_KEY` (secret)
- `CONVEX_URL` (plaintext): `https://<your-deployment>.convex.cloud`

Optional:
- `VITE_AUDIT_MODE=1` to enforce strict **AUDIT** mode (fail-closed)

## 1) Diagnostics endpoint

Open in browser:

- `/api/diag`

Expected:

- `ok: true`
- `env.OPENAI_API_KEY_present: true`
- `env.CONVEX_URL_present: true`
- `openai.reachable: true` (may be `false` if blocked)
- `convex.reachable: true` (may be `false` if blocked)

## 2) Retrieval proxy

Call:

- `/api/retrieveEvidence`

Body example:

```json
{ "tenant_id": "default", "q": "test", "limit": 1 }
```

Expected:

- `ok: true`
- `value.ok` is either `true` or `false` (e.g. `no_hits`)

## 3) LLM proxy

Call:

- `/api/llm`

Body example:

```json
{ "prompt": "Return JSON: {\"hsCode\":\"8471.30.00\",\"confidence\":\"low\",\"reasoning\":[\"test\"],\"legalBasis\":{}}", "responseFormat": "json_object" }
```

Expected:

- `ok: true`
- `completion` is a JSON string (may be fenced; client is lenient)

## 4) UI behavior

- In strict AUDIT mode (`VITE_AUDIT_MODE=1`), missing evidence should return a **STOP** result with an explicit message.
- To trigger controlled fallback, send a chat message prefixed with:

`FALLBACK: <your product description>`
