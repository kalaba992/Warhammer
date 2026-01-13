# Security Policy

## 🔒 Overview

**Carinski Alat** is a legally-critical customs classification system. Security is paramount given the regulatory and legal implications of misclassification. We take all security issues seriously and appreciate responsible disclosure.

## 🎯 Security Priorities

### Critical Areas

1. **Data Integrity** - Classification results must be accurate and tamper-proof
2. **Validation System** - Zero-tolerance anti-hallucination must not be bypassed
3. **User Data** - All user preferences and classification history must be protected
4. **Input Sanitization** - Protection against XSS, prompt injection, and malicious inputs
5. **API Security** - Rate limiting and authentication enforcement

## 📋 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🚨 Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Send security vulnerability reports to: **kalaba992@gmail.com**

**Subject Line:** `[SECURITY] Brief description of vulnerability`

### Information to Include

To help us understand and address the issue quickly, please include:

1. **Type of vulnerability**
   - XSS (Cross-Site Scripting)
   - Injection (SQL, NoSQL, Prompt)
   - Authentication/Authorization bypass
   - Data exposure
   - Validation bypass
   - Other (specify)

2. **Location of affected code**
   - File path
   - Line number(s)
   - Git commit/branch

3. **Reproduction steps**
   - Detailed step-by-step instructions
   - Expected vs. actual behavior
   - Screenshots/videos if applicable

4. **Impact assessment**
   - Who is affected (all users, authenticated users, admin only)
   - What data is at risk
   - Potential consequences
   - CVSS score if available

5. **Proof of concept**
   - Code snippet demonstrating the vulnerability
   - Exploit payload (if applicable)
   - Test environment details

6. **Suggested fix** (optional)
   - How you would recommend fixing it
   - Alternative approaches

### Example Report

```
Subject: [SECURITY] Potential XSS in product description input

Type: Cross-Site Scripting (XSS)
Location: src/components/ChatInterface.tsx, line 234
Severity: High

Description:
User input in product description field is not sanitized before 
being displayed in classification results, allowing arbitrary 
JavaScript execution.

Reproduction:
1. Navigate to chat interface
2. Enter: <script>alert('XSS')</script>
3. Submit classification request
4. Observe alert popup when results display

Impact:
- All users viewing classification results
- Could steal session tokens or user data
- Could modify displayed classification results

Proof of Concept:
[Screenshot attached]

Suggested Fix:
Sanitize user input using DOMPurify before rendering in results.
```

## ⏱️ Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Varies by severity
  - Critical: 1-3 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-60 days

## 🏆 Responsible Disclosure

We follow responsible disclosure practices:

1. **Do not** exploit the vulnerability beyond what is necessary to demonstrate it
2. **Do not** access, modify, or delete user data
3. **Do not** disclose the vulnerability publicly until we've had a chance to fix it
4. **Do** give us reasonable time to address the issue before public disclosure

### Recognition

We maintain a **Security Hall of Fame** in this file to recognize security researchers who have responsibly disclosed vulnerabilities:

*No security issues reported yet.*

## 🛡️ Security Features

### Current Protections

✅ **Input Sanitization**
- XSS protection on all user inputs
- HTML encoding before rendering
- File upload validation (type, size, content)

✅ **Rate Limiting**
- 20 requests per minute per user
- Automatic throttling for excess requests

✅ **Data Protection**
- Client-side only storage (no server transmission)
- Local key-value persistence via secure Spark KV API
- No third-party data sharing

✅ **Validation System**
- 3-layer anti-hallucination validation
- Cryptographic verification hashes
- Audit trail for all classifications

✅ **God Mode Security**
- Restricted to specific email addresses only
- 2FA requirement for administrative functions
- Audit logging for all admin actions

### Planned Enhancements

🔜 **Content Security Policy (CSP)**
- Restrict script sources
- Prevent inline script execution

🔜 **Subresource Integrity (SRI)**
- Verify integrity of external resources
- Prevent CDN compromises

🔜 **Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin

## 🔍 Known Security Considerations

### Client-Side AI Processing

**Consideration:** AI responses are generated client-side via Spark LLM API

**Mitigation:**
- 3-layer validation ensures no hallucinated codes
- TARIC database verification for all codes
- Cryptographic verification hashes
- Complete audit trail

### Local Data Storage

**Consideration:** User data stored in browser local storage

**Mitigation:**
- Data never leaves user's device
- No server transmission
- User can clear data anytime
- GDPR compliant (user controls own data)

### File Upload Processing

**Consideration:** User-uploaded files processed client-side

**Mitigation:**
- File type validation
- Size limits enforced (50 files max, 25MB per file)
- Content sanitization before processing
- No file storage (temporary processing only)

## 📞 Contact

- **Security Email:** kalaba992@gmail.com
- **General Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/all-for-customs/issues)
- **General Questions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/all-for-customs/discussions)

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Academy](https://portswigger.net/web-security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Thank you for helping keep Carinski Alat and our users safe! 🛡️**
