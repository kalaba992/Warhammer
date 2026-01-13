import { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

type DiagResult = Record<string, unknown>

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: DiagResult; correlationId?: string }
  | { status: 'error'; message: string; correlationId?: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort('timeout'), timeoutMs)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timeoutId))
}

export function DiagnosticsPanel() {
  const [state, setState] = useState<FetchState>({ status: 'idle' })

  const run = useCallback(async () => {
    setState({ status: 'loading' })
    const correlationId = crypto.randomUUID()

    try {
      const res = await fetchWithTimeout(
        '/api/diag',
        {
          method: 'GET',
          headers: {
            'x-correlation-id': correlationId,
          },
        },
        10000
      )

      const responseCorrelationId = res.headers.get('x-correlation-id') || correlationId
      const text = await res.text().catch(() => '')

      let data: DiagResult = {}
      try {
        data = text ? (JSON.parse(text) as DiagResult) : {}
      } catch {
        data = { ok: false, error: { code: 'BAD_JSON', message: 'Non-JSON response from /api/diag' }, raw: text }
      }

      const dataRecord = isRecord(data) ? data : undefined
      const okFlag = typeof dataRecord?.ok === 'boolean' ? dataRecord.ok : undefined
      const errorObj = isRecord(dataRecord?.error) ? dataRecord.error : undefined

      if (!res.ok || okFlag === false) {
        const message =
          (typeof errorObj?.message === 'string' ? errorObj.message : undefined) ||
          (typeof text === 'string' && text.trim() ? text : `Diagnostics failed (${res.status})`)
        setState({ status: 'error', message, correlationId: responseCorrelationId })
        return
      }

      setState({ status: 'success', data, correlationId: responseCorrelationId })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setState({ status: 'error', message: msg, correlationId })
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostics</CardTitle>
        <CardDescription>Provjera runtime konfiguracije i dostupnosti upstream servisa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button onClick={run} disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Provjeravam…' : 'Run diagnostics'}
          </Button>
        </div>

        {(state.status === 'error' || state.status === 'success') && (
          <>
            <Separator />
            {state.correlationId && (
              <p className="text-xs text-muted-foreground">
                Correlation ID: <span className="font-mono">{state.correlationId}</span>
              </p>
            )}
          </>
        )}

        {state.status === 'error' && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{state.message}</AlertDescription>
          </Alert>
        )}

        {state.status === 'success' && (
          <pre className="text-xs whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3">
            {JSON.stringify(state.data, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
