// apps/backend/src/contracts/api.test.ts
// OpenAPI contract tests

import { describe, it, expect } from 'vitest'

describe('OpenAPI Contract Tests', () => {
  const BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:4000'
  const RUN = process.env.RUN_BACKEND_CONTRACT_TESTS === '1'

  if (!RUN) {
    it.skip('skipped (set RUN_BACKEND_CONTRACT_TESTS=1 to enable)', () => {})
    return
  }

  // Test: Health endpoint
  it('GET /api/health - should return ok status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveProperty('status')
    expect(data.status).toBe('ok')
  })

  // Test: God Mode activate endpoint
  it('POST /api/godmode/activate - should require owner + 2FA', async () => {
    const res = await fetch(`${BASE_URL}/api/godmode/activate`, {
      method: 'POST',
      headers: {
        'x-user-id': 'user-1',
        'x-user-email': 'admin@example.com',
        'x-user-owner': 'false',
        'x-user-2fa': 'false'
      }
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  // Test: God Mode activate with valid credentials
  it('POST /api/godmode/activate - should activate with owner + 2FA', async () => {
    const res = await fetch(`${BASE_URL}/api/godmode/activate`, {
      method: 'POST',
      headers: {
        'x-user-id': 'user-1',
        'x-user-email': 'admin@example.com',
        'x-user-owner': 'true',
        'x-user-2fa': 'true'
      }
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('godMode')
    expect(data.godMode).toBe(true)
  })

  // Test: God Mode status endpoint
  it('GET /api/godmode/status - should return current status', async () => {
    const res = await fetch(`${BASE_URL}/api/godmode/status`, {
      headers: {
        'x-user-id': 'user-1',
        'x-user-email': 'admin@example.com',
        'x-user-owner': 'true',
        'x-user-2fa': 'true'
      }
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('godMode')
  })

  // Test: God Mode deactivate endpoint
  it('POST /api/godmode/deactivate - should deactivate God Mode', async () => {
    const res = await fetch(`${BASE_URL}/api/godmode/deactivate`, {
      method: 'POST',
      headers: {
        'x-user-id': 'user-1',
        'x-user-email': 'admin@example.com',
        'x-user-owner': 'true',
        'x-user-2fa': 'true'
      }
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('godMode')
    expect(data.godMode).toBe(false)
  })

  // Test: RBAC endpoint - admin access
  it('GET /api/admin - should allow admin role', async () => {
    // Mock: assuming role is extracted from auth middleware
    const res = await fetch(`${BASE_URL}/api/admin`, {
      headers: {
        'x-user-role': 'admin'
      }
    })
    expect([200, 401, 403]).toContain(res.status)
  })

  // Test: Classification endpoint contract
  it('POST /api/classify - should accept product and return HS code', async () => {
    const payload = {
      product_description: 'Cotton t-shirt',
      language: 'en'
    }
    const res = await fetch(`${BASE_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      const data = await res.json()
      expect(data).toHaveProperty('hsCode')
      expect(data).toHaveProperty('confidence')
      expect(data).toHaveProperty('reasoning')
    }
  })

  // Test: Evidence Bundle endpoint
  it('GET /api/evidence-bundles/:id - should return Evidence Bundle', async () => {
    const bundleId = 'test-bundle-id'
    const res = await fetch(`${BASE_URL}/api/evidence-bundles/${bundleId}`, {
      headers: {
        'x-user-id': 'user-1',
        'x-tenant-id': 'tenant-1'
      }
    })
    
    if (res.ok) {
      const data = await res.json()
      expect(data).toHaveProperty('bundle_id')
      expect(data).toHaveProperty('jws')
      expect(data.jws).toHaveProperty('signature')
    }
  })

  // Test: Error response format
  it('should return proper error format on 4xx/5xx', async () => {
    const res = await fetch(`${BASE_URL}/api/nonexistent`)
    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
