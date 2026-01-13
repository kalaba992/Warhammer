import { describe, it, expect } from 'vitest'
import { layerOneZeroToleranceBlocker } from '@/lib/validation'

describe('HSCode edge-case validation', () => {
  it('should block non-existent 8-digit code', () => {
    const result = layerOneZeroToleranceBlocker('9999.99.99')
    expect(result.passed).toBe(false)
    expect(result.details).toMatch(/NE POSTOJI/)
  })

  it('should pass for valid 8-digit code', () => {
    const result = layerOneZeroToleranceBlocker('1101.00.10')
    expect(result.passed).toBe(true)
    expect(result.details).toMatch(/VERIFICIRAN/)
  })
})
