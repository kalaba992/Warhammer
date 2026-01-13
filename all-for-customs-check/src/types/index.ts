export type Language = 'ba' | 'en' | 'de' | 'hr' | 'sr' | 'sk' | 'sl' | 'al' | 'mk' | 'fr' | 'es' | 'it'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface HSCode {
  code4Digits: string
  code6Digits: string
  code8Digits: string
  descriptionBa: string
  descriptionEn: string
  descriptionDe?: string
  descriptionHr?: string
  descriptionSr?: string
  chapter: number
  heading: string
  precedentReferences: PrecedentReference[]
  classificationCriteria: ClassificationCriteria
  tariffInfo: TariffInfo
  isActive: boolean
}

export interface PrecedentReference {
  source: 'WCO' | 'TARIC' | 'EU_CURIA' | 'UIO_BIH'
  caseId: string
  bindingLevel: 'mandatory' | 'persuasive' | 'informative'
  date?: string
  url?: string
}

export interface ClassificationCriteria {
  materialComposition?: string
  processingMethod?: string
  endUse?: string
  geographicalOrigin?: string
  packaging?: string
}

export interface TariffInfo {
  dutyRate: string
  vatRate: string
  excise?: string
}

export interface ClassificationResult {
  hsCode: string
  confidence: ConfidenceLevel
  reasoning: string[]
  /** Explicit processing mode for the result. */
  mode: 'AUDIT' | 'FALLBACK'
  /** Short machine-readable explanation for why this result looks the way it does. */
  why: string
  legalBasis: {
    wco?: string
    taric?: string
    euCuria?: string
    uioBih?: string
  }
  defensibilityScore: number
  validationLayers: ValidationLayerResult[]
  timestamp: number
  verificationHash?: string
  diagnostics?: Record<string, unknown>
}

export interface ValidationLayerResult {
  layer: 'zero_tolerance' | 'anti_hallucination' | 'hierarchical'
  passed: boolean
  details: string
  trustScore?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  classification?: ClassificationResult
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface ClassificationHistory {
  id: string
  productDescription: string
  result: ClassificationResult
  userId?: string
  conversationId?: string
  timestamp: number
  isFavorite?: boolean
}

export interface Document {
  id: string
  name: string
  type: string
  uploadedAt: number
  status: 'processing' | 'completed' | 'error'
  extractedText?: string
  classifications?: ClassificationResult[]
}

export interface BatchUploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  result?: ClassificationResult
  error?: string
  startTime?: number
  endTime?: number
}

export interface BatchUploadProgress {
  totalFiles: number
  completedFiles: number
  failedFiles: number
  currentFile: string | null
  overallProgress: number
  startTime: number
  estimatedTimeRemaining?: number
}

export type ScriptVariant = 'latin' | 'cyrillic'

export interface UserPreferences {
  uiLanguage: Language
  hsDescriptionLanguage: Language
  aiCommunicationLanguage: Language
  scriptVariant?: ScriptVariant
}

export interface User {
  id: string
  email: string
  isOwner: boolean
  godModeEnabled: boolean
}

export type AuditActionType = 
  | 'COMMAND_EXECUTED'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'DATA_DELETED'
  | 'CACHE_CLEARED'
  | 'BACKUP_CREATED'
  | 'BACKUP_RESTORED'
  | 'SETTINGS_CHANGED'
  | 'GOD_MODE_TOGGLED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'CLASSIFICATION_CREATED'
  | 'CLASSIFICATION_DELETED'
  | 'CONVERSATION_DELETED'
  | 'SYSTEM_OPTIMIZED'
  | 'ERROR_OCCURRED'

export interface AuditLogEntry {
  id: string
  timestamp: number
  userId: string
  userEmail: string
  userLogin: string
  actionType: AuditActionType
  actionDescription: string
  targetResource?: string
  resourceId?: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export interface AuditLogFilter {
  startDate?: number
  endDate?: number
  userId?: string
  actionTypes?: AuditActionType[]
  success?: boolean
  searchTerm?: string
}
