import type { ClassificationResult } from '@/types'

// Simple blockchain log stub (append-only array)
const blockchainLog: string[] = []

export function logToBlockchain(classification: ClassificationResult) {
  const entry = JSON.stringify({
    hsCode: classification.hsCode,
    timestamp: classification.timestamp,
    verificationHash: classification.verificationHash,
    legalBasis: classification.legalBasis,
    defensibilityScore: classification.defensibilityScore
  })
  blockchainLog.push(entry)
  // In real system, this would be a transaction to a blockchain network
  return entry
}

export function getBlockchainLog() {
  return [...blockchainLog]
}
