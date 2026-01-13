# Forenzički pregled repozitorija (za slanje)

Datum: 2026-01-06  
Repo: `kalaba992/all-for-customs`  
Osnovni snapshot (lokalni klon):
- Branch: `main`
- Commit: `48fb85d9a2c28329a2606b4d9839ab900f0d96d7`
- Tracked fajlova: `292`

## 1) Opseg i metodologija

Ovaj pregled je fokusiran na **sigurnosno-forenzičke indikatore** u repou:
- skeniranje *tracked* fajlova na hardkodirane tajne i tipične token pattern-e (OpenAI/GitHub/AWS/Google/Slack)
- provjera da li su `.env` fajlovi slučajno commitovani
- pregled CI/CD workflow fajlova (GitHub Actions) za curenje tajni i supply-chain rizike
- pregled Cloudflare Pages Functions (server-side) gdje se očekuju env var-ovi
- pregled dependency signala (npr. korištenje `latest`, global install, download+execute)

Napomena: Ovaj report **ne može** potvrditi vrijednosti Cloudflare Pages “Variables & Secrets” (to je van repoa), niti OpenAI dashboard stanje (quota/billing/rotacija ključeva).

## 2) Secret/Key sken (tracked fajlovi)

Skenirani pattern-i:
- `OPENAI_API_KEY` reference (naziv varijable)
- OpenAI key-like pattern: `sk-...`
- GitHub PAT: `ghp_...`
- AWS Access Key ID: `AKIA...`
- Google API Key: `AIza...`
- Slack token: `xox...`
- Private-key blokovi: `-----BEGIN ... PRIVATE KEY-----`

### Rezultati

**Nije pronađeno**:
- stvarni OpenAI API key u formatu `sk-...` u codebase-u
- GitHub PAT (`ghp_...`)
- AWS access key (`AKIA...`)
- Google API key (`AIza...`)
- Slack token (`xox...`)
- commitovani `.env` fajlovi (tracked)

**Pronađeno (dokumentacija / placeholder)**:
- `DEPLOYMENT.md` sadrži primjer `OPENAI_API_KEY=sk-...` (placeholder, nije stvarni ključ)
- `MANIFEST_8_KOMPONENTI.md` sadrži primjer `JWT_PRIVATE_KEY="-----BEGIN ... PRIVATE KEY-----\n...\n-----END ..."` (placeholder `...`)

Preporuka: iako su ovo placeholderi, zadrži ih kao očigledne primjere (npr. `REPLACE_ME`), i izbjegavaj u dokumentaciji savjet tipa `echo $JWT_PRIVATE_KEY` u CI kontekstu.

## 3) Cloudflare Pages Functions: gdje se očekuju tajne

### OpenAI ključ

Server-side endpoint je Cloudflare Pages Function:
- `functions/api/llm.ts`

Očekuje env var:
- `OPENAI_API_KEY` (**secret** u Cloudflare Pages)

U kodu postoji fallback:
- `VITE_OPENAI_API_KEY` (kompatibilnost)  
Rizik: ako je to slučajno ostalo postavljeno u Cloudflare Pages, može se koristiti “stari” ključ. Preporuka: obrisati `VITE_OPENAI_API_KEY` iz Cloudflare-a; po mogućnosti ukloniti fallback iz koda kad više nije potreban.

### Convex URL

Server-side retrieval endpoint:
- `functions/api/retrieveEvidence.ts`

Očekuje env var (nije secret):
- `CONVEX_URL` (preporučeno) ili `VITE_CONVEX_URL` (fallback)

## 4) CI/CD pregled (GitHub Actions)

Pronađeni workflow fajlovi:
- `.github/workflows/ci.yml` (lint/build/test)
- `.github/workflows/cloudflare-pages.yml` (deploy na Cloudflare Pages)
- `.github/workflows/security-sbom.yml` (SBOM + SAST/DAST/SCA)
- `.github/workflows/observability.yml` (placeholder)

### Key findings

**Deploy workflow** (`cloudflare-pages.yml`):
- koristi `CLOUDFLARE_API_TOKEN` i `CLOUDFLARE_ACCOUNT_ID` kao GitHub secrets
- ne koristi `OPENAI_API_KEY` (OpenAI key ide u Cloudflare Pages project variables)

**Security workflow** (`security-sbom.yml`) – supply-chain signal:
- koristi `wget` za download i izvršavanje eksternog skripta (Dependency-Check installer)
- preporuka: dodati checksum verifikaciju (npr. SHA256) ili koristiti pre-built, verifikovane action-e gdje je moguće

## 5) Dependency / reproducibility signali

U `apps/frontend/package.json` i `apps/backend/package.json` postoje dependency verzije sa `"latest"`.

Rizici:
- nereproducibilni build-ovi (isti commit može sutra povući drugu verziju)
- veći supply-chain rizik (nenajavljene promjene upstreama)

Preporuka:
- pinovati verzije (semver range ili tačno), oslanjati se na `package-lock.json`
- izbjegavati `latest` u produkcijskom okruženju

## 6) Zaključak (sažetak za reviewer-e)

1) Repo (tracked fajlovi) ne sadrži očigledno hardkodirane tajne / API ključeve.
2) Postoje placeholder primjeri u dokumentaciji (OpenAI key i JWT private key) – izgledaju kao primjeri, ne stvarne tajne.
3) Produkcijski rad zavisi od Cloudflare Pages “Variables & Secrets”:
   - `OPENAI_API_KEY` (secret)
   - `CONVEX_URL` (plaintext)
4) CI/CD je funkcionalan, ali security pipeline ima jedan tipičan supply-chain signal (download+execute bez checksum).
5) Postoje `latest` dependency verzije u `apps/*` koje treba pinovati radi reproducibilnosti.
