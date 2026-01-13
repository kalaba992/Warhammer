import type { ClassificationResult } from '@/types'

export interface VerifiableCredential {
  '@context': string[]
  type: string[]
  issuer: string
  issuanceDate: string
  credentialSubject: {
    hsCode: string
    description: string
    legalBasis: ClassificationResult['legalBasis']
    verificationHash?: string
    timestamp: number
  }
  proof?: {
    type: string
    created: string
    proofPurpose: string
    verificationMethod: string
    jws: string
  }
}

export function generateVerifiableCredential(
  classification: ClassificationResult,
  description: string,
  issuer = 'Carinski-alat'
): VerifiableCredential {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1'
    ],
    type: ['VerifiableCredential', 'HSCodeClassification'],
    issuer,
    issuanceDate: new Date(classification.timestamp).toISOString(),
    credentialSubject: {
      hsCode: classification.hsCode,
      description,
      legalBasis: classification.legalBasis,
      verificationHash: classification.verificationHash,
      timestamp: classification.timestamp
    }
    // proof: ... (stub, real implementation would sign this)
  }
}
