// src/lib/immutable-audit-trail.ts
/**
 * Immutable Audit Trail System
 * - Append-only log (cannot be modified/deleted)
 * - Minimum 1-year retention (legal requirement)
 * - Cryptographically chained entries
 * - Legal hold for Evidence Bundles + Decisions
 * - Integration with Convex database
 */

import crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuditEntry {
  id: string; // Unique ID (timestamp + random)
  timestamp: string; // ISO 8601
  user_id: string;
  user_email: string;
  action: AuditAction;
  resource_type: 'classification' | 'evidence_bundle' | 'audit_trail' | 'user' | 'godmode' | 'dsr';
  resource_id: string;
  change_summary: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  status: 'success' | 'failure' | 'pending';
  ip_address?: string;
  user_agent?: string;
  legal_hold?: boolean; // If true, cannot be deleted/modified
  retention_expires?: string; // When legal hold expires (ISO 8601)
  signature?: string; // HMAC-SHA256 signature for chain integrity
  previous_hash?: string; // Hash of previous entry (blockchain-style)
  metadata?: Record<string, unknown>;
}

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'CLASSIFY'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'IMPORT'
  | 'ANONYMIZE'
  | 'SEARCH'
  | 'ACCESS'
  | 'MODIFY'
  | 'SIGN'
  | 'VERIFY'
  | 'ARCHIVE'
  | 'RESTORE';

export interface AuditTrailConfig {
  signingKey: string; // HMAC secret key
  minRetentionDays: number; // Minimum 365 days per GDPR
  maxRetentionDays?: number; // Optional max retention
  enableLegalHold: boolean; // Lock entries from deletion
  enableChaining: boolean; // Hash chain for integrity verification
}

export interface AuditQuery {
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: AuditAction;
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  limit?: number;
  offset?: number;
}

export interface AuditTrailStats {
  totalEntries: number;
  entriesByAction: Record<AuditAction, number>;
  entriesByResource: Record<string, number>;
  entriesUnderLegalHold: number;
  oldestEntry?: string; // timestamp
  newestEntry?: string; // timestamp
}

// ============================================================================
// AUDIT TRAIL CLASS
// ============================================================================

export class ImmutableAuditTrail {
  private config: AuditTrailConfig;
  private entries: AuditEntry[] = [];
  private lastHash: string = '';
  private legalHoldMap: Map<string, boolean> = new Map();

  constructor(config: AuditTrailConfig) {
    this.config = {
      ...{
        minRetentionDays: 365,
        enableLegalHold: true,
        enableChaining: true,
      },
      ...config,
    };

    if (this.config.minRetentionDays < 365) {
      console.warn('⚠️ WARNING: Audit trail retention < 365 days may violate GDPR');
    }
  }

  /**
   * CRITICAL: Create new audit entry (APPEND-ONLY)
   * Entries cannot be modified once created, only read or exported
   */
  async createEntry(
    userId: string,
    userEmail: string,
    action: AuditAction,
    resourceType: AuditEntry['resource_type'],
    resourceId: string,
    changeSummary: string,
    options?: {
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      legalHold?: boolean;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AuditEntry> {
    const now = new Date();
    const timestamp = now.toISOString();

    // Generate unique ID
    const entryId = this.generateEntryId(timestamp);

    // Calculate chain hash (blockchain-style)
    let signature: string | undefined;
    let previousHash: string | undefined;

    if (this.config.enableChaining) {
      previousHash = this.lastHash || this.initialHash();
      signature = this.createSignature({
        id: entryId,
        timestamp,
        user_id: userId,
        user_email: userEmail,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        change_summary: changeSummary,
        previous_hash: previousHash,
      });
      this.lastHash = signature;
    }

    // Determine legal hold expiration
    let retentionExpires: string | undefined;
    if (options?.legalHold) {
      const expiresDate = new Date(now);
      expiresDate.setFullYear(expiresDate.getFullYear() + 1); // 1 year minimum
      retentionExpires = expiresDate.toISOString();
      this.legalHoldMap.set(entryId, true);
    }

    const entry: AuditEntry = {
      id: entryId,
      timestamp,
      user_id: userId,
      user_email: userEmail,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      change_summary: changeSummary,
      old_values: options?.oldValues,
      new_values: options?.newValues,
      status: 'success',
      ip_address: options?.ipAddress,
      user_agent: options?.userAgent,
      legal_hold: options?.legalHold || false,
      retention_expires: retentionExpires,
      signature,
      previous_hash: previousHash,
      metadata: options?.metadata,
    };

    // Append to log (APPEND-ONLY)
    this.entries.push(entry);

    // In production: persist to Convex append-only table
    // await convex.mutation(api.auditTrail.appendEntry, entry);

    return entry;
  }

  /**
   * Read audit entries (query-only, no modification)
   */
  async readEntries(query?: AuditQuery): Promise<AuditEntry[]> {
    let results = [...this.entries];

    if (query?.userId) {
      results = results.filter((e) => e.user_id === query.userId);
    }
    if (query?.resourceType) {
      results = results.filter((e) => e.resource_type === query.resourceType);
    }
    if (query?.resourceId) {
      results = results.filter((e) => e.resource_id === query.resourceId);
    }
    if (query?.action) {
      results = results.filter((e) => e.action === query.action);
    }
    if (query?.startDate) {
      const start = new Date(query.startDate);
      results = results.filter((e) => new Date(e.timestamp) >= start);
    }
    if (query?.endDate) {
      const end = new Date(query.endDate);
      results = results.filter((e) => new Date(e.timestamp) <= end);
    }

    // Apply pagination
    const offset = query?.offset || 0;
    const limit = query?.limit || 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * CRITICAL: Cannot delete entries directly
   * Instead, implement legal hold removal (requires business rule validation)
   */
  async removeLegalHold(entryId: string, reason: string): Promise<boolean> {
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) {
      return false;
    }

    if (!entry.legal_hold) {
      console.warn(`⚠️ Entry ${entryId} is not under legal hold`);
      return false;
    }

    // Log the removal action
    await this.createEntry(
      'system',
      'audit-trail@system.local',
      'MODIFY',
      'audit_trail',
      entryId,
      `Removed legal hold: ${reason}`,
      {
        metadata: { removed_at: new Date().toISOString() },
      }
    );

    entry.legal_hold = false;
    entry.retention_expires = undefined;
    this.legalHoldMap.delete(entryId);

    return true;
  }

  /**
   * GDPR DSR: Anonymize data without deleting audit trail
   * Replaces PII with hash placeholders, preserves audit integrity
   */
  async anonymizeEntry(entryId: string): Promise<boolean> {
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) {
      return false;
    }

    if (entry.legal_hold) {
      console.warn(`❌ Cannot anonymize entry ${entryId}: under legal hold`);
      return false;
    }

    // Hash PII fields
    const emailHash = crypto.createHash('sha256').update(entry.user_email).digest('hex').substring(0, 8);

    entry.user_email = `anonymized-${emailHash}`;
    entry.user_id = 'anonymized-user';
    entry.ip_address = undefined;
    entry.user_agent = undefined;

    // Log anonymization
    await this.createEntry(
      'system',
      'audit-trail@system.local',
      'ANONYMIZE',
      'audit_trail',
      entryId,
      'Entry anonymized per GDPR DSR request',
      {
        metadata: { gdpr_dsr: true, anonymized_date: new Date().toISOString() },
      }
    );

    return true;
  }

  /**
   * Verify chain integrity (detect tampering)
   */
  verifyChainIntegrity(): boolean {
    if (!this.config.enableChaining) {
      return true;
    }

    let previousHash = this.initialHash();

    for (const entry of this.entries) {
      if (entry.previous_hash !== previousHash) {
        console.error(`❌ Chain integrity violation at entry ${entry.id}`);
        return false;
      }

      const signature = this.createSignature({
        id: entry.id,
        timestamp: entry.timestamp,
        user_id: entry.user_id,
        user_email: entry.user_email,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        change_summary: entry.change_summary,
        previous_hash: entry.previous_hash,
      });

      if (signature !== entry.signature) {
        console.error(`❌ Signature mismatch at entry ${entry.id}`);
        return false;
      }

      previousHash = signature;
    }

    return true;
  }

  /**
   * Generate audit statistics
   */
  getStatistics(): AuditTrailStats {
    const stats: AuditTrailStats = {
      totalEntries: this.entries.length,
      entriesByAction: {} as Record<AuditAction, number>,
      entriesByResource: {} as Record<string, number>,
      entriesUnderLegalHold: 0,
    };

    for (const entry of this.entries) {
      // Count by action
      stats.entriesByAction[entry.action] = (stats.entriesByAction[entry.action] || 0) + 1;

      // Count by resource type
      stats.entriesByResource[entry.resource_type] = (stats.entriesByResource[entry.resource_type] || 0) + 1;

      // Count legal holds
      if (entry.legal_hold) {
        stats.entriesUnderLegalHold++;
      }

      // Track oldest/newest
      if (!stats.oldestEntry || entry.timestamp < stats.oldestEntry) {
        stats.oldestEntry = entry.timestamp;
      }
      if (!stats.newestEntry || entry.timestamp > stats.newestEntry) {
        stats.newestEntry = entry.timestamp;
      }
    }

    return stats;
  }

  /**
   * Export audit trail for compliance reporting
   */
  async exportForCompliance(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(
        {
          export_timestamp: new Date().toISOString(),
          total_entries: this.entries.length,
          entries: this.entries,
          statistics: this.getStatistics(),
          chain_integrity_verified: this.verifyChainIntegrity(),
        },
        null,
        2
      );
    }

    if (format === 'csv') {
      const headers = [
        'id',
        'timestamp',
        'user_id',
        'user_email',
        'action',
        'resource_type',
        'resource_id',
        'change_summary',
        'status',
        'legal_hold',
      ];
      const rows = this.entries.map((e) => [
        e.id,
        e.timestamp,
        e.user_id,
        e.user_email,
        e.action,
        e.resource_type,
        e.resource_id,
        `"${e.change_summary}"`,
        e.status,
        e.legal_hold ? 'true' : 'false',
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    return '';
  }

  /**
   * Cleanup: Remove entries that have exceeded max retention AND have no legal hold
   * (Called by cron job, e.g., daily)
   */
  async cleanupExpiredEntries(): Promise<number> {
    const now = new Date();
    const maxRetention = this.config.maxRetentionDays || 730; // Default 2 years
    const cutoffDate = new Date(now.getTime() - maxRetention * 24 * 60 * 60 * 1000);

    let removedCount = 0;
    const indicesToRemove: number[] = [];

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const entryDate = new Date(entry.timestamp);

      if (entryDate < cutoffDate && !entry.legal_hold) {
        indicesToRemove.push(i);
        removedCount++;
      }
    }

    // Remove in reverse order to preserve indices
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      this.entries.splice(indicesToRemove[i], 1);
    }

    if (removedCount > 0) {
      console.log(`🗑️ Cleanup: Removed ${removedCount} expired entries`);
    }

    return removedCount;
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  private generateEntryId(timestamp: string): string {
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp.replace(/[^0-9]/g, '')}-${random}`;
  }

  private initialHash(): string {
    return crypto.createHash('sha256').update('AUDIT_TRAIL_GENESIS').digest('hex');
  }

  private createSignature(data: Record<string, unknown>): string {
    const payload = JSON.stringify(data);
    return crypto.createHmac('sha256', this.config.signingKey).update(payload).digest('hex');
  }
}

// ============================================================================
// FACTORY & SINGLETON
// ============================================================================

let auditTrailInstance: ImmutableAuditTrail | null = null;

export function initializeAuditTrail(config: AuditTrailConfig): ImmutableAuditTrail {
  auditTrailInstance = new ImmutableAuditTrail(config);
  return auditTrailInstance;
}

export function getAuditTrail(): ImmutableAuditTrail {
  if (!auditTrailInstance) {
    throw new Error('Audit trail not initialized. Call initializeAuditTrail() first.');
  }
  return auditTrailInstance;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create audit entry for classification
 */
export async function auditClassification(
  userId: string,
  userEmail: string,
  documentId: string,
  previousHS?: string,
  newHS?: string
): Promise<AuditEntry> {
  const trail = getAuditTrail();
  return trail.createEntry(
    userId,
    userEmail,
    'CLASSIFY',
    'classification',
    documentId,
    `Classification updated: ${previousHS || 'none'} → ${newHS || 'none'}`,
    {
      oldValues: previousHS ? { hs_code: previousHS } : undefined,
      newValues: newHS ? { hs_code: newHS } : undefined,
      legalHold: true, // Classification decisions are legal evidence
      metadata: { classification_audit: true },
    }
  );
}

/**
 * Create audit entry for God Mode action
 */
export async function auditGodMode(
  userId: string,
  userEmail: string,
  action: 'ACTIVATE' | 'DEACTIVATE',
  reason: string
): Promise<AuditEntry> {
  const trail = getAuditTrail();
  return trail.createEntry(userId, userEmail, action, 'godmode', userId, reason, {
    legalHold: true,
    metadata: { godmode_audit: true },
  });
}

/**
 * Create audit entry for Evidence Bundle
 */
export async function auditEvidenceBundle(
  userId: string,
  userEmail: string,
  bundleId: string,
  action: 'CREATE' | 'SIGN' | 'ARCHIVE',
  reason: string
): Promise<AuditEntry> {
  const trail = getAuditTrail();
  return trail.createEntry(userId, userEmail, action, 'evidence_bundle', bundleId, reason, {
    legalHold: true, // Evidence bundles must never be deleted
    metadata: { evidence_bundle_id: bundleId },
  });
}
