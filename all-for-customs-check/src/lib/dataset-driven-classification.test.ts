// @vitest-environment node
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { ClassificationWorkflow } from './system-integration'

type ExportRow = {
  row: number
  naziv_na_njemackom: string
  prevod_na_bosanski: string
  tarifni_broj: string
  postotak_carine: string
}

type ExportPayload = {
  source: string
  sheet: string
  exported_at: string
  row_count: number
  rows: ExportRow[]
}

function normalizeHs8(input: string): string {
  const raw = (input || '').trim()
  if (!raw) return ''

  // Accept already normalized forms: 1234.56.78
  const dotted = raw.replace(/\s+/g, '')
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dotted)) return dotted

  // Strip all non-digits and try to format 8 digits as XXXX.XX.XX
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`
  }

  // If someone provided a HS10/national code, we intentionally refuse to “leak” it.
  return ''
}

function loadDataset(): ExportPayload {
  const datasetPath = path.resolve(process.cwd(), 'tests/data/napravi-testove.json')
  const text = fs.readFileSync(datasetPath, 'utf8')
  return JSON.parse(text) as ExportPayload
}

describe('Napravi testove dataset export', () => {
  it('loads exported JSON with expected shape', () => {
    const dataset = loadDataset()

    expect(dataset.sheet).toBe('Testovi')
    expect(Array.isArray(dataset.rows)).toBe(true)
    expect(dataset.row_count).toBe(dataset.rows.length)

    // sanity check: this file should be large; if it’s tiny, the export likely failed
    expect(dataset.rows.length).toBeGreaterThan(1000)
  })

  it('does not contain HS10 leaks (only allow HS8 format)', () => {
    const dataset = loadDataset()
    const withTariff = dataset.rows.filter(r => (r.tarifni_broj || '').trim().length > 0)

    // If there are no tariff codes yet, allow this test to be non-blocking by default.
    // Set REQUIRE_TARIFF_CODES=1 to turn this into a hard requirement.
    if (withTariff.length === 0) {
      if (process.env.REQUIRE_TARIFF_CODES === '1') {
        throw new Error(
          'Dataset has 0 filled tariff codes in column "Tarifni broj". Fill the expected HS8 codes or unset REQUIRE_TARIFF_CODES.'
        )
      }
      return
    }

    const bad: Array<{ row: number; tarifni_broj: string }> = []

    for (const r of withTariff) {
      const normalized = normalizeHs8(r.tarifni_broj)
      if (!normalized) bad.push({ row: r.row, tarifni_broj: r.tarifni_broj })
    }

    expect(bad).toEqual([])
  })
})

describe('ClassificationWorkflow dataset-driven checks', () => {
  const dataset = loadDataset()
  const withTariff = dataset.rows
    .map(r => ({ ...r, hs8: normalizeHs8(r.tarifni_broj) }))
    .filter(r => r.hs8.length > 0)

  if (withTariff.length === 0) {
    it.skip('skips workflow checks until Tarifni broj is populated', () => {})
    return
  }

  // Keep this fast by default; set FULL_PIPELINE_DATASET=1 to run all rows with tariff codes.
  const maxRows = process.env.FULL_PIPELINE_DATASET === '1' ? withTariff.length : Math.min(200, withTariff.length)
  const sample = withTariff.slice(0, maxRows)

  it(`returns HS8 and evidence bundle for ${sample.length} rows`, async () => {
    const workflow = new ClassificationWorkflow({
      auditTrailSigningKey: 'test-audit',
      jwtPrivateKey: 'test-private-key',
      jwtPublicKey: 'test-public-key',
      minConfidenceThreshold: 0,
    })

    for (const row of sample) {
      const response = await workflow.classify({
        documentId: `ds-${row.row}`,
        filename: `row-${row.row}.txt`,
        contentHash: `hash-${row.row}`,
        productDescription: row.prevod_na_bosanski || row.naziv_na_njemackom,
        targetHsCode: row.hs8,
        userId: 'test-user',
        userEmail: 'test@example.com',
        userRole: 'tester',
      })

      expect(response.hs_code).toBe(row.hs8)
      expect(response.evidence_bundle.document_id).toBe(`ds-${row.row}`)
      expect(response.evidence_bundle.hs_code).toBe(row.hs8)
      expect(response.evidence_bundle.jws).toBeTruthy()
      expect(response.audit_entry_id).toBeTruthy()
      expect(response.hs_code).toMatch(/^\d{4}\.\d{2}\.\d{2}$/)
    }
  }, 60_000)
})
