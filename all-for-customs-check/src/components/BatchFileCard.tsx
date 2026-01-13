import { useState } from 'react'
import type { BatchUploadFile, Language, ScriptVariant } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Warning,
  X,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react'
import { useScriptConverter } from '@/hooks/use-script-converter'
import { cn } from '@/lib/utils'

interface BatchFileCardProps {
  file: BatchUploadFile
  lang: Language
  scriptVariant: ScriptVariant
  onRemove?: (fileId: string) => void
  canRemove: boolean
}

export function BatchFileCard({
  file,
  lang,
  scriptVariant,
  onRemove,
  canRemove
}: BatchFileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const TitleDisplay = ({ text }: { text: string }) => {
    const converted = useScriptConverter(text, lang, scriptVariant)
    return <>{converted}</>
  }

  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle size={24} weight="fill" className="text-accent" />
      case 'error':
        return <XCircle size={24} weight="fill" className="text-destructive" />
      case 'processing':
      case 'uploading':
        return <Clock size={24} className="text-warning animate-pulse" />
      default:
        return <FileText size={24} className="text-muted-foreground" />
    }
  }

  const getStatusBadge = () => {
    switch (file.status) {
      case 'completed':
        return <Badge variant="default" className="bg-accent"><TitleDisplay text="Završeno" /></Badge>
      case 'error':
        return <Badge variant="destructive"><TitleDisplay text="Greška" /></Badge>
      case 'processing':
        return <Badge variant="secondary"><TitleDisplay text="Obrađuje se" /></Badge>
      case 'uploading':
        return <Badge variant="secondary"><TitleDisplay text="Učitava se" /></Badge>
      default:
        return <Badge variant="outline"><TitleDisplay text="Na čekanju" /></Badge>
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const processingTime = file.startTime && file.endTime 
    ? file.endTime - file.startTime 
    : file.startTime 
    ? Date.now() - file.startTime 
    : null

  return (
    <Card className={cn(
      "transition-all duration-200",
      file.status === 'completed' && "border-accent/50",
      file.status === 'error' && "border-destructive/50",
      (file.status === 'processing' || file.status === 'uploading') && "border-warning/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024).toFixed(2)} KB
                  </p>
                  {processingTime && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(processingTime)}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                {canRemove && onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(file.id)}
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>

            {(file.status === 'uploading' || file.status === 'processing') && (
              <div className="space-y-1">
                <Progress value={file.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{file.progress}%</p>
              </div>
            )}

            {file.status === 'completed' && file.result && (
              <div className="mt-3">
                <div className="p-3 bg-accent/10 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      HS Kod: <span className="font-mono">{file.result.hsCode}</span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className="text-xs">
                      <TitleDisplay text="Pouzdanost" />: {file.result.confidence}
                    </Badge>
                    <span className="text-muted-foreground">
                      <TitleDisplay text="Odbranivost" />: {file.result.defensibilityScore}/10
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      <div>
                        <p className="text-xs font-semibold mb-1">
                          <TitleDisplay text="Obrazloženje" />:
                        </p>
                        <ul className="space-y-1">
                          {file.result.reasoning.map((reason, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground pl-3">
                              • {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {file.result.legalBasis && Object.keys(file.result.legalBasis).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1">
                            <TitleDisplay text="Pravna osnova" />:
                          </p>
                          <div className="space-y-1">
                            {file.result.legalBasis.wco && (
                              <p className="text-xs text-muted-foreground pl-3">
                                <span className="font-medium">WCO:</span> {file.result.legalBasis.wco}
                              </p>
                            )}
                            {file.result.legalBasis.taric && (
                              <p className="text-xs text-muted-foreground pl-3">
                                <span className="font-medium">TARIC:</span> {file.result.legalBasis.taric}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {file.result.validationLayers && file.result.validationLayers.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1">
                            <TitleDisplay text="Validacija" />:
                          </p>
                          <div className="space-y-1">
                            {file.result.validationLayers.map((layer, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs pl-3">
                                {layer.passed ? (
                                  <CheckCircle size={12} weight="fill" className="text-accent" />
                                ) : (
                                  <XCircle size={12} weight="fill" className="text-destructive" />
                                )}
                                <span className="text-muted-foreground">{layer.layer}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {file.status === 'error' && file.error && (
              <Alert variant="destructive" className="mt-3">
                <Warning className="h-4 w-4" />
                <AlertDescription className="text-xs">{file.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
