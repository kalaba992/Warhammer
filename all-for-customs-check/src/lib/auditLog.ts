import type { AuditLogEntry, AuditActionType } from '@/types'

export class AuditLogger {
  private static instance: AuditLogger
  private currentUser: { id: string; login: string; email: string } | null = null
  private logs: AuditLogEntry[] = []

  private constructor() {
    this.initializeUser()
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  async initializeUser() {
    try {
      // Initialize with system user for now
      this.currentUser = {
        id: 'system',
        login: 'system',
        email: 'system@carinski-asistent.com'
      }
    } catch (error) {
      console.error('Failed to initialize audit logger user:', error)
    }
  }

  async log(
    actionType: AuditActionType,
    messageOrOptions?: string | {
      resourceId?: string
      targetResource?: string
      oldValue?: unknown
      newValue?: unknown
      errorMessage?: string
      metadata?: unknown
      success?: boolean
      actionDescription?: string
    }
  ) {
    // Handle legacy format: log(actionType, message, options)
    // by converting to new format
    let options: {
      resourceId?: string
      targetResource?: string
      oldValue?: unknown
      newValue?: unknown
      errorMessage?: string
      metadata?: unknown
      success?: boolean
      actionDescription?: string
    } = {}

    if (typeof messageOrOptions === 'string') {
      options = { actionDescription: messageOrOptions }
    } else if (messageOrOptions) {
      options = messageOrOptions
    }

    if (!this.currentUser) {
      console.warn('Audit logger: No user initialized')
      return
    }

    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      actionType,
      userId: this.currentUser.id,
      userEmail: this.currentUser.email,
      userLogin: this.currentUser.login,
      actionDescription: (options as { actionDescription?: string }).actionDescription || actionType,
      targetResource: options?.targetResource || 'unknown',
      resourceId: options?.resourceId,
      oldValue: options?.oldValue,
      newValue: options?.newValue,
      errorMessage: options?.errorMessage,
      success: options?.success ?? true,
      metadata: (options?.metadata as Record<string, unknown> | undefined) || {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ipAddress: '127.0.0.1'
    }

    this.logs.push(entry)

    // Keep only last 1000 entries in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000)
    }
  }

  async getLogs(limit = 100): Promise<AuditLogEntry[]> {
    try {
      return this.logs.slice(-limit).reverse()
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error)
      return []
    }
  }

  async getLogsByResource(resourceId: string): Promise<AuditLogEntry[]> {
    try {
      return this.logs.filter(log => log.resourceId === resourceId)
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error)
      return []
    }
  }

  async getLogsByUser(userId: string): Promise<AuditLogEntry[]> {
    try {
      return this.logs.filter(log => log.userId === userId)
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error)
      return []
    }
  }

  async clearLogs() {
    try {
      this.logs = []
      await this.log('DATA_DELETED', {
        targetResource: 'audit-logs',
        actionDescription: 'Audit logs cleared',
        success: true,
      })
    } catch (error) {
      console.error('Failed to clear audit logs:', error)
    }
  }

  async exportLogs(): Promise<string> {
    try {
      const logs = await this.getLogs(1000)
      return JSON.stringify(logs, null, 2)
    } catch (error) {
      console.error('Failed to export audit logs:', error)
      return '[]'
    }
  }
}

export const auditLogger = AuditLogger.getInstance()
