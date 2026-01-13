import type { ValidationLayerResult } from '@/types'
import { retrieveEvidence } from './convexRetrieval'

function normalizeHsCodeInput(hsCode: string): string {
  return hsCode.trim().replace(/\s+/g, '').toUpperCase()
}

function asDigits(hsCode: string): string {
  return hsCode.replace(/\D/g, '')
}

function formatHs8(digits: string): string {
  // expects at least 8 digits
  const d = digits.slice(0, 8)
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`
}

function isValidHs8Format(hsCode: string): boolean {
  return /^\d{4}\.\d{2}\.\d{2}$/.test(hsCode)
}

export function generateVerificationHash(hsCode: string, timestamp: number): string {
  const data = `${hsCode}-${timestamp}-TARIC-VERIFIED`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(12, '0')
}

export async function layerOneZeroToleranceBlocker(hsCode: string): Promise<ValidationLayerResult> {
  const normalized = normalizeHsCodeInput(hsCode)
  const digits = asDigits(normalized)
  if (digits.length < 8) {
    return {
      layer: 'zero_tolerance',
      passed: false,
      details: `KRITIČNA GREŠKA: HS kod nije valjan (očekujem min. 8 cifara). Dobijeno: ${hsCode}`
    }
  }

  const hs8 = isValidHs8Format(normalized) ? normalized : formatHs8(digits)
  if (!isValidHs8Format(hs8)) {
    return {
      layer: 'zero_tolerance',
      passed: false,
      details: `KRITIČNA GREŠKA: HS kod nije u formatu XXXX.XX.XX. Dobijeno: ${hsCode}`
    }
  }

  // Authoritative existence check: query Convex corpus (active_corpus_version + citable evidence).
  const retrieval = await retrieveEvidence(hs8, { limit: 1, include_parent: false })
  const exists = retrieval.ok === true && retrieval.results.length > 0

  if (!exists) {
    const reason = retrieval.ok ? retrieval.reason : retrieval.reason
    const suffix = retrieval.ok === false ? ` (reason: ${reason ?? 'unknown'})` : ''
    return {
      layer: 'zero_tolerance',
      passed: false,
      details: `KRITIČNA GREŠKA: HS kod ${hs8} nije pronađen u Convex korpusu (audit-grade). Klasifikacija blokirana.${suffix}`
    }
  }

  const verificationHash = generateVerificationHash(hs8, Date.now())

  return {
    layer: 'zero_tolerance',
    passed: true,
    details: `HS kod ${hs8} potvrđen kroz Convex korpus. Hash: ${verificationHash}`
  }
}

export async function layerTwoAntiHallucinationValidator(hsCode: string): Promise<ValidationLayerResult> {
  const normalized = normalizeHsCodeInput(hsCode)
  const digits = asDigits(normalized)
  const hs8 = isValidHs8Format(normalized) ? normalized : (digits.length >= 8 ? formatHs8(digits) : normalized)

  if (!isValidHs8Format(hs8)) {
    return {
      layer: 'anti_hallucination',
      passed: false,
      details: 'Kod nije u formatu XXXX.XX.XX',
      trustScore: 0
    }
  }

  // Use corpus evidence density as a conservative proxy for trust.
  const retrieval = await retrieveEvidence(hs8, { limit: 3, include_parent: false })
  const hits = retrieval.ok ? retrieval.results.length : 0

  // Score: 0..100, bounded and monotonic with evidence hits.
  const trustScore = Math.min(100, 40 + hits * 20)
  const passed = trustScore >= 60

  return {
    layer: 'anti_hallucination',
    passed,
    details: passed
      ? `Trust Score: ${trustScore}/100. Pronađeno ${hits} citabilnih dokaza u korpusu.`
      : `Trust Score: ${trustScore}/100 - NIZAK! Potrebna dodatna verifikacija / dopuna opisa.`,
    trustScore
  }
}

export function layerThreeHierarchicalValidator(hsCode: string): ValidationLayerResult {
  const normalized = normalizeHsCodeInput(hsCode)
  const digits = asDigits(normalized)
  if (digits.length < 8) {
    return {
      layer: 'hierarchical',
      passed: false,
      details: 'Hijerarhijska greška: HS kod mora imati najmanje 8 cifara'
    }
  }

  const hs8 = isValidHs8Format(normalized) ? normalized : formatHs8(digits)
  if (!isValidHs8Format(hs8)) {
    return {
      layer: 'hierarchical',
      passed: false,
      details: 'Hijerarhijska greška: format mora biti XXXX.XX.XX'
    }
  }

  const chapter = parseInt(digits.slice(0, 2), 10)
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > 99) {
    return {
      layer: 'hierarchical',
      passed: false,
      details: 'Hijerarhijska greška: poglavlje (prve 2 cifre) nije u opsegu 01–99'
    }
  }

  return {
    layer: 'hierarchical',
    passed: true,
    details: `Hijerarhija validna: Poglavlje ${String(chapter).padStart(2, '0')} → ${hs8}`
  }
}

export async function validateHSCodeMultiLayer(hsCode: string): Promise<{
  allPassed: boolean
  layers: ValidationLayerResult[]
  verificationHash?: string
}> {
  const layer1 = await layerOneZeroToleranceBlocker(hsCode)
  
  if (!layer1.passed) {
    return {
      allPassed: false,
      layers: [layer1]
    }
  }

  const layer2 = await layerTwoAntiHallucinationValidator(hsCode)
  const layer3 = layerThreeHierarchicalValidator(hsCode)

  const allPassed = layer1.passed && layer2.passed && layer3.passed
  
  const verificationHash = allPassed 
    ? generateVerificationHash(hsCode, Date.now())
    : undefined

  return {
    allPassed,
    layers: [layer1, layer2, layer3],
    verificationHash
  }
}

export function calculateDefensibilityScore(
  hsCode: string,
  confidence: string,
  trustScore?: number
): number {
  // No hardcoded demo database: defensibility is based on confidence + (optional) corpus-derived trust.
  // Bounded 1..10.
  let score = 3

  if (confidence === 'high') score += 4
  else if (confidence === 'medium') score += 2

  if (typeof trustScore === 'number') {
    if (trustScore >= 80) score += 3
    else if (trustScore >= 60) score += 2
    else if (trustScore >= 40) score += 1
  }

  // small bump if hsCode looks valid (defensive; should already be validated elsewhere)
  if (isValidHs8Format(hsCode)) score += 1

  return Math.min(10, Math.max(1, score))
}
