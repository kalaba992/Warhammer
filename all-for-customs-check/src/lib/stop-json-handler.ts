// src/lib/stop-json-handler.ts
// STOP JSON handler za error handling i fallback scenarije

export interface StopJsonResponse {
  contract_version: '1.1'
  lang: 'bs-Latn'
  task_id: string
  time: string
  step: string
  reason: string
  missing_fields?: string[]
  remediation: string
  error_code: string
  details?: Record<string, unknown>
}

export class StopJsonError extends Error {
  response: StopJsonResponse

  constructor(response: StopJsonResponse) {
    super(response.reason)
    this.response = response
    this.name = 'StopJsonError'
  }
}

/**
 * Kreiraj STOP JSON za nedostajuća polja
 */
export function createStopJsonMissingFields(
  taskId: string,
  step: string,
  missingFields: string[]
): StopJsonResponse {
  return {
    contract_version: '1.1',
    lang: 'bs-Latn',
    task_id: taskId,
    time: new Date().toISOString(),
    step,
    reason: 'missing required INPUT_CONTEXT fields',
    missing_fields: missingFields.sort(),
    remediation: `Provide the following missing fields and retry: ${missingFields.join(', ')}`,
    error_code: 'ERR_MISSING_FIELDS',
    details: {
      field_count: missingFields.length
    }
  }
}

/**
 * Kreiraj STOP JSON za validacijske greške
 */
export function createStopJsonValidationError(
  taskId: string,
  step: string,
  fieldName: string,
  reason: string,
  value?: unknown
): StopJsonResponse {
  return {
    contract_version: '1.1',
    lang: 'bs-Latn',
    task_id: taskId,
    time: new Date().toISOString(),
    step,
    reason: `validation error: ${reason}`,
    remediation: `Fix the invalid value for field '${fieldName}' and retry. Expected format documented in contract v1.1.`,
    error_code: 'ERR_VALIDATION_FAILED',
    details: {
      field: fieldName,
      received_value: value,
      validation_reason: reason
    }
  }
}

/**
 * Kreiraj STOP JSON za nedovoljnu pouzdanost
 */
export function createStopJsonLowConfidence(
  taskId: string,
  step: string,
  confidence: number,
  threshold: number,
  hs_candidate?: string
): StopJsonResponse {
  return {
    contract_version: '1.1',
    lang: 'bs-Latn',
    task_id: taskId,
    time: new Date().toISOString(),
    step,
    reason: 'classification confidence below threshold',
    remediation: `Confidence score ${(confidence * 100).toFixed(1)}% is below required ${(threshold * 100).toFixed(1)}%. Provide more detailed product information or escalate to human review.`,
    error_code: 'ERR_LOW_CONFIDENCE',
    details: {
      confidence,
      threshold,
      hs_candidate,
      difference: threshold - confidence
    }
  }
}

/**
 * Kreiraj STOP JSON za nedostajuće legal citate
 */
export function createStopJsonMissingCitations(
  taskId: string,
  step: string,
  requiredMinimumCitations: number = 1
): StopJsonResponse {
  return {
    contract_version: '1.1',
    lang: 'bs-Latn',
    task_id: taskId,
    time: new Date().toISOString(),
    step,
    reason: 'insufficient legal citations for final decision',
    remediation: `Decision must be supported by at least ${requiredMinimumCitations} legal citation(s). Ensure corpus_index contains relevant documents.`,
    error_code: 'ERR_MISSING_CITATIONS',
    details: {
      required: requiredMinimumCitations,
      current: 0
    }
  }
}

/**
 * Kreiraj STOP JSON za halucinacije (non-existent HS codes)
 */
export function createStopJsonHallucination(
  taskId: string,
  step: string,
  hsCode: string,
  reason: string
): StopJsonResponse {
  return {
    contract_version: '1.1',
    lang: 'bs-Latn',
    task_id: taskId,
    time: new Date().toISOString(),
    step,
    reason: 'hallucinated or non-existent HS code',
    remediation: `The HS code ${hsCode} does not exist in TARIC/WCO databases or is not applicable. Use only verified HS codes from corpus_index.`,
    error_code: 'ERR_HALLUCINATION_DETECTED',
    details: {
      invalid_hs_code: hsCode,
      detection_reason: reason
    }
  }
}

/**
 * Kreiraj STOP JSON za 4-eyes review zahtjev
 */
export function createStopJsonRequireFourEyesReview(
  taskId: string,
  step: string,
  reason: string,
  escalationType: 'ambiguous' | 'rare' | 'high_value' | 'mixed_materials'
): StopJsonResponse {
  return {
    contract_version: '1.1',
    lang: 'bs-Latn',
    task_id: taskId,
    time: new Date().toISOString(),
    step,
    reason: 'classification escalated to human review',
    remediation: `Classification case requires 4-eyes review due to: ${reason}. Escalate to admin_users for manual verification.`,
    error_code: 'ERR_ESCALATION_REQUIRED',
    details: {
      escalation_type: escalationType,
      escalation_reason: reason
    }
  }
}

/**
 * Konvertuj STOP JSON u HTTP response
 */
export function stopJsonToHttpResponse(stopJson: StopJsonResponse): {
  status: number
  body: StopJsonResponse
} {
  const statusMap: Record<string, number> = {
    'ERR_MISSING_FIELDS': 400,
    'ERR_VALIDATION_FAILED': 400,
    'ERR_LOW_CONFIDENCE': 422, // Unprocessable Entity
    'ERR_MISSING_CITATIONS': 422,
    'ERR_HALLUCINATION_DETECTED': 422,
    'ERR_ESCALATION_REQUIRED': 202 // Accepted (pending human review)
  }

  const status = statusMap[stopJson.error_code] || 400

  return {
    status,
    body: stopJson
  }
}

/**
 * Loguj STOP JSON za audit trail
 */
export async function logStopJson(
  stopJson: StopJsonResponse,
  logger?: (msg: string, level: string) => Promise<void>
): Promise<void> {
  const logMessage = `[STOP] ${stopJson.error_code} | Task: ${stopJson.task_id} | Step: ${stopJson.step} | Reason: ${stopJson.reason}`
  
  if (logger) {
    await logger(logMessage, 'WARN')
  } else {
    console.warn(logMessage)
  }
}
