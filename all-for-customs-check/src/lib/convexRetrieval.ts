// src/lib/convexRetrieval.ts
/**
 * Convex Retrieval Client
 * Single entry point for audit-grade evidence retrieval
 * 
 * Flow:
 * 1. retrieveEvidence() → Convex FTS search
 * 2. If ok=false → STOP (no guessing)
 * 3. If ok=true → Extract LLM-ready payload
 */

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

type RetrievalDiagnostics = {
  correlation_id?: string
  http_status?: number
  error_code?: string
  error_message?: string
}

type CorpusDiagnostics = {
  ingestion_reports?: Array<{
    corpus_version: string
    counts: { documents: number; citations: number; chunks: number }
    created_at: string
    source_zip: string
  }>
}

export interface RetrievalResult {
  chunk: {
    chunk_id: string;
    text: string;
    document_id: string;
    section_path: string[];
    article_no?: string;
    paragraph_no?: string;
  };
  citation: {
    citation_id: string;
    snapshot_pointer: string;
    snapshot_hash_sha256: string;
    locator: {
      page_from: number;
      page_to: number;
    };
  };
  document: {
    document_id: string;
    title: string;
    source_url: string;
    jurisdiction: string;
    instrument_type: string;
    effective_from: string;
  };
  parent?: {
    chunk_id: string;
    text: string;
  } | null;
}

export interface RetrievalResponse {
  ok: boolean;
  reason?: 'empty_query' | 'no_hits' | 'no_citable_evidence' | 'retrieval_error';
  tenant_id: string;
  active_corpus_version: string;
  query_variants?: string[];
  results: RetrievalResult[];
  retrieval_diagnostics?: CorpusDiagnostics;
  diagnostics?: RetrievalDiagnostics;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function emptyFailure(
  tenant_id: string,
  reason: RetrievalResponse['reason'] | 'retrieval_error',
  diagnostics?: RetrievalDiagnostics
): RetrievalResponse {
  return {
    ok: false,
    reason,
    tenant_id,
    active_corpus_version: 'unknown',
    results: [],
    diagnostics: {
      ...(diagnostics ?? {}),
      error_code: diagnostics?.error_code ?? (reason === 'retrieval_error' ? 'RETRIEVAL_UNAVAILABLE' : undefined),
    },
  };
}

export interface LLMEvidencePayload {
  text: string;
  citation: {
    page_from: number;
    page_to: number;
    snapshot_pointer: string;
  };
  document: {
    title: string;
    source_url: string;
    jurisdiction: string;
  };
}

/**
 * Retrieve audit-grade evidence from Convex
 */
export async function retrieveEvidence(
  query: string,
  options: {
    tenant_id?: string;
    limit?: number;
    jurisdiction?: string;
    instrument_type?: string;
    language?: string;
    trust_level?: string;
    include_parent?: boolean;
  } = {}
): Promise<RetrievalResponse> {
  const tenant_id = options.tenant_id || 'default';

  // In dev we call Convex directly; require explicit configuration so we don't silently query
  // an unrelated demo deployment (which looks like "no_hits" and is very confusing).
  if (!import.meta.env.PROD && (!CONVEX_URL || !String(CONVEX_URL).trim())) {
    throw new Error('Missing VITE_CONVEX_URL (set it to https://<deployment>.convex.cloud)');
  }

  const endpoint = import.meta.env.PROD ? '/api/retrieveEvidence' : `${CONVEX_URL}/api/query`;

  const payload = import.meta.env.PROD
    ? {
        tenant_id,
        q: query,
        limit: options.limit ?? 8,
        jurisdiction: options.jurisdiction,
        instrument_type: options.instrument_type,
        language: options.language,
        trust_level: options.trust_level,
        include_parent: options.include_parent ?? true,
      }
    : {
        path: 'functions/retrieval:retrieveEvidence',
        args: {
          tenant_id,
          q: query,
          limit: options.limit ?? 8,
          jurisdiction: options.jurisdiction,
          instrument_type: options.instrument_type,
          language: options.language,
          trust_level: options.trust_level,
          include_parent: options.include_parent ?? true,
        },
      };

  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      15000
    );

    const correlation_id = response.headers.get('x-correlation-id') || undefined;

    if (!response.ok) {
      const detailsText = await response.text().catch(() => '');
      if (import.meta.env.PROD) {
        return emptyFailure(tenant_id, 'retrieval_error', {
          correlation_id,
          http_status: response.status,
          error_code: 'RETRIEVE_EVIDENCE_HTTP_ERROR',
          error_message: detailsText || response.statusText,
        });
      }
      throw new Error(`Convex retrieval failed: ${response.status}`);
    }

    const data: unknown = await response.json();

    if (import.meta.env.PROD) {
      if (isRecord(data) && data.ok === true && 'value' in data) {
        const value = data.value as RetrievalResponse;
        return { ...value, diagnostics: { correlation_id, http_status: response.status } };
      }
      if (isRecord(data) && data.ok === false) {
        const err = isRecord(data.error) ? data.error : undefined;
        return emptyFailure(tenant_id, 'retrieval_error', {
          correlation_id,
          http_status: response.status,
          error_code: typeof err?.code === 'string' ? err.code : 'RETRIEVE_EVIDENCE_FAILED',
          error_message: typeof err?.message === 'string' ? err.message : 'retrieveEvidence failed',
        });
      }
      // Unexpected shape
      return emptyFailure(tenant_id, 'retrieval_error', {
        correlation_id,
        http_status: response.status,
        error_code: 'RETRIEVE_EVIDENCE_BAD_SHAPE',
        error_message: 'Unexpected response shape from /api/retrieveEvidence',
      });
    }

    // Dev mode: Convex /api/query shape
    return (isRecord(data) && 'value' in data ? (data.value as RetrievalResponse) : (data as RetrievalResponse));
  } catch (error) {
    if (import.meta.env.PROD) {
      return emptyFailure(tenant_id, 'retrieval_error', {
        error_code: 'RETRIEVE_EVIDENCE_FETCH_FAILED',
        error_message: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}

/**
 * Extract LLM-ready payload from retrieval results
 * Only includes: text + citation page range + snapshot_pointer + document meta
 */
export function extractLLMPayload(results: RetrievalResult[]): LLMEvidencePayload[] {
  return results.map((r) => ({
    text: r.chunk.text,
    citation: {
      page_from: r.citation.locator.page_from,
      page_to: r.citation.locator.page_to,
      snapshot_pointer: r.citation.snapshot_pointer,
    },
    document: {
      title: r.document.title,
      source_url: r.document.source_url,
      jurisdiction: r.document.jurisdiction,
    },
  }));
}

/**
 * Format evidence for LLM prompt context
 */
export function formatEvidenceForLLM(payload: LLMEvidencePayload[]): string {
  if (payload.length === 0) return '';

  return payload
    .map((p, i) => {
      const citation = `[Izvor: ${p.document.title}, str. ${p.citation.page_from}-${p.citation.page_to}]`;
      return `--- Dokaz ${i + 1} ---\n${p.text}\n${citation}`;
    })
    .join('\n\n');
}
