// src/lib/gdpr-dsr.ts
// Data Subject Rights (DSR) endpoint - GDPR zahtjevi

export interface DataSubjectRightsRequest {
  request_id: string
  data_subject_id: string // korisnikov ID ili email
  request_type: 'access' | 'rectification' | 'deletion' | 'portability' | 'objection' | 'restriction'
  reason?: string
  created_at: string
  tenant_id: string
}

export interface DataAccessResponse {
  request_id: string
  data_subject_id: string
  data: {
    personal_data: Record<string, unknown>
    processing_activities: Array<{
      activity: string
      date: string
      purpose: string
    }>
    third_party_sharing: Array<{
      organization: string
      purpose: string
      date_shared: string
    }>
    retention_period: string
  }
  generated_at: string
  export_format: 'json' | 'csv' | 'pdf'
}

export interface DataRectificationRequest {
  request_id: string
  data_subject_id: string
  field_to_correct: string
  current_value: unknown
  correct_value: unknown
  reason: string
}

export interface DataDeletionRequest {
  request_id: string
  data_subject_id: string
  deletion_type: 'full' | 'partial' // full = svi podaci, partial = samo specifični
  reason: string
  irreversible: boolean // Ako true, briši i logove
  request_type: 'deletion'
  created_at: string
  tenant_id: string
}

export interface DataPortabilityRequest {
  request_id: string
  data_subject_id: string
  format: 'json' | 'csv' | 'xml'
  include_audit_logs: boolean
  include_decisions: boolean
  request_type: 'portability'
  created_at: string
  tenant_id: string
}

export interface DSRResponse {
  request_id: string
  status: 'received' | 'in_progress' | 'completed' | 'denied'
  request_type: DataSubjectRightsRequest['request_type']
  response_deadline: string // ISO 8601
  completion_date?: string // ISO 8601
  details: Record<string, unknown>
  denial_reason?: string
}

/**
 * Pravi DSR zahtjev - 7 dana deadline (GDPR Art. 12)
 */
export function createDSRRequest(
  dataSubjectId: string,
  requestType: DataSubjectRightsRequest['request_type'],
  tenantId: string,
  reason?: string
): DataSubjectRightsRequest {
  return {
    request_id: `DSR_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    data_subject_id: dataSubjectId,
    request_type: requestType,
    reason,
    created_at: new Date().toISOString(),
    tenant_id: tenantId
  }
}

/**
 * Procesuj access request (Right to Access - Art. 15)
 * Deadline: 30 dana (extendable na 60)
 */
export async function processDataAccessRequest(
  request: DataSubjectRightsRequest,
  getUserData: (id: string) => Promise<Record<string, unknown>>,
  getProcessingActivities: (id: string) => Promise<Array<{ activity: string; date: string; purpose: string }>>,
  getThirdParties: (id: string) => Promise<Array<{ organization: string; purpose: string; date_shared: string }>>
): Promise<DataAccessResponse> {
  const userData = await getUserData(request.data_subject_id)
  const activities = await getProcessingActivities(request.data_subject_id)
  const thirdParties = await getThirdParties(request.data_subject_id)

  return {
    request_id: request.request_id,
    data_subject_id: request.data_subject_id,
    data: {
      personal_data: userData,
      processing_activities: activities,
      third_party_sharing: thirdParties,
      retention_period: '24 months (Evidence/Decisions) or 12 months (Audit logs)'
    },
    generated_at: new Date().toISOString(),
    export_format: 'json'
  }
}

/**
 * Procesuj rectification request (Right to Rectification - Art. 16)
 * Deadline: 30 dana
 * Mora biti sa audit trail-om
 */
export async function processDataRectificationRequest(
  request: DataRectificationRequest,
  updateField: (subjectId: string, field: string, value: unknown) => Promise<boolean>
): Promise<DSRResponse> {
  const success = await updateField(
    request.data_subject_id,
    request.field_to_correct,
    request.correct_value
  )

  return {
    request_id: request.request_id,
    status: success ? 'completed' : 'denied',
    request_type: 'rectification',
    response_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: success ? new Date().toISOString() : undefined,
    details: {
      field: request.field_to_correct,
      old_value: request.current_value,
      new_value: request.correct_value,
      reason: request.reason,
      audit_log_created: success
    },
    denial_reason: success ? undefined : 'Unable to update field in system'
  }
}

/**
 * Procesuj deletion request (Right to be Forgotten - Art. 17)
 * Deadline: 30 dana
 * VAŽNO: Ne brisati Evidence/Decisions (legal hold), samo personal data
 */
export async function processDataDeletionRequest(
  request: DataDeletionRequest,
  deletePersonalData: (subjectId: string) => Promise<boolean>,
  anonymizeAuditLogs: (subjectId: string) => Promise<boolean>
): Promise<DSRResponse> {
  const deleted = await deletePersonalData(request.data_subject_id)
  
  let anonymized = true
  if (request.irreversible) {
    anonymized = await anonymizeAuditLogs(request.data_subject_id)
  }

  return {
    request_id: request.request_id,
    status: deleted && anonymized ? 'completed' : 'in_progress',
    request_type: 'deletion',
    response_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: deleted && anonymized ? new Date().toISOString() : undefined,
    details: {
      personal_data_deleted: deleted,
      audit_logs_anonymized: anonymized,
      deletion_type: request.deletion_type,
      retention_exemptions: [
        'Evidence Bundles (legal hold)',
        'Classification Decisions (legal hold)',
        'Audit trail >12 months (immutable)'
      ]
    }
  }
}

/**
 * Procesuj portability request (Right to Data Portability - Art. 20)
 * Deadline: 30 dana
 */
export async function processDataPortabilityRequest(
  request: DataPortabilityRequest,
  getUserData: (id: string) => Promise<Record<string, unknown>>,
  getDecisions: (id: string) => Promise<Array<Record<string, unknown>>>,
  getAuditLogs: (id: string) => Promise<Array<Record<string, unknown>>>
): Promise<DSRResponse> {
  const userData = await getUserData(request.data_subject_id)
  const decisions = request.include_decisions ? await getDecisions(request.data_subject_id) : []
  const auditLogs = request.include_audit_logs ? await getAuditLogs(request.data_subject_id) : []

  const portableData = {
    personal_data: userData,
    decisions: decisions,
    audit_logs: auditLogs
  }

  // Konvertuj u zahtevani format (json/csv/xml)
  let exportedData = ''
  if (request.format === 'json') {
    exportedData = JSON.stringify(portableData, null, 2)
  } else if (request.format === 'csv') {
    // Simplifikovani CSV export
    exportedData = convertToCSV(portableData)
  } else if (request.format === 'xml') {
    exportedData = convertToXML(portableData)
  }

  return {
    request_id: request.request_id,
    status: 'completed',
    request_type: 'portability',
    response_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: new Date().toISOString(),
    details: {
      export_format: request.format,
      data_size_bytes: exportedData.length,
      included_datasets: {
        personal_data: true,
        decisions: request.include_decisions,
        audit_logs: request.include_audit_logs
      }
    }
  }
}

// Helper funkcije za format konverziju
function convertToCSV(data: { personal_data?: Record<string, unknown> }): string {
  // Simplifikovani CSV export
  return 'Format,Value\n' +
    Object.entries(data.personal_data || {})
      .map(([k, v]) => `"${k}","${v}"`)
      .join('\n')
}

function convertToXML(data: { personal_data?: Record<string, unknown> }): string {
  // Simplifikovani XML export
  return '<?xml version="1.0"?>\n<DataExport>\n' +
    Object.entries(data.personal_data || {})
      .map(([k, v]) => `  <Field name="${k}">${v}</Field>`)
      .join('\n') +
    '\n</DataExport>'
}

/**
 * DSR status tracker
 */
export class DSRTracker {
  private requests: Map<string, DSRResponse> = new Map()

  createRequest(
    dataSubjectId: string,
    requestType: DataSubjectRightsRequest['request_type'],
    tenantId: string
  ): DSRResponse {
    const dsr = createDSRRequest(dataSubjectId, requestType, tenantId)
    const response: DSRResponse = {
      request_id: dsr.request_id,
      status: 'received',
      request_type: requestType,
      response_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      details: {
        received_at: dsr.created_at
      }
    }
    this.requests.set(dsr.request_id, response)
    return response
  }

  updateStatus(requestId: string, status: DSRResponse['status']): DSRResponse | null {
    const request = this.requests.get(requestId)
    if (request) {
      request.status = status
      if (status === 'completed') {
        request.completion_date = new Date().toISOString()
      }
      return request
    }
    return null
  }

  getRequest(requestId: string): DSRResponse | null {
    return this.requests.get(requestId) || null
  }
}
