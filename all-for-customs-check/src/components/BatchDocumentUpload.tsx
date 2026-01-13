import { useState, useRef } from 'react'
import { useKV } from '@/hooks/useKV'
import * as XLSX from '@/lib/xlsx-shim'
import type { Language, ScriptVariant, BatchUploadFile, BatchUploadProgress, ClassificationHistory } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BatchFileCard } from '@/components/BatchFileCard'
import { BatchProgressCard } from '@/components/BatchProgressCard'
import { 
  Upload, 
  X, 
  Play,
  Pause,
  DownloadSimple,
  Trash
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'
import { useScriptConverter } from '@/hooks/use-script-converter'
import { classifyProduct } from '@/lib/aiService'
import { toast } from 'sonner'

interface BatchDocumentUploadProps {
  lang: Language
  scriptVariant: ScriptVariant
  isProcessing: boolean
}

export function BatchDocumentUpload({
  lang,
  scriptVariant,
  isProcessing: externalProcessing
}: BatchDocumentUploadProps) {
  const [files, setFiles] = useState<BatchUploadFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState<BatchUploadProgress | null>(null)
  const [, setHistory] = useKV<ClassificationHistory[]>('classification-history', [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const processingAbortRef = useRef(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    if (selectedFiles.length === 0) return

    const maxFiles = 50
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(applyScriptVariant(`Maksimalan broj fajlova je ${maxFiles}`, lang, scriptVariant))
      return
    }

    const newFiles: BatchUploadFile[] = selectedFiles.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleClearAll = () => {
    if (isProcessing) {
      processingAbortRef.current = true
      setIsProcessing(false)
      setIsPaused(false)
    }
    setFiles([])
    setProgress(null)
  }

  const handleClearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed' && f.status !== 'error'))
  }

  const processFile = async (file: BatchUploadFile): Promise<BatchUploadFile> => {
    if (processingAbortRef.current) {
      throw new Error('Processing aborted')
    }

    const startTime = Date.now()
    
    setFiles(prev => prev.map(f => 
      f.id === file.id 
        ? { ...f, status: 'uploading' as const, progress: 10, startTime } 
        : f
    ))

    await new Promise(resolve => setTimeout(resolve, 300))

    if (processingAbortRef.current) {
      throw new Error('Processing aborted')
    }

    setFiles(prev => prev.map(f => 
      f.id === file.id 
        ? { ...f, status: 'processing' as const, progress: 30 } 
        : f
    ))

    try {
      const text = await readFileAsText(file.file)
      
      if (processingAbortRef.current) {
        throw new Error('Processing aborted')
      }

      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, progress: 50 } 
          : f
      ))

      const classificationText = `Dokument: ${file.file.name}\n\n${text.slice(0, 2000)}`
      const result = await classifyProduct(classificationText, lang)

      if (processingAbortRef.current) {
        throw new Error('Processing aborted')
      }

      const endTime = Date.now()

      const historyEntry: ClassificationHistory = {
        id: `hist-${Date.now()}-${file.id}`,
        productDescription: `[Batch: ${file.file.name}]`,
        result,
        timestamp: Date.now()
      }

      setHistory(currentHistory => [historyEntry, ...(currentHistory || [])])

      return {
        ...file,
        status: 'completed',
        progress: 100,
        result,
        endTime
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage === 'Processing aborted') {
        return {
          ...file,
          status: 'error',
          progress: 0,
          error: applyScriptVariant('Obrada prekinuta', lang, scriptVariant)
        }
      }

      return {
        ...file,
        status: 'error',
        progress: 0,
        error: applyScriptVariant('Greška pri obradi dokumenta', lang, scriptVariant)
      }
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string || '')
      }
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      reader.readAsText(file)
    })
  }

  const handleStartProcessing = async () => {
    if (files.length === 0) return

    processingAbortRef.current = false
    setIsProcessing(true)
    setIsPaused(false)

    const startTime = Date.now()
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error')

    setProgress({
      totalFiles: pendingFiles.length,
      completedFiles: 0,
      failedFiles: 0,
      currentFile: null,
      overallProgress: 0,
      startTime
    })

    for (let i = 0; i < pendingFiles.length; i++) {
      if (processingAbortRef.current) {
        break
      }

      while (isPaused && !processingAbortRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (processingAbortRef.current) {
        break
      }

      const currentFile = pendingFiles[i]

      setProgress(prev => prev ? {
        ...prev,
        currentFile: currentFile.file.name,
        overallProgress: Math.round((i / pendingFiles.length) * 100)
      } : null)

      const processedFile = await processFile(currentFile)

      setFiles(prev => prev.map(f => 
        f.id === processedFile.id ? processedFile : f
      ))

      const completed = processedFile.status === 'completed' ? 1 : 0
      const failed = processedFile.status === 'error' ? 1 : 0

      setProgress(prev => {
        if (!prev) return null
        
        const newCompleted = prev.completedFiles + completed
        const newFailed = prev.failedFiles + failed
        const totalProcessed = newCompleted + newFailed
        const avgTimePerFile = (Date.now() - prev.startTime) / totalProcessed
        const remainingFiles = prev.totalFiles - totalProcessed
        const estimatedTimeRemaining = Math.round((avgTimePerFile * remainingFiles) / 1000)

        return {
          ...prev,
          completedFiles: newCompleted,
          failedFiles: newFailed,
          overallProgress: Math.round(((i + 1) / pendingFiles.length) * 100),
          estimatedTimeRemaining: totalProcessed > 0 ? estimatedTimeRemaining : undefined
        }
      })
    }

    setProgress(prev => prev ? { ...prev, currentFile: null, overallProgress: 100 } : null)
    setIsProcessing(false)
    setIsPaused(false)

    const finalCompleted = files.filter(f => f.status === 'completed').length
    const finalFailed = files.filter(f => f.status === 'error').length

    if (finalCompleted > 0 && !processingAbortRef.current) {
      toast.success(
        applyScriptVariant(
          `Uspješno obrađeno ${finalCompleted} od ${pendingFiles.length} dokumenata`,
          lang,
          scriptVariant
        )
      )
    }

    if (finalFailed > 0) {
      toast.warning(
        applyScriptVariant(
          `${finalFailed} dokumenata nije uspješno obrađeno`,
          lang,
          scriptVariant
        )
      )
    }
  }

  const handlePauseResume = () => {
    setIsPaused(prev => !prev)
  }

  const handleExportResults = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.result)
    
    if (completedFiles.length === 0) {
      toast.error(applyScriptVariant('Nema rezultata za eksport', lang, scriptVariant))
      return
    }

    const exportData = completedFiles.map(f => {
      const processingTime = f.endTime && f.startTime 
        ? `${((f.endTime - f.startTime) / 1000).toFixed(1)}s`
        : 'N/A'
      
      return {
        'Naziv Fajla': f.file.name,
        'HS Kod': f.result!.hsCode,
        'Pouzdanost': f.result!.confidence === 'high' ? 'Visoka' : f.result!.confidence === 'medium' ? 'Srednja' : 'Niska',
        'Defensive Score': `${f.result!.defensibilityScore}/10`,
        'Razlog': f.result!.reasoning ? f.result!.reasoning.join(' | ') : '',
        'Vrijeme Obrade': processingTime,
        'Datum': new Date(f.result!.timestamp).toLocaleString('bs-BA')
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    
    const columnWidths = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 60 },
      { wch: 12 },
      { wch: 20 }
    ]
    worksheet['!cols'] = columnWidths

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!worksheet[cellAddress]) continue
        
        const cell = worksheet[cellAddress]
        if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
          if (R === 0) {
            (cell as XLSX.CellObject).s = {
              font: { bold: true, sz: 11 },
              fill: { fgColor: { rgb: 'E8E8E8' } },
              alignment: { vertical: 'center', horizontal: 'center' }
            }
          } else {
            (cell as XLSX.CellObject).s = {
              alignment: { vertical: 'top', wrapText: true }
            }
          }
        }
      }
    }

    const autoFilterRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(autoFilterRange) }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Rezultati')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
    const fileName = `Carinski-Alat-Batch-Export-${timestamp[0]}-${timestamp[1].substring(0, 8)}.xlsx`
    
    XLSX.writeFile(workbook, fileName)

    toast.success(applyScriptVariant(`Eksportovano ${completedFiles.length} rezultata u Excel`, lang, scriptVariant))
  }

  const TitleDisplay = ({ text }: { text: string }) => {
    const converted = useScriptConverter(text, lang, scriptVariant)
    return <>{converted}</>
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const completedCount = files.filter(f => f.status === 'completed').length
  const errorCount = files.filter(f => f.status === 'error').length

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2">
            <TitleDisplay text="Grupno Učitavanje Dokumenata" />
          </h2>
          <p className="text-muted-foreground text-sm">
            <TitleDisplay text="Učitajte više dokumenata odjednom za automatsku klasifikaciju" />
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle><TitleDisplay text="Dodaj Dokumente" /></CardTitle>
                  <CardDescription>
                    <TitleDisplay text="Izaberite više dokumenata (max 50) za grupnu obradu" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label
                    htmlFor="batch-file-input"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={32} className="mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium"><TitleDisplay text="Kliknite za izbor" /></span>{' '}
                        <TitleDisplay text="ili povucite fajlove ovdje" />
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <TitleDisplay text="PDF, PNG, JPG, ili TXT (max 10MB po fajlu)" />
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      id="batch-file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                      multiple
                      onChange={handleFileSelect}
                      disabled={isProcessing || externalProcessing}
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <TitleDisplay text="Ukupno" />: <span className="font-semibold text-foreground">{files.length}</span>
                        </span>
                        {pendingCount > 0 && (
                          <span className="text-muted-foreground">
                            <TitleDisplay text="Na čekanju" />: <span className="font-semibold text-foreground">{pendingCount}</span>
                          </span>
                        )}
                        {completedCount > 0 && (
                          <span className="text-accent">
                            <TitleDisplay text="Završeno" />: <span className="font-semibold">{completedCount}</span>
                          </span>
                        )}
                        {errorCount > 0 && (
                          <span className="text-destructive">
                            <TitleDisplay text="Greške" />: <span className="font-semibold">{errorCount}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {(completedCount > 0 || errorCount > 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearCompleted}
                            disabled={isProcessing}
                          >
                            <Trash size={16} className="mr-1.5" />
                            <TitleDisplay text="Očisti obrađene" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAll}
                        >
                          <X size={16} className="mr-1.5" />
                          <TitleDisplay text="Očisti sve" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {progress && (
                <BatchProgressCard 
                  progress={progress} 
                  lang={lang} 
                  scriptVariant={scriptVariant} 
                />
              )}

              {files.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle><TitleDisplay text="Fajlovi" /></CardTitle>
                      <div className="flex gap-2">
                        {completedCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportResults}
                            disabled={isProcessing}
                          >
                            <DownloadSimple size={16} className="mr-1.5" />
                            <TitleDisplay text="Eksportuj rezultate" />
                          </Button>
                        )}
                        {!isProcessing && pendingCount > 0 && (
                          <Button
                            onClick={handleStartProcessing}
                            size="sm"
                          >
                            <Play size={16} className="mr-1.5" weight="fill" />
                            <TitleDisplay text="Pokreni obradu" />
                          </Button>
                        )}
                        {isProcessing && (
                          <Button
                            onClick={handlePauseResume}
                            variant={isPaused ? 'default' : 'secondary'}
                            size="sm"
                          >
                            {isPaused ? (
                              <>
                                <Play size={16} className="mr-1.5" weight="fill" />
                                <TitleDisplay text="Nastavi" />
                              </>
                            ) : (
                              <>
                                <Pause size={16} className="mr-1.5" weight="fill" />
                                <TitleDisplay text="Pauziraj" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {files.map((file) => (
                          <BatchFileCard
                            key={file.id}
                            file={file}
                            lang={lang}
                            scriptVariant={scriptVariant}
                            onRemove={handleRemoveFile}
                            canRemove={file.status === 'pending' && !isProcessing}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle><TitleDisplay text="Kako funkcionira grupna obrada" /></CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</div>
                    <p><TitleDisplay text="Izaberite više dokumenata odjednom (do 50 fajlova)" /></p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</div>
                    <p><TitleDisplay text="Sistem obrađuje svaki dokument automatski, jedan po jedan" /></p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</div>
                    <p><TitleDisplay text="Pratite napredak u realnom vremenu sa procenatom završenosti" /></p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">4</div>
                    <p><TitleDisplay text="Pauzirajte ili zaustavite obradu u bilo kom trenutku" /></p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">5</div>
                    <p><TitleDisplay text="Eksportujte sve rezultate u JSON formatu za dalju analizu" /></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
