# System Architecture Overview

## Purpose
This document describes the high-level architecture for the multi-tenant, audit-grade, compliant AI system for HS classification.

## Architecture Diagram

```
[To be added: Diagram showing frontend, backend, shared packages, CI/CD, security, compliance, and integrations]
```

## Components
- **Frontend (React 19, Vite, Tailwind, shadcn, Radix, React Router v7):**
  - Multi-tenant UI, authentication, document upload, status tracking, evidence bundle viewer.
- **Backend (Convex, Node.js):**
  - API (OpenAPI v3), RBAC/ABAC, audit trail, document processing, RAG search, evidence bundle, 4-eyes review, compliance logging.
- **Shared Packages:**
  - API contracts, utils, evidence bundle logic.
- **CI/CD:**
  - GitHub Actions, SBOM, SAST/DAST/SCA, automated compliance checks.
- **Security & Compliance:**
  - Auth0 OIDC, FIDO2, MFA, GDPR, ISO 27001/27701, NIS2, audit trail, HSM/KMS stubs.
- **Integrations:**
  - Stripe, email, SMS, OpenAI, external APIs.

## Compliance Mapping
- Each component mapped to relevant compliance controls (see /config/security/policies-rbac-mfa-gdpr.md)

## Next Steps
- Add detailed diagrams
- Expand component descriptions
- Map compliance requirements to architecture
