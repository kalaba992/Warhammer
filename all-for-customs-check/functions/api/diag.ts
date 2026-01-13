export interface Env {
  OPENAI_API_KEY?: string
  /** Public Convex deployment URL (not a secret). */
  CONVEX_URL?: string
  /** Backward-compatible name (not a secret), may be used in older deployments. */
  VITE_CONVEX_URL?: string
}

type PagesFunction<E = unknown> = (context: { request: Request; env: E }) => Promise<Response>

type DiagResponse =
  | {
      ok: true
      correlation_id: string
      now: string
      env: {
        OPENAI_API_KEY_present: boolean
        CONVEX_URL_present: boolean
        VITE_CONVEX_URL_present: boolean
      }
      openai: {
        reachable: boolean
        status: number | null
        latency_ms: number | null
      }
      convex: {
        reachable: boolean
        status: number | null
        latency_ms: number | null
        tenant_id: string
        tenant_settings?: {
          active_corpus_version: string
          allow_fallback_to_older: boolean
        }
        counts_active?: {
          corpus_version: string
          counts: { documents: number; citations: number; chunks: number }
          source_zip: string | null
          created_at: string | null
        }
        ingestion_reports?: Array<{
          corpus_version: string
          counts: { documents: number; citations: number; chunks: number }
          source_zip: string
          created_at: string
        }>
      }
    }
  | {
      ok: false
      correlation_id: string
      now: string
      error: { code: string; message: string }
    }

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  })
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function probe(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ reachable: boolean; status: number | null; latency_ms: number | null }> {
  const started = Date.now()
  try {
    const res = await fetchWithTimeout(url, init, timeoutMs)
    return { reachable: true, status: res.status, latency_ms: Date.now() - started }
  } catch {
    return { reachable: false, status: null, latency_ms: Date.now() - started }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function convexQuery(
  convexUrl: string,
  body: unknown,
  timeoutMs: number
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetchWithTimeout(
      `${convexUrl}/api/query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      },
      timeoutMs
    )
    if (!res.ok) return { ok: false, error: `HTTP_${res.status}` }
    const data: unknown = await res.json().catch(() => null)
    if (isRecord(data) && 'value' in data) return { ok: true, value: data.value }
    return { ok: false, error: 'BAD_SHAPE' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  const now = new Date().toISOString()

  try {
    const openAiKeyPresent = Boolean((env.OPENAI_API_KEY || '').trim())
    const convexUrl = (env.CONVEX_URL || env.VITE_CONVEX_URL || '').trim()

    const openai = openAiKeyPresent
      ? await probe(
          'https://api.openai.com/v1/models',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${(env.OPENAI_API_KEY || '').trim()}`
            }
          },
          5000
        )
      : { reachable: false, status: null, latency_ms: null }

    const tenant_id = 'default'

    const convexProbe = convexUrl
      ? await probe(
          `${convexUrl}/api/query`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'functions/retrieval:retrieveEvidence', args: { tenant_id, q: 'diag', limit: 1 } })
          },
          5000
        )
      : { reachable: false, status: null, latency_ms: null }

    let tenant_settings:
      | {
          active_corpus_version: string
          allow_fallback_to_older: boolean
        }
      | undefined

    let counts_active:
      | {
          corpus_version: string
          counts: { documents: number; citations: number; chunks: number }
          source_zip: string | null
          created_at: string | null
        }
      | undefined

    let ingestion_reports:
      | Array<{
          corpus_version: string
          counts: { documents: number; citations: number; chunks: number }
          source_zip: string
          created_at: string
        }>
      | undefined

    // If Convex is reachable, fetch structured diagnostics to explain common "no_hits" causes.
    if (convexUrl && convexProbe.reachable) {
      const ts = await convexQuery(
        convexUrl,
        { path: 'functions/tenant_settings:getTenantSettings', args: { tenant_id } },
        4000
      )
      if (ts.ok && isRecord(ts.value)) {
        tenant_settings = {
          active_corpus_version: typeof ts.value.active_corpus_version === 'string' ? ts.value.active_corpus_version : 'unknown',
          allow_fallback_to_older: typeof ts.value.allow_fallback_to_older === 'boolean' ? ts.value.allow_fallback_to_older : false
        }
      }

      const counts = await convexQuery(
        convexUrl,
        { path: 'functions/search:countsByTenant', args: { tenant_id } },
        4000
      )
      if (counts.ok && isRecord(counts.value)) {
        const cts = isRecord(counts.value.counts) ? counts.value.counts : {}
        counts_active = {
          corpus_version: typeof counts.value.corpus_version === 'string' ? counts.value.corpus_version : 'unknown',
          counts: {
            documents: typeof cts.documents === 'number' ? cts.documents : 0,
            citations: typeof cts.citations === 'number' ? cts.citations : 0,
            chunks: typeof cts.chunks === 'number' ? cts.chunks : 0
          },
          source_zip: typeof counts.value.source_zip === 'string' ? counts.value.source_zip : null,
          created_at: typeof counts.value.created_at === 'string' ? counts.value.created_at : null
        }
      }

      const reports = await convexQuery(
        convexUrl,
        { path: 'functions/ingestion_reports:listIngestionReportsByTenant', args: { tenant_id, limit: 12 } },
        4000
      )
      if (reports.ok && Array.isArray(reports.value)) {
        ingestion_reports = reports.value
          .filter(isRecord)
          .map((r) => {
            const cc = isRecord(r.counts) ? r.counts : {}
            return {
              corpus_version: typeof r.corpus_version === 'string' ? r.corpus_version : '',
              counts: {
                documents: typeof cc.documents === 'number' ? cc.documents : 0,
                citations: typeof cc.citations === 'number' ? cc.citations : 0,
                chunks: typeof cc.chunks === 'number' ? cc.chunks : 0
              },
              source_zip: typeof r.source_zip === 'string' ? r.source_zip : '',
              created_at: typeof r.created_at === 'string' ? r.created_at : ''
            }
          })
          .filter((r) => r.corpus_version)
      }
    }

    const body: DiagResponse = {
      ok: true,
      correlation_id: correlationId,
      now,
      env: {
        OPENAI_API_KEY_present: openAiKeyPresent,
        CONVEX_URL_present: Boolean((env.CONVEX_URL || '').trim()),
        VITE_CONVEX_URL_present: Boolean((env.VITE_CONVEX_URL || '').trim())
      },
      openai,
      convex: {
        ...convexProbe,
        tenant_id,
        ...(tenant_settings ? { tenant_settings } : {}),
        ...(counts_active ? { counts_active } : {}),
        ...(ingestion_reports ? { ingestion_reports } : {})
      }
    }

    return json(body, { status: 200, headers: { 'x-correlation-id': correlationId } })
  } catch (error) {
    const body: DiagResponse = {
      ok: false,
      correlation_id: correlationId,
      now,
      error: {
        code: 'DIAG_FAILED',
        message: error instanceof Error ? error.message : String(error)
      }
    }

    return json(body, { status: 500, headers: { 'x-correlation-id': correlationId } })
  }
}
