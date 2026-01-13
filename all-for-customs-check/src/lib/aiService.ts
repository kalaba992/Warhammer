import type { ClassificationResult, ConfidenceLevel, Language } from '@/types'
import { validateHSCodeMultiLayer, calculateDefensibilityScore } from './validation'
import { getCachedClassification, findSimilarClassifications, cacheClassification } from './classificationCache'
import { retrieveEvidence, extractLLMPayload, formatEvidenceForLLM } from './convexRetrieval'

type ClassificationMode = 'AUDIT' | 'FALLBACK'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort('timeout'), timeoutMs)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timeoutId))
}

function stopResult(
  mode: ClassificationMode,
  why: string,
  message: string,
  diagnostics?: Record<string, unknown>
): ClassificationResult {
  return {
    hsCode: 'STOP',
    confidence: 'low' as ConfidenceLevel,
    reasoning: [message],
    mode,
    why,
    legalBasis: {
      wco: 'N/A',
      taric: 'N/A',
    },
    defensibilityScore: 0,
    validationLayers: [],
    timestamp: Date.now(),
    diagnostics,
  }
}

function parseJsonLenient(input: string): unknown {
  const normalized = input.replace(/\uFEFF/g, '').trim()

  // If the model wrapped JSON in a fenced block, extract the fenced payload.
  // (e.g. "Here is the JSON:\n```json\n{...}\n```\n")
  const fenceMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidateText = (fenceMatch?.[1] ?? normalized).trim()

  // Try direct parse first (covers perfect JSON without any extra text).
  try {
    return JSON.parse(candidateText)
  } catch {
    // Fall through to extraction
  }

  const extractFirstJsonFragment = (text: string): string | undefined => {
    const braceIndex = text.indexOf('{')
    const bracketIndex = text.indexOf('[')
    const start =
      braceIndex >= 0 && bracketIndex >= 0
        ? Math.min(braceIndex, bracketIndex)
        : braceIndex >= 0
          ? braceIndex
          : bracketIndex

    if (start < 0) return undefined

    const s = text.slice(start)
    const stack: Array<'{' | '['> = []
    let inString = false
    let quote: '"' | "'" = '"'
    let escaped = false

    for (let i = 0; i < s.length; i++) {
      const ch = s[i]

      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === quote) inString = false
        continue
      }

      if (ch === '"' || ch === "'") {
        inString = true
        quote = ch as '"' | "'"
        continue
      }

      if (ch === '{' || ch === '[') {
        stack.push(ch)
        continue
      }

      if (ch === '}' || ch === ']') {
        const last = stack.pop()
        if (!last) continue
        const expected = last === '{' ? '}' : ']'
        if (ch !== expected) return undefined
        if (stack.length === 0) return s.slice(0, i + 1)
      }
    }

    return undefined
  }

  const jsonFragment = extractFirstJsonFragment(candidateText)
  if (typeof jsonFragment === 'string') return JSON.parse(jsonFragment)

  throw new Error('LLM response is not valid JSON')
}

export async function classifyProduct(
  productDescription: string,
  communicationLanguage: Language = 'ba',
  options?: { mode?: ClassificationMode }
): Promise<ClassificationResult> {
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  const mode: ClassificationMode =
    options?.mode ?? (viteEnv?.VITE_AUDIT_MODE === '1' ? 'AUDIT' : 'FALLBACK')

  const cached = await getCachedClassification(productDescription)
  if (cached) {
    console.log('✅ Using cached classification')
    return cached.result
  }
  
  const similarMatches = await findSimilarClassifications(productDescription, 3)
  if (similarMatches.length > 0 && similarMatches[0].similarity > 0.92) {
    console.log(`✅ Using similar cached classification (${(similarMatches[0].similarity * 100).toFixed(1)}% match)`)
    return similarMatches[0].cached.result
  }

  // ========== CONVEX RETRIEVAL (AUDIT-GRADE) ==========
  // Step 1: Retrieve evidence from Convex SoT
  let evidenceContext = '';
  let retrievalMetadata: { corpus_version?: string; query_variants?: string[] } = {};
  let retrievalStopped = false;
  let retrievalStopReason = '';
  let retrievalDiagnostics: Record<string, unknown> | undefined
  
  try {
    const retrieval = await retrieveEvidence(productDescription, {
      tenant_id: 'default',
      limit: 6,
      include_parent: true,
    });

    if (!retrieval.ok) {
      // STOP: No citable evidence found - return graceful error response
      console.warn(`⚠️ Retrieval STOP: ${retrieval.reason}`);
      retrievalStopped = true;
      retrievalStopReason = retrieval.reason || 'no_hits';
      retrievalDiagnostics = isRecord(retrieval.diagnostics) ? retrieval.diagnostics : undefined
      if (isRecord(retrieval.retrieval_diagnostics)) {
        retrievalDiagnostics = {
          ...(retrievalDiagnostics ?? {}),
          retrieval_diagnostics: retrieval.retrieval_diagnostics,
        }
      }
    } else {
      // Extract LLM-ready payload
      const llmPayload = extractLLMPayload(retrieval.results);
      evidenceContext = formatEvidenceForLLM(llmPayload);
      retrievalMetadata = {
        corpus_version: retrieval.active_corpus_version,
        query_variants: retrieval.query_variants,
      };
      console.log(`✅ Retrieved ${retrieval.results.length} evidence chunks from corpus ${retrieval.active_corpus_version}`);
    }
  } catch (retrievalError) {
    // If retrieval fails, we STOP - no guessing
    console.warn('⚠️ Convex retrieval unavailable:', retrievalError instanceof Error ? retrievalError.message : 'Unknown error');
    retrievalStopped = true;
    retrievalStopReason = 'retrieval_error';
    retrievalDiagnostics = { error: retrievalError instanceof Error ? retrievalError.message : String(retrievalError) }
  }

  // Retrieval STOP behavior depends on the selected mode.
  if (retrievalStopped) {
    const diagnostics = {
      retrieval: {
        reason: retrievalStopReason,
        ...(retrievalDiagnostics ?? {})
      },
    }

    if (mode === 'AUDIT') {
      const base =
        retrievalStopReason === 'no_hits'
          ? 'Nema dovoljno relevantnih podataka u bazi (nema pogodaka) da uradim audit-grade klasifikaciju.'
          : retrievalStopReason === 'no_citable_evidence'
            ? 'Pronađeni su zapisi, ali nemaju citabilne dokaze (hash + stranice), pa ne mogu uraditi audit-grade klasifikaciju.'
            : 'Baza znanja (Convex) trenutno nije dostupna iz aplikacije, pa ne mogu uraditi audit-grade klasifikaciju.'

      const how =
        'Molimo dopunite opis (materijal, upotreba, sastav, porijeklo).\n' +
        'Ako želite pokušati bez dokaza (kontrolisani fallback), pošaljite: FALLBACK: <opis proizvoda>'

      return stopResult(mode, `RETRIEVAL_${retrievalStopReason}`, `${base}\n\n${how}`, diagnostics)
    }

    // FALLBACK: proceed without evidence but be explicit.
    evidenceContext = ''
    retrievalMetadata = {}
  }
  // ====================================================

  const langName = communicationLanguage === 'ba' ? 'Bosanski' : 
                   communicationLanguage === 'en' ? 'English' : 
                   communicationLanguage === 'de' ? 'Deutsch' : 
                   communicationLanguage

  const systemPrompt = `Ti si ekspertni AI sistem za klasifikaciju 8-cifrenih HS kodova za carinsku službu.
${evidenceContext ? `\n\n--- PRAVNA BAZA (Convex SoT, corpus ${retrievalMetadata.corpus_version || 'unknown'}) ---\n${evidenceContext}\n--- KRAJ PRAVNE BAZE ---\n\nKoristi ISKLJUČIVO dokaze iz gornje pravne baze. Ne izmišljaj HS kodove koji nisu podržani dokazima.` : `\n\nNEMA PRAVNE BAZE: Radi u FALLBACK režimu bez citata. Budi konzervativan. Ako nema dovoljno informacija, vrati confidence: "low" i zatraži dopunu opisa.`}

KRITIČNO - NULTA TOLERANCIJA ZA HALUCINACIJE:
- Ne izmišljaj HS kodove.
- Ako nisi dovoljno siguran, vrati confidence: "low" i napiši šta nedostaje (materijal, upotreba, sastav, porijeklo, način izrade).
- Standardi: WCO, TARIC, EU Curia, UIO BiH.

HIJERARHIJA:
1. POGLAVLJE (2 cifre)
2. POZICIJA (4 cifre - format: XXXX)
3. PODPOZICIJA (6 cifara - format: XXXX.XX)
4. NACIONALNI KOD (8 cifara - format: XXXX.XX.XX)

ODGOVOR FORMAT (JSON):
{
  "hsCode": "XXXX.XX.XX",
  "confidence": "high|medium|low",
  "reasoning": ["Primjena GIR pravila 1: Opis u poziciji...", "Materijalni sastav odgovara...", "Krajnja upotreba je..."],
  "legalBasis": {
    "wco": "Objašnjenje WCO standarda",
    "taric": "TARIC klasifikacija i napomene"
  }
}

Koristi jezik: ${langName}`

  const userPrompt = `Klasificiraj sljedeći proizvod i vrati SAMO JSON odgovor:

${productDescription}

Ako nema dovoljno informacija za pouzdanu klasifikaciju, vrati confidence: "low" i reci koje informacije nedostaju.`

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

  try {
    const correlationId = crypto.randomUUID()
    // Prefer backend LLM endpoint (Cloudflare Pages Function) so the OpenAI key stays server-side
    const llmResponse = await fetchWithTimeout(
      '/api/llm',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
        },
        body: JSON.stringify({ prompt: fullPrompt, stream: false, responseFormat: 'json_object' }),
      },
      20000
    )

    const responseCorrelationId = llmResponse.headers.get('x-correlation-id') || correlationId

    // Some deployments/misroutes may return plain-text instead of JSON.
    // Read text once and parse if it looks like JSON.
    const rawBody = await llmResponse.text()
    let llmData: unknown
    try {
      llmData = rawBody ? (JSON.parse(rawBody) as unknown) : {}
    } catch {
      llmData = { completion: rawBody }
    }

    const llmDataRecord = isRecord(llmData) ? llmData : undefined
    const llmOkFlag = typeof llmDataRecord?.ok === 'boolean' ? llmDataRecord.ok : undefined

    if (!llmResponse.ok || llmOkFlag === false) {
      const detailsText = typeof rawBody === 'string' ? rawBody : ''
      const errorObj = isRecord(llmDataRecord?.error) ? llmDataRecord.error : undefined
      const message =
        detailsText.includes('insufficient_quota')
          ? 'OpenAI kvota/billing nije aktivan za ovaj API ključ. Provjeri OpenAI plan/billing ili koristi novi ključ.'
          : (typeof errorObj?.message === 'string' ? errorObj.message : 'LLM servis trenutno nije dostupan. Molimo pokušajte ponovo.')

      return stopResult(
        mode,
        'LLM_UNAVAILABLE',
        message,
        {
          correlation_id: responseCorrelationId,
          llm: {
            http_status: llmResponse.status,
            ...(errorObj ? { error: errorObj } : {})
          },
        }
      )
    }

    const completion = typeof llmDataRecord?.completion === 'string' ? llmDataRecord.completion : undefined
    const aiResponse = completion
      ? completion
      : JSON.stringify({
          hsCode: '0000.00.00',
          classification: 'Unknown',
          confidence: 0.0,
          reasoning: 'LLM service not available - demo mode active'
        })

    let parsed: unknown
    try {
      parsed = typeof aiResponse === 'string' ? parseJsonLenient(aiResponse) : aiResponse
    } catch {
      const preview = typeof aiResponse === 'string' ? aiResponse.slice(0, 200) : String(aiResponse)
      console.warn('⚠️ LLM returned invalid JSON (preview):', preview)
      return stopResult(
        mode,
        'LLM_INVALID_JSON',
        'LLM je vratio nevažeći JSON odgovor. Pokušaj ponovo.',
        { llm_preview: preview }
      )
      throw new Error('LLM je vratio nevažeći JSON odgovor. Pokušaj ponovo.')
    }

    const parsedObj = isRecord(parsed) ? parsed : {}

    let hsCode = typeof parsedObj.hsCode === 'string' ? parsedObj.hsCode : ''
    hsCode = hsCode.replace(/\s/g, '')

    // Guardrail: if the model returns a non-code value (e.g. "low" or placeholders), fail closed
    // with a user-friendly STOP instead of throwing TARIC/validation errors.
    const hsCodeLooksValid = /^\d{4}\.\d{2}\.\d{2}$/.test(hsCode)
    if (!hsCodeLooksValid) {
      const confidenceHint = typeof parsedObj.confidence === 'string' ? parsedObj.confidence : undefined
      const hint =
        confidenceHint === 'low'
          ? 'Opis nije dovoljno specifičan ili nema dovoljno podataka za pouzdanu klasifikaciju.'
          : 'LLM je vratio nevažeći HS kod.'

      return stopResult(
        mode,
        'LLM_BAD_HS_CODE',
        `${hint} Molimo dopunite opis (materijal, namjena, sastav) ili koristite Pretraga/HS Tree View za ručni odabir koda.\n\nVraćena vrijednost hsCode: ${hsCode || '(prazno)'}`,
        {
          llm_returned: {
            hsCode,
            confidence: confidenceHint,
          },
        }
      )
    }

    const validation = await validateHSCodeMultiLayer(hsCode)

    if (!validation.allPassed) {
      const failedLayer = validation.layers.find(l => !l.passed)
      return stopResult(
        mode,
        'VALIDATION_FAILED',
        `VALIDATION FAILED: ${failedLayer?.details || 'Unknown error'}`
      )
    }

    const confidence: ConfidenceLevel =
      typeof parsedObj.confidence === 'string' ? (parsedObj.confidence as ConfidenceLevel) : 'low'
    const trustScore = validation.layers.find(l => l.layer === 'anti_hallucination')?.trustScore

    const defensibilityScore = calculateDefensibilityScore(hsCode, confidence, trustScore)

    const reasoning = Array.isArray(parsedObj.reasoning)
      ? parsedObj.reasoning.map((r) => (typeof r === 'string' ? r : String(r)))
      : [typeof parsedObj.reasoning === 'string' ? parsedObj.reasoning : 'No reasoning provided']

    const evidenceUsed = Boolean(evidenceContext && evidenceContext.trim().length > 0)
    const why: string =
      mode === 'AUDIT'
        ? evidenceUsed
          ? 'AUDIT_EVIDENCE_USED'
          : 'AUDIT_NO_EVIDENCE'
        : evidenceUsed
          ? 'FALLBACK_EVIDENCE_USED'
          : 'FALLBACK_NO_EVIDENCE'

    const result: ClassificationResult = {
      hsCode,
      confidence,
      reasoning,
      mode,
      why,
      legalBasis: isRecord(parsedObj.legalBasis) ? parsedObj.legalBasis : {},
      defensibilityScore,
      validationLayers: validation.layers,
      timestamp: Date.now(),
      verificationHash: validation.verificationHash
    }

    if (hsCode !== 'STOP') {
      await cacheClassification(productDescription, result)
    }

    return result
  } catch (error) {
    console.error('Classification error:', error)

    return stopResult(
      mode,
      'CLASSIFICATION_EXCEPTION',
      error instanceof Error ? error.message : 'Greška u klasifikaciji. Molimo pokušajte ponovo.',
      { error: error instanceof Error ? error.stack || error.message : String(error) }
    )
  }
}

export async function answerClassificationQuestion(
  question: string,
  communicationLanguage: Language = 'ba'
): Promise<string> {
  // ========== CONVEX RETRIEVAL (AUDIT-GRADE) ==========
  let evidenceContext = '';
  let retrievalMetadata: { corpus_version?: string } = {};
  let retrievalStopReason: string | undefined
  
  try {
    const retrieval = await retrieveEvidence(question, {
      tenant_id: 'default',
      limit: 5,
      include_parent: true,
    });

    if (!retrieval.ok) {
      // No citable evidence found: allow "općeniti chat" by proceeding without evidence.
      console.warn(`⚠️ QA Retrieval STOP: ${retrieval.reason}`);
      retrievalStopReason = retrieval.reason || 'no_hits'
      evidenceContext = ''
      retrievalMetadata = { corpus_version: retrieval.active_corpus_version }
      // Continue with a no-evidence prompt (general guidance + clarifying questions)
    } else {
      const llmPayload = extractLLMPayload(retrieval.results);
      evidenceContext = formatEvidenceForLLM(llmPayload);
      retrievalMetadata = { corpus_version: retrieval.active_corpus_version };
      console.log(`✅ QA: Retrieved ${retrieval.results.length} evidence chunks`);
    }
  } catch (retrievalError) {
    const retrievalMessage =
      retrievalError instanceof Error ? retrievalError.message : String(retrievalError);
    console.warn('⚠️ Convex retrieval unavailable for QA:', retrievalMessage);
    retrievalStopReason = retrievalStopReason || 'retrieval_error'
  }
  // ====================================================

  const langName = communicationLanguage === 'ba' ? 'Bosanski' : 
                   communicationLanguage === 'en' ? 'English' : 
                   communicationLanguage === 'de' ? 'Deutsch' : 
                   communicationLanguage

  const systemPrompt = `Ti si ekspertni savjetnik za carinsku klasifikaciju HS kodova.
${evidenceContext ? `\n\n--- PRAVNA BAZA (Convex SoT, corpus ${retrievalMetadata.corpus_version || 'unknown'}) ---\n${evidenceContext}\n--- KRAJ PRAVNE BAZE ---\n\nOdgovaraj ISKLJUČIVO na osnovu dokaza iz gornje pravne baze. Citiraj stranice i izvore.` : `\n\nNEMA PRAVNE BAZE (retrieval: ${retrievalStopReason || 'unavailable'}):\n- Možeš dati općenit, edukativan odgovor i postaviti pitanja za pojašnjenje.\n- Ne izmišljaj citate, članke ili izvore.\n- Ne navodi konkretan 8-cifreni HS kod kao "siguran" bez dokaza; umjesto toga objasni šta treba znati da bi se kod odredio.`}

Odgovaraj na pitanja o:
- Primjeni GIR pravila (Opća pravila za tumačenje)
- Razlikama između HS kodova
- Kriterijima klasifikacije (materijal, obrada, krajnja upotreba)
- Carinskim procedurama i tarifama
- Pravnim precedensima

Koristi profesionalan, ali razumljiv ton.
Jezik komunikacije: ${langName}`

  const fullPrompt = `${systemPrompt}\n\nPitanje: ${question}`

  try {
    const llmResponse = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt, stream: false })
    })

    if (!llmResponse.ok) {
      const details = await llmResponse.text().catch(() => '')
      return details.includes('insufficient_quota')
        ? 'OpenAI kvota/billing nije aktivan za ovaj API ključ. Provjeri OpenAI plan/billing ili koristi novi ključ.'
        : 'LLM servis trenutno nije dostupan. Molimo pokušajte ponovo.'
    }

    // Some deployments/misroutes may return plain-text instead of JSON.
    const rawBody = await llmResponse.text()
    let llmData: unknown
    try {
      llmData = rawBody ? (JSON.parse(rawBody) as unknown) : {}
    } catch {
      llmData = { completion: rawBody }
    }

    const llmDataRecord = isRecord(llmData) ? llmData : undefined
    const completion = typeof llmDataRecord?.completion === 'string' ? llmDataRecord.completion : undefined

    return completion || 'LLM servis nije dostupan. Provjeri /api/llm i konfiguraciju API ključa.'
  } catch (error) {
    console.error('Question answering error:', error)
    return 'Greška u obradi pitanja. Molimo pokušajte ponovo.'
  }
}
