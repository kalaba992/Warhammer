# Security Policies: RBAC, MFA, GDPR, ISO 27001/27701, NIS2

## RBAC (Role-Based Access Control)
- Define roles: admin, reviewer, user, guest
- Assign permissions per role (least privilege)
- Enforce role checks in backend and frontend
- Document role matrix

## MFA (Multi-Factor Authentication)
- Require MFA for privileged roles (admin, reviewer)
- Support TOTP and FIDO2 (WebAuthn)
- Enforce MFA at Auth0 OIDC level

## GDPR
- Data minimization, purpose limitation
- Right to access, rectify, erase (DSR ≤7 dana)
- Data residency: EU only
- Audit trail for all data access/changes

## ISO 27001/27701
- Information security management system (ISMS) controls
- Privacy Information Management (PIMS) controls
- Regular risk assessments and audits
- Incident response plan

## NIS2
- Network and information system security
- Incident notification within 24h
- Business continuity and disaster recovery
- Supply chain risk management

---

### Implementation Checklist
- [ ] RBAC roles and permissions enforced in code
- [ ] MFA required for privileged users
- [ ] GDPR DSR endpoints and audit trail
- [ ] ISO/NIS2 documentation and controls
