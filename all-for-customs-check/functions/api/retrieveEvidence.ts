export interface Env {
  /** Public Convex deployment URL (not a secret). */
  VITE_CONVEX_URL?: string
  CONVEX_URL?: string
}

interface RetrieveEvidenceArgs {
  tenant_id: string
  q: string
  limit?: number
  jurisdiction?: string
  instrument_type?: string
  language?: string
  trust_level?: string
  include_parent?: boolean
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const convexUrl = (env.CONVEX_URL || env.VITE_CONVEX_URL || '').trim()
    if (!convexUrl) {
      return json(
        {
          ok: false,
          correlation_id: correlationId,
          error: {
            code: 'CONVEX_NOT_CONFIGURED',
            message: 'CONVEX_URL is not configured in Cloudflare Pages environment variables'
          }
        },
        { status: 500, headers: { 'x-correlation-id': correlationId } }
      )
    }

    const args = (await request.json()) as Partial<RetrieveEvidenceArgs>

    if (!args?.q || typeof args.q !== 'string') {
      return json(
        {
          ok: false,
          correlation_id: correlationId,
          error: { code: 'INVALID_QUERY', message: 'Invalid query' }
        },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      )
    }

    const tenant_id = typeof args.tenant_id === 'string' && args.tenant_id.trim() ? args.tenant_id : 'default'

    const started = Date.now()
    const response = await fetchWithTimeout(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'functions/retrieval:retrieveEvidence',
        args: {
          tenant_id,
          q: args.q,
          limit: typeof args.limit === 'number' ? args.limit : undefined,
          jurisdiction: typeof args.jurisdiction === 'string' ? args.jurisdiction : undefined,
          instrument_type: typeof args.instrument_type === 'string' ? args.instrument_type : undefined,
          language: typeof args.language === 'string' ? args.language : undefined,
          trust_level: typeof args.trust_level === 'string' ? args.trust_level : undefined,
          include_parent: typeof args.include_parent === 'boolean' ? args.include_parent : undefined
        }
      })
    }, 15000)

    if (!response.ok) {
      const details = await response.text().catch(() => '')
      return json(
        {
          ok: false,
          correlation_id: correlationId,
          error: { code: 'CONVEX_UPSTREAM_ERROR', message: 'Convex retrieval error' },
          upstream: {
            status: response.status,
            status_text: response.statusText,
            latency_ms: Date.now() - started,
            details: details || ''
          }
        },
        { status: 502, headers: { 'x-correlation-id': correlationId } }
      )
    }

    const data: unknown = await response.json()
    const value = isRecord(data) && 'value' in data ? (data.value as unknown) : data
    return json(
      {
        ok: true,
        correlation_id: correlationId,
        upstream: {
          status: response.status,
          latency_ms: Date.now() - started
        },
        value
      },
      { status: 200, headers: { 'x-correlation-id': correlationId } }
    )
  } catch (error) {
    console.error('retrieveEvidence function error:', error)
    const message = error instanceof Error ? error.message : String(error)
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('aborted')

    return json(
      {
        ok: false,
        correlation_id: correlationId,
        error: {
          code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'RETRIEVE_EVIDENCE_FAILED',
          message: isTimeout ? 'Convex request timed out' : 'retrieveEvidence function failed'
        },
        details: message
      },
      { status: isTimeout ? 504 : 500, headers: { 'x-correlation-id': correlationId } }
    )
  }
}
