import type { ClassificationResult, Language, ScriptVariant } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  ArrowClockwise,
  ShareNetwork,
  Star,
  CopySimple,
  FileText,
  Certificate
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QuickActionsBarProps {
  result: ClassificationResult
  productDescription: string
  lang: Language
  scriptVariant: ScriptVariant
  isFavorite?: boolean
  onReclassify?: () => void
  onTryFallback?: () => void
  onToggleFavorite?: () => void
  className?: string
}

export function QuickActionsBar({
  result,
  productDescription,
  lang,
  scriptVariant,
  isFavorite = false,
  onReclassify,
  onTryFallback,
  onToggleFavorite,
  className
}: QuickActionsBarProps) {
  const convert = (text: string) => applyScriptVariant(text, lang, scriptVariant)

  const handleCopyHSCode = async () => {
    try {
      await navigator.clipboard.writeText(result.hsCode)
      toast.success(convert('HS Kod kopiran u clipboard'))
    } catch {
      toast.error(convert('Greška pri kopiranju'))
    }
  }

  const handleCopyDetails = async () => {
    const details = `
HS Kod: ${result.hsCode}
Opis: ${productDescription}
Pouzdanost: ${result.confidence}
Defensive Score: ${result.defensibilityScore}/10

Obrazloženje:
${result.reasoning.join('\n')}

Pravna Osnova:
${result.legalBasis.wco ? `WCO: ${result.legalBasis.wco}` : ''}
${result.legalBasis.taric ? `TARIC: ${result.legalBasis.taric}` : ''}
${result.legalBasis.euCuria ? `EU Curia: ${result.legalBasis.euCuria}` : ''}
${result.legalBasis.uioBih ? `UIO BiH: ${result.legalBasis.uioBih}` : ''}

Verification Hash: ${result.verificationHash || 'N/A'}
    `.trim()

    try {
      await navigator.clipboard.writeText(details)
      toast.success(convert('Detalji klasifikacije kopirani'))
    } catch {
      toast.error(convert('Greška pri kopiranju'))
    }
  }

  const handleExportCertificate = () => {
    const certificateData = {
      hsCode: result.hsCode,
      productDescription,
      confidence: result.confidence,
      defensibilityScore: result.defensibilityScore,
      reasoning: result.reasoning,
      legalBasis: result.legalBasis,
      timestamp: result.timestamp,
      verificationHash: result.verificationHash
    }

    const jsonString = JSON.stringify(certificateData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Classification-Certificate-${result.hsCode}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(convert('Certifikat preuzet'))
  }

  const handleShare = async () => {
    const shareText = `HS Kod: ${result.hsCode}\n${productDescription}\nPouzdanost: ${result.confidence}\nDefensive Score: ${result.defensibilityScore}/10`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: convert('Carinska Klasifikacija'),
          text: shareText
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await handleCopyDetails()
        }
      }
    } else {
      await handleCopyDetails()
      toast.success(convert('Detalji kopirani - možete ih podijeliti'))
    }
  }

  return (
    <Card className={cn("p-3", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHSCode}
                className="gap-2"
              >
                <CopySimple className="h-4 w-4" />
                <span className="hidden sm:inline">{convert('Kopiraj Kod')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{convert('Kopiraj HS kod u clipboard')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyDetails}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{convert('Kopiraj Sve')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{convert('Kopiraj sve detalje klasifikacije')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCertificate}
                className="gap-2"
              >
                <Certificate className="h-4 w-4" />
                <span className="hidden sm:inline">{convert('Certifikat')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{convert('Preuzmi certifikat klasifikacije (JSON)')}</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8 hidden sm:block" />

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <ShareNetwork className="h-4 w-4" />
                <span className="hidden sm:inline">{convert('Podijeli')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{convert('Podijeli rezultat klasifikacije')}</TooltipContent>
          </Tooltip>

          {onToggleFavorite && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleFavorite}
                  className={cn(
                    "gap-2",
                    isFavorite && "bg-warning/10 text-warning hover:bg-warning/20"
                  )}
                >
                  <Star className="h-4 w-4" weight={isFavorite ? "fill" : "regular"} />
                  <span className="hidden sm:inline">{convert(isFavorite ? 'Omiljeno' : 'Dodaj u Omiljene')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {convert(isFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene')}
              </TooltipContent>
            </Tooltip>
          )}

          {onReclassify && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onReclassify}
                  className="gap-2"
                >
                  <ArrowClockwise className="h-4 w-4" />
                  <span className="hidden sm:inline">{convert('Re-klasificiraj')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{convert('Pokreni novu klasifikaciju sa preciznijim podacima')}</TooltipContent>
            </Tooltip>
          )}

          {onTryFallback && result.mode === 'AUDIT' && result.hsCode === 'STOP' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTryFallback}
                  className="gap-2"
                >
                  <ArrowClockwise className="h-4 w-4" />
                  <span className="hidden sm:inline">{convert('Pokušaj fallback')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {convert('Pokušaj klasifikaciju bez citabilnih dokaza (kontrolisani fallback)')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </Card>
  )
}
