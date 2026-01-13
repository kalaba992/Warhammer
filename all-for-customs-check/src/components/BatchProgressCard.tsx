import type { BatchUploadProgress, Language, ScriptVariant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, CheckCircle, XCircle, FileText } from '@phosphor-icons/react'
import { useScriptConverter } from '@/hooks/use-script-converter'
import { cn } from '@/lib/utils'

interface BatchProgressCardProps {
  progress: BatchUploadProgress
  lang: Language
  scriptVariant: ScriptVariant
}

export function BatchProgressCard({
  progress,
  lang,
  scriptVariant
}: BatchProgressCardProps) {
  const TitleDisplay = ({ text }: { text: string }) => {
    const converted = useScriptConverter(text, lang, scriptVariant)
    return <>{converted}</>
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const isComplete = progress.overallProgress >= 100
  const hasErrors = progress.failedFiles > 0

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      isComplete && !hasErrors && "border-accent/50 bg-accent/5",
      hasErrors && "border-warning/50"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle size={24} weight="fill" className="text-accent" />
            ) : (
              <Clock size={24} className="text-primary animate-pulse" />
            )}
            <span><TitleDisplay text="Napredak Obrade" /></span>
          </div>
          <span className="text-3xl font-mono font-bold">{progress.overallProgress}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Progress 
            value={progress.overallProgress} 
            className="h-4"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white drop-shadow-md">
              {progress.completedFiles + progress.failedFiles}/{progress.totalFiles}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText size={16} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground"><TitleDisplay text="Ukupno" /></p>
            </div>
            <p className="text-2xl font-bold">{progress.totalFiles}</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-accent/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle size={16} weight="fill" className="text-accent" />
              <p className="text-xs text-muted-foreground"><TitleDisplay text="Završeno" /></p>
            </div>
            <p className="text-2xl font-bold text-accent">{progress.completedFiles}</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle size={16} weight="fill" className="text-destructive" />
              <p className="text-xs text-muted-foreground"><TitleDisplay text="Greške" /></p>
            </div>
            <p className="text-2xl font-bold text-destructive">{progress.failedFiles}</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground"><TitleDisplay text="Preostalo" /></p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {progress.estimatedTimeRemaining 
                ? formatTime(progress.estimatedTimeRemaining)
                : '-'}
            </p>
          </div>
        </div>

        {progress.currentFile && !isComplete && (
          <Alert className="bg-primary/5 border-primary/30">
            <Clock className="h-4 w-4 text-primary animate-pulse" />
            <AlertDescription>
              <p className="text-xs">
                <span className="font-medium"><TitleDisplay text="Trenutno obrađuje se" />:</span>
              </p>
              <p className="text-xs font-mono mt-1 truncate">{progress.currentFile}</p>
            </AlertDescription>
          </Alert>
        )}

        {isComplete && (
          <Alert className={cn(
            "border-2",
            hasErrors ? "bg-warning/5 border-warning/50" : "bg-accent/5 border-accent/50"
          )}>
            {hasErrors ? (
              <XCircle className="h-4 w-4 text-warning" weight="fill" />
            ) : (
              <CheckCircle className="h-4 w-4 text-accent" weight="fill" />
            )}
            <AlertDescription className="font-medium">
              {hasErrors ? (
                <TitleDisplay text={`Obrada završena sa ${progress.failedFiles} greškama`} />
              ) : (
                <TitleDisplay text="Svi dokumenti uspješno obrađeni!" />
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
