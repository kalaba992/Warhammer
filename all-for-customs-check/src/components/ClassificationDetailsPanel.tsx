import type { ClassificationResult, HSCode, Language, ScriptVariant } from '@/types'
import { useState } from 'react'
import { logToBlockchain } from '@/lib/blockchainLog'
import { generateVerifiableCredential, type VerifiableCredential } from '@/lib/verifiableCredential'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ShieldCheck,
  CheckCircle,
  Warning,
  XCircle,
  Scales,
  FileText,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { useKV } from '@/hooks/useKV'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

interface ClassificationDetailsPanelProps {
  result: ClassificationResult
  lang: Language
  scriptVariant: ScriptVariant
  expanded?: boolean
  onToggleExpanded?: () => void
}

export function ClassificationDetailsPanel({
  result,
  lang,
  scriptVariant,
  expanded = false,
  onToggleExpanded
}: ClassificationDetailsPanelProps) {
  const [credential, setCredential] = useState<VerifiableCredential | null>(null)
  const [blockchainHash, setBlockchainHash] = useState<string | null>(null)
  const convert = (text: string) => applyScriptVariant(text, lang, scriptVariant)

  const [hsCodeDatabase] = useKV<HSCode[]>('hs-code-database', [])
  const normalizedHsCode = result.hsCode.replace(/\D/g, '')
  const hsCodeData =
    normalizedHsCode.length >= 8
      ? (hsCodeDatabase || []).find((c) => c.code8Digits.replace(/\D/g, '') === normalizedHsCode)
      : undefined

  const diagnostics = isRecord(result.diagnostics) ? result.diagnostics : {}
  const retrieval = isRecord(diagnostics.retrieval) ? diagnostics.retrieval : undefined
  const llm = isRecord(diagnostics.llm) ? diagnostics.llm : undefined

  const correlationId: string | undefined =
    (typeof diagnostics.correlation_id === 'string' ? diagnostics.correlation_id : undefined) ||
    (typeof retrieval?.correlation_id === 'string' ? retrieval.correlation_id : undefined) ||
    (typeof llm?.correlation_id === 'string' ? llm.correlation_id : undefined)

  const retrievalStatus: number | undefined = typeof retrieval?.http_status === 'number' ? retrieval.http_status : undefined
  const llmStatus: number | undefined = typeof llm?.http_status === 'number' ? llm.http_status : undefined

  const scoreSegments = Math.max(0, Math.min(10, Math.round(result.defensibilityScore)))

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-accent bg-accent/10 border-accent'
      case 'medium': return 'text-warning bg-warning/10 border-warning'
      case 'low': return 'text-destructive bg-destructive/10 border-destructive'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="h-4 w-4" weight="fill" />
      case 'medium': return <Warning className="h-4 w-4" weight="fill" />
      case 'low': return <XCircle className="h-4 w-4" weight="fill" />
      default: return null
    }
  }

  const getDefensibilityColor = (score: number) => {
    if (score >= 8) return 'text-accent'
    if (score >= 6) return 'text-warning'
    return 'text-destructive'
  }

  const getDefensibilityGradient = (score: number) => {
    if (score >= 8) return 'from-accent to-accent/50'
    if (score >= 6) return 'from-warning to-warning/50'
    return 'from-destructive to-destructive/50'
  }

  // Blockchain log and credential generation handlers
  const handleBlockchainLog = () => {
    const entry = logToBlockchain(result)
    setBlockchainHash(entry)
  }

  const handleGenerateCredential = () => {
    setCredential(generateVerifiableCredential(result, result.hsCode))
  }

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      expanded ? "shadow-lg" : "shadow-sm"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-mono tracking-wide">
                {result.hsCode}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={cn("gap-1.5", getConfidenceColor(result.confidence))}
              >
                {getConfidenceIcon(result.confidence)}
                {convert(result.confidence === 'high' ? 'Visoka' : 
                         result.confidence === 'medium' ? 'Srednja' : 'Niska')}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {result.mode}
              </Badge>
            </div>

            {(correlationId || retrievalStatus || llmStatus) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {correlationId && (
                  <Badge variant="outline" className="text-xs font-mono">
                    Corr: {correlationId}
                  </Badge>
                )}
                {typeof retrievalStatus === 'number' && (
                  <Badge variant="outline" className="text-xs">
                    retrieveEvidence: {retrievalStatus}
                  </Badge>
                )}
                {typeof llmStatus === 'number' && (
                  <Badge variant="outline" className="text-xs">
                    llm: {llmStatus}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {onToggleExpanded && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggleExpanded}
              className="ml-2"
            >
              {expanded ? <CaretUp className="h-5 w-5" /> : <CaretDown className="h-5 w-5" />}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Scales className="h-4 w-4" />
                {convert('Defensive Score')}
              </span>
              <span className={cn("font-semibold text-lg", getDefensibilityColor(result.defensibilityScore))}>
                {result.defensibilityScore}/10
              </span>
            </div>
            <div className="flex gap-0.5" aria-label={`Defensive score: ${result.defensibilityScore}/10`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-colors',
                    i < scoreSegments ? `bg-gradient-to-r ${getDefensibilityGradient(result.defensibilityScore)}` : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>

          {result.verificationHash && (
            <Badge variant="outline" className="gap-1.5 text-xs font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              {result.verificationHash.slice(0, 8)}
            </Badge>
          )}
          {/* Blockchain log hash prikaz */}
          {blockchainHash && (
            <Badge variant="secondary" className="gap-1.5 text-xs font-mono">
              Blockchain: {blockchainHash.slice(0, 12)}
            </Badge>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <>
          <Separator />
          <CardContent className="pt-6">
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={handleBlockchainLog}>
                Zapiši u blockchain log
              </Button>
              <Button size="sm" variant="outline" onClick={handleGenerateCredential}>
                Generiši W3C credential
              </Button>
            </div>
            {credential && (
              <div className="mb-4 p-2 bg-muted/40 rounded text-xs overflow-x-auto">
                <strong>W3C Credential:</strong>
                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(credential, null, 2)}</pre>
              </div>
            )}
            <Tabs defaultValue="reasoning" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="reasoning">{convert('Obrazloženje')}</TabsTrigger>
                <TabsTrigger value="validation">{convert('Validacija')}</TabsTrigger>
                <TabsTrigger value="legal">{convert('Pravna Osnova')}</TabsTrigger>
                <TabsTrigger value="tariff">{convert('Tarifa')}</TabsTrigger>
              </TabsList>

              <TabsContent value="reasoning" className="space-y-4 mt-4">
                <ScrollArea className="h-[240px] pr-4">
                  <div className="space-y-3">
                    {result.reasoning.map((reason, index) => (
                      <Card key={index} className="border-l-4 border-l-primary bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-relaxed flex-1">
                              {convert(reason)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {result.validationLayers.map((layer, index) => {
                    const layerNames = {
                      zero_tolerance: 'Zero Tolerance Blocker',
                      anti_hallucination: 'Anti-Hallucination Validator',
                      hierarchical: 'Hierarchical Validator'
                    }
                    
                    return (
                      <Card 
                        key={index} 
                        className={cn(
                          "border-l-4",
                          layer.passed 
                            ? "border-l-accent bg-accent/5" 
                            : "border-l-destructive bg-destructive/5"
                        )}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                              layer.passed ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                            )}>
                              {layer.passed 
                                ? <CheckCircle className="h-5 w-5" weight="fill" />
                                : <XCircle className="h-5 w-5" weight="fill" />
                              }
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">
                                  {convert(layerNames[layer.layer])}
                                </h4>
                                {layer.trustScore !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    {convert('Trust')}: {Math.round(layer.trustScore * 100)}%
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {convert(layer.details)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="legal" className="space-y-4 mt-4">
                <div className="grid gap-3">
                  {result.legalBasis.wco && (
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold text-sm">{convert('WCO Referenca')}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {convert(result.legalBasis.wco)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {result.legalBasis.taric && (
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold text-sm">{convert('TARIC Referenca')}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {convert(result.legalBasis.taric)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {result.legalBasis.euCuria && (
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold text-sm">{convert('EU Curia Referenca')}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {convert(result.legalBasis.euCuria)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {result.legalBasis.uioBih && (
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold text-sm">{convert('UIO BiH Referenca')}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {convert(result.legalBasis.uioBih)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {!result.legalBasis.wco && !result.legalBasis.taric && !result.legalBasis.euCuria && !result.legalBasis.uioBih && (
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground text-center">
                          {convert('Nema dostupnih pravnih referenci')}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tariff" className="space-y-4 mt-4">
                {hsCodeData?.tariffInfo ? (
                  <div className="grid gap-3">
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{convert('Carinska Stopa')}</span>
                          <span className="text-lg font-semibold text-primary">
                            {hsCodeData.tariffInfo.dutyRate}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{convert('PDV Stopa')}</span>
                          <span className="text-lg font-semibold text-primary">
                            {hsCodeData.tariffInfo.vatRate}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    {hsCodeData.tariffInfo.excise && (
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{convert('Akciza')}</span>
                            <span className="text-lg font-semibold text-primary">
                              {hsCodeData.tariffInfo.excise}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground text-center">
                        {convert('Tarifne informacije nisu dostupne')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </>
      )}
    </Card>
  )
}
