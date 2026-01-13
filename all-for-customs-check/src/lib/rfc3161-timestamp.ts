// src/lib/rfc3161-timestamp.ts
// RFC3161 timestamp integracija za Evidence Bundle
import { randomBytes } from 'crypto'

export interface RFC3161Timestamp {
  tst_info: {
    version: number
    policy: string // TSA policy OID
    message_imprint: {
      hash_algorithm: string
      hash_value: string
    }
    serial_number: string
    gen_time: string // ISO 8601 UTC
    accuracy: {
      seconds?: number
      millis?: number
      micros?: number
    }
    ordering: boolean
    nonce?: string
    tsa: {
      name: string
      url: string
    }
    signature_algorithm: string
  }
  signature: string // Base64 encoded signature
  certificate_chain?: string[] // X.509 certificates
}

// Dummy TSA (Time Stamp Authority) implementacija
// U production-u, koristiti pravi TSA kao DigiCert, Thawte, itd.
const DUMMY_TSA = {
  name: 'Dummy TSA',
  url: 'https://tsa.example.com',
  policy: '1.2.3.4.5' // Dummy OID
}

/**
 * Kreiraj RFC3161 timestamp
 * U production-u, ovo bi trebalo biti poziv na pravi TSA server
 * TSA: http://timestamp.digicert.com
 * TSA: http://timestamp.thawte.com
 * TSA: http://tsa.izenpe.com
 */
export async function createRFC3161Timestamp(
  inputHash: string,
  hashAlgorithm: string = 'SHA256',
  tsaUrl?: string
): Promise<RFC3161Timestamp> {
  // U production-u, ovo bi trebalo biti HTTP POST na TSA server
  // Za sada, kreiraj dummy timestamp sa trenutnim vremenom
  
  const now = new Date()
  const nonce = generateNonce()
  const tsa = tsaUrl
    ? { ...DUMMY_TSA, url: tsaUrl }
    : DUMMY_TSA

  return {
    tst_info: {
      version: 3,
      policy: tsa.policy,
      message_imprint: {
        hash_algorithm: hashAlgorithm,
        hash_value: inputHash
      },
      serial_number: generateSerialNumber(),
      gen_time: now.toISOString(),
      accuracy: {
        seconds: 0,
        millis: now.getMilliseconds(),
        micros: 0
      },
      ordering: false,
      nonce: nonce,
      tsa,
      signature_algorithm: 'sha256WithRSAEncryption'
    },
    signature: generateDummySignature(inputHash),
    certificate_chain: [
      'MIIDXTCCAkWgAwIBAgIJAJc1/Tz/...' // Dummy cert
    ]
  }
}

/**
 * Verifikiraj RFC3161 timestamp
 */
export function verifyRFC3161Timestamp(
  timestamp: RFC3161Timestamp,
  originalHash: string
): boolean {
  // Proveri da li je hash u timestamp-u ista kao original
  if (timestamp.tst_info.message_imprint.hash_value !== originalHash) {
    return false
  }

  // U production-u, verifikiraj X.509 certificate lanac i CRL/OCSP

  return true
}

// Helper: Generate 8-byte nonce
function generateNonce(): string {
  const nonce = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0')
  return nonce
}

// Helper: Generate serial number
function generateSerialNumber(): string {
  return randomBytes(8).toString('hex')
}

// Helper: Generate dummy signature (za testing)
function generateDummySignature(hash: string): string {
  // U production-u, ovo bi trebalo biti stvarni RSA/ECDSA potpis
  const combined = `SIGNATURE_${hash}_${Date.now()}`
  return Buffer.from(combined).toString('base64')
}

/**
 * Integruj RFC3161 timestamp u Evidence Bundle
 */
export interface EvidenceBundleWithTimestamp {
  bundle_id: string
  corpus_version: string
  input_hash: string
  snapshot_pointer: string
  jws: {
    protected: string
    payload: string
    signature: string
    hsm_stub: {
      enabled: boolean
      key_id: string
    }
  }
  rfc3161_timestamp?: RFC3161Timestamp
  created_at: string
  timestamp_issued_at?: string
}

export async function addRFC3161TimestampToBundle(
  bundle: Omit<EvidenceBundleWithTimestamp, 'rfc3161_timestamp' | 'timestamp_issued_at'>,
  tsaUrl?: string
): Promise<EvidenceBundleWithTimestamp> {
  const timestamp = await createRFC3161Timestamp(bundle.input_hash, 'SHA256', tsaUrl)

  return {
    ...bundle,
    rfc3161_timestamp: timestamp,
    timestamp_issued_at: timestamp.tst_info.gen_time
  }
}

/**
 * Produci RFC3161 token (za arhiviranje/dugotrajno čuvanje)
 */
export async function produceRFC3161Token(
  evidenceBundle: EvidenceBundleWithTimestamp
): Promise<string> {
  // DER/ASN.1 encoded RFC3161 TimeStampToken
  // Za sada, kreiraj JSON reprezentaciju
  const token = {
    type: 'TimeStampToken',
    version: '1.0',
    bundle_id: evidenceBundle.bundle_id,
    tst_info: evidenceBundle.rfc3161_timestamp?.tst_info,
    signature: evidenceBundle.rfc3161_timestamp?.signature,
    created_at: evidenceBundle.created_at,
    timestamp_issued_at: evidenceBundle.timestamp_issued_at
  }

  return Buffer.from(JSON.stringify(token)).toString('base64')
}
