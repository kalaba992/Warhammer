// src/lib/jws-signer.ts
// JWS ES256 signing sa HSM/KMS stub

import crypto from 'crypto'

export interface JWSHeader {
  alg: 'ES256'
  typ: 'JWT'
  kid?: string // KMS Key ID
}

export interface JWSPayload {
  bundle_id: string
  corpus_version: string
  input_hash: string
  snapshot_pointer: string
  created_at: string
  citations: string[]
  iat: number
  exp: number
}

export interface JWSSignature {
  protected: string // Base64 encoded header
  payload: string // Base64 encoded payload
  signature: string // Base64 encoded signature (DER format)
  hsm_stub: {
    enabled: boolean
    key_id: string
  }
}

// Helper: Base64url encode
function base64urlEncode(data: string | Buffer): string {
  const base64 = typeof data === 'string' 
    ? Buffer.from(data).toString('base64')
    : data.toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Helper: Base64url decode
function base64urlDecode(str: string): Buffer {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64')
}

/**
 * Generiši JWS ES256 potpis
 * U production-u, koristiti pravi HSM/KMS server
 * Za sada, koristi Node crypto sa ECDSA P-256
 */
export function signJWS(
  payload: JWSPayload,
  kmsKeyId: string = 'kms-key-default',
  privateKeyPem?: string
): JWSSignature {
  // Header
  const header: JWSHeader = {
    alg: 'ES256',
    typ: 'JWT',
    kid: kmsKeyId
  }

  // Encode header
  const headerJson = JSON.stringify(header)
  const encodedHeader = base64urlEncode(headerJson)

  // Encode payload
  const payloadJson = JSON.stringify(payload)
  const encodedPayload = base64urlEncode(payloadJson)

  // Create signing input
  const signingInput = `${encodedHeader}.${encodedPayload}`

  // Sign sa ES256 (ECDSA P-256 sa SHA-256)
  // U production-u, ovo bi trebalo biti HSM/KMS poziv
  let signatureB64 = ''
  
  if (privateKeyPem) {
    // Koristi privatni ključ ako je dostupan (za test/dev)
    const signer = crypto.createSign('SHA256')
    signer.update(signingInput)
    const signature = signer.sign(privateKeyPem, 'base64')
    signatureB64 = base64urlEncode(signature)
  } else {
    // HSM/KMS stub: kreiraj dummy potpis
    // U production-u, ovo bi trebalo biti poziv na HSM/KMS
    const hash = crypto.createHash('sha256').update(signingInput).digest()
    signatureB64 = base64urlEncode(hash.toString('base64'))
  }

  return {
    protected: encodedHeader,
    payload: encodedPayload,
    signature: signatureB64,
    hsm_stub: {
      enabled: !privateKeyPem, // Ako nema private key, koristi HSM stub
      key_id: kmsKeyId
    }
  }
}

/**
 * Verifikiraj JWS potpis (za test/audit)
 */
export function verifyJWS(
  jws: JWSSignature,
  publicKeyPem: string
): boolean {
  try {
    const signingInput = `${jws.protected}.${jws.payload}`
    const signature = base64urlDecode(jws.signature)

    const verifier = crypto.createVerify('SHA256')
    verifier.update(signingInput)
    return verifier.verify(publicKeyPem, signature)
  } catch (err) {
    console.error('[JWS] Verification failed:', err)
    return false
  }
}

/**
 * Generiši test key pair (samo za development)
 */
export function generateTestKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  })
  
  const privateKeyPem = privateKey.export({
    format: 'pem',
    type: 'pkcs8'
  }) as string
  
  const publicKeyPem = publicKey.export({
    format: 'pem',
    type: 'spki'
  }) as string

  return { privateKeyPem, publicKeyPem }
}

/**
 * Kreiraj Evidence Bundle sa JWS potpisom
 */
export function createSignedEvidenceBundle(
  bundleId: string,
  corpusVersion: string,
  inputHash: string,
  snapshotPointer: string,
  citationIds: string[],
  kmsKeyId: string = 'kms-key-default',
  privateKeyPem?: string
) {
  const now = Math.floor(Date.now() / 1000)
  
  const payload: JWSPayload = {
    bundle_id: bundleId,
    corpus_version: corpusVersion,
    input_hash: inputHash,
    snapshot_pointer: snapshotPointer,
    created_at: new Date().toISOString(),
    citations: citationIds,
    iat: now,
    exp: now + 24 * 60 * 60 // Valjano 24h
  }

  const jws = signJWS(payload, kmsKeyId, privateKeyPem)

  return {
    bundle_id: bundleId,
    corpus_version: corpusVersion,
    input_hash: inputHash,
    snapshot_pointer: snapshotPointer,
    jws,
    citation_ids: citationIds,
    created_at: new Date().toISOString()
  }
}
