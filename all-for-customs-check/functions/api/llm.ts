export interface Env {
  OPENAI_API_KEY: string
}

interface LlmRequest {
  prompt: string
  stream?: boolean
  model?: string
  /** If set to 'json_object', OpenAI will be asked to return a valid JSON object. */
  responseFormat?: 'text' | 'json_object'
}

type ChatCompletionMessage = { content?: string }
type ChatCompletionChoice = { message?: ChatCompletionMessage }
type ChatCompletionResponse = { choices?: ChatCompletionChoice[] }

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

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const apiKey = (env.OPENAI_API_KEY || '').trim()

    if (!apiKey) {
      return json(
        {
          ok: false,
          correlation_id: correlationId,
          error: {
            code: 'OPENAI_NOT_CONFIGURED',
            message: 'OPENAI_API_KEY is not configured in Cloudflare Pages environment variables'
          }
        },
        { status: 500, headers: { 'x-correlation-id': correlationId } }
      )
    }

    const { prompt, stream = false, model = 'gpt-4o-mini', responseFormat = 'text' } = (await request.json()) as LlmRequest

    if (!prompt || typeof prompt !== 'string') {
      return json(
        {
          ok: false,
          correlation_id: correlationId,
          error: { code: 'INVALID_PROMPT', message: 'Invalid prompt' }
        },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      )
    }

    const started = Date.now()
    const openAiResponse = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: responseFormat === 'json_object' ? 0 : 0.2,
        stream,
        ...(responseFormat === 'json_object' ? { response_format: { type: 'json_object' } } : {})
      })
    }, 15000)

    if (!openAiResponse.ok) {
      const errorBody = await openAiResponse.text()
      return json(
        {
          ok: false,
          correlation_id: correlationId,
          error: {
            code: 'OPENAI_API_ERROR',
            message: 'OpenAI API error'
          },
          upstream: {
            status: openAiResponse.status,
            status_text: openAiResponse.statusText,
            latency_ms: Date.now() - started,
            details: errorBody || ''
          }
        },
        { status: 502, headers: { 'x-correlation-id': correlationId } }
      )
    }

    // Non-streaming mode: return the completion text
    const data: unknown = await openAiResponse.json()
    const parsed =
      typeof data === 'object' && data !== null ? (data as ChatCompletionResponse) : {}
    const completion = Array.isArray(parsed.choices)
      ? parsed.choices[0]?.message?.content ?? ''
      : ''

    return json(
      {
        ok: true,
        correlation_id: correlationId,
        completion,
        upstream: {
          status: openAiResponse.status,
          latency_ms: Date.now() - started
        }
      },
      { status: 200, headers: { 'x-correlation-id': correlationId } }
    )
  } catch (error) {
    console.error('LLM function error:', error)
    const message = error instanceof Error ? error.message : String(error)
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('aborted')

    return json(
      {
        ok: false,
        correlation_id: correlationId,
        error: {
          code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'LLM_FAILED',
          message: isTimeout ? 'OpenAI request timed out' : 'LLM function failed'
        },
        details: message
      },
      { status: isTimeout ? 504 : 500, headers: { 'x-correlation-id': correlationId } }
    )
  }
}
