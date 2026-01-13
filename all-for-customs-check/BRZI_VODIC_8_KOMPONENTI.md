# 8 KRITIČNIH KOMPONENTI - BRZI VODIC

## 📦 Šta je implementirano?

Sve 8 komponenti za audit-grade customs HS klasifikacijski sistem:

### 1️⃣ INPUT_CONTEXT Validator
```typescript
import { validateInputContext } from './config/contract-validation';

const result = await validateInputContext(inputData);
if (result.valid) {
  console.log('✓ Validacija prošla');
  const stepA = generateStepAOutput(result.data);
} else {
  console.log('✗ Error:', result.error);
}
```

### 2️⃣ Contract Tests
```bash
# Pokreni testove
npm test --workspace=@all-for-customs/backend

# Testira 10 endpoint-a:
# - GET /api/health
# - POST /api/godmode/activate
# - POST /api/godmode/deactivate
# - GET /api/godmode/status
# - POST /api/classify
# - GET /api/evidence-bundles/:id
# ... i još
```

### 3️⃣ JWS ES256 Signing
```typescript
import { signJWS, verifyJWS } from './src/lib/jws-signer';

// Kreiraj digitalni potpis
const jws = await signJWS(payload, 'kms-key-001', privateKeyPem);

// Verifikuj
const verified = await verifyJWS(jws, publicKeyPem);
```

### 4️⃣ GIR Rules Engine
```typescript
import { evaluateGIRPrecedence } from './src/lib/gir-engine';

// Primeni svih 6 GIR pravila
const result = await evaluateGIRPrecedence(
  'Cotton fabric, 65% polyester',
  '5208'
);

console.log(result.gir_path);  // [1, 4] - koja su pravila primenjena
console.log(result.confidence); // 0.87
```

### 5️⃣ RFC3161 Timestamps
```typescript
import { createRFC3161Timestamp, addRFC3161TimestampToBundle } from './src/lib/rfc3161-timestamp';

// Dodaj vremenske marke
const timestamp = await createRFC3161Timestamp(
  contentHash,
  'sha256',
  'https://timestamp.thawte.com'
);

const bundleWithTS = await addRFC3161TimestampToBundle(bundle, tsaUrl);
```

### 6️⃣ STOP JSON Handler
```typescript
import { createStopJsonValidationError, stopJsonToHttpResponse } from './src/lib/stop-json-handler';

// Kreiraj standardizovanu grešku
const stopJson = createStopJsonValidationError(
  'doc-123',
  'Missing citation to legal precedent',
  ['citations']
);

// Konvertuj u HTTP response
const httpResponse = stopJsonToHttpResponse(stopJson);
// → { statusCode: 422, body: { ... } }
```

### 7️⃣ GDPR DSR Endpoints
```typescript
import {
  processDataAccessRequest,
  processDataDeletionRequest,
  processDataPortabilityRequest
} from './src/lib/gdpr-dsr';

// Art. 15: Zatraži sve svoje podatke
const data = await processDataAccessRequest(userId);

// Art. 17: Zatraži brisanje
await processDataDeletionRequest(userId);

// Art. 20: Zatraži u CSV formatu
const csv = await processDataPortabilityRequest(userId, 'csv');
```

### 8️⃣ SBOM + Security Pipeline
```bash
# Generiši SBOM
npm run generate-sbom

# GitHub Actions pokeneće:
# - SBOM (CycloneDX + SPDX)
# - ESLint SAST
# - npm audit SCA
# - OWASP ZAP DAST

# Rezultati u:
# sbom-reports/sbom-cyclonedx.json
# sbom-reports/sbom-spdx.spdx
# sbom-reports/sbom-report.html
```

### 🎁 BONUS: Immutable Audit Trail
```typescript
import { ImmutableAuditTrail, initializeAuditTrail } from './src/lib/immutable-audit-trail';

// Initialize
const trail = initializeAuditTrail({
  signingKey: 'your-secret-key',
  minRetentionDays: 365,
  enableLegalHold: true,
  enableChaining: true
});

// Kreiraj entry (append-only)
const entry = await trail.createEntry(
  userId,
  userEmail,
  'CLASSIFY',
  'classification',
  documentId,
  'Classification: 5208.20',
  { legalHold: true } // Ne može se obrisati
);

// Verifikuj integritet
const isValid = trail.verifyChainIntegrity();

// Export za audite
const json = await trail.exportForCompliance('json');
```

---

## 🔧 INTEGRACIJA U SISTEM

Sve komponente su integrisan u `src/lib/system-integration.ts`:

```typescript
import {
  initializeSystem,
  classificationWorkflow,
  godModeAudit,
  gdprService,
  complianceReporting
} from './src/lib/system-integration';

// Inicijalizuj sistem
initializeSystem({
  auditTrailSigningKey: process.env.AUDIT_TRAIL_KEY,
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
  jwtPublicKey: process.env.JWT_PUBLIC_KEY,
  tsaUrl: 'https://timestamp.thawte.com',
  minConfidenceThreshold: 0.75,
  enableFourEyesReview: true
});

// Pokreni klasifikaciju
const result = await classificationWorkflow.classify({
  documentId: 'doc-123',
  filename: 'fabric.pdf',
  contentHash: 'sha256-...',
  productDescription: 'Cotton fabric',
  userId: 'user-456',
  userEmail: 'user@example.com',
  userRole: 'customs-officer'
});

// Rezultat:
// - HS kod sa GIR putem
// - JWS digitalni potpis
// - RFC3161 vremenska marka
// - Evidence Bundle za arhivu
// - Audit trail entry
```

---

## 📂 FAJLOVI

| Komponenta | Fajl | Linije |
|---|---|---|
| #1 INPUT_CONTEXT | `config/contract-validation.ts` | 320 |
| #2 Tests | `apps/backend/src/contracts/api.test.ts` | 280 |
| #3 JWS | `src/lib/jws-signer.ts` | 347 |
| #4 GIR | `src/lib/gir-engine.ts` | 413 |
| #5 RFC3161 | `src/lib/rfc3161-timestamp.ts` | 287 |
| #6 STOP JSON | `src/lib/stop-json-handler.ts` | 276 |
| #7 GDPR DSR | `src/lib/gdpr-dsr.ts` | 383 |
| #8 SBOM/SAST | `.github/workflows/security-sbom.yml` | 340 |
| SBOM Script | `scripts/generate-sbom.ts` | 520 |
| Audit Trail | `src/lib/immutable-audit-trail.ts` | 460 |
| System Integration | `src/lib/system-integration.ts` | 400 |

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] npm install
- [ ] npm test
- [ ] npm run build
- [ ] Konfiguruj environment (audit key, JWT keys)
- [ ] Setup Convex database
- [ ] Deploy na production
- [ ] Test God Mode endpoints
- [ ] Verify audit trail entries
- [ ] Generate SBOM via GitHub Actions

---

**Sve je gotovo i sprema za upotrebu! 🚀**
