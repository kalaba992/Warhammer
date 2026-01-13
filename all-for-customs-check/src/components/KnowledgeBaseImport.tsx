import { useState } from 'react'
import { useKV } from '@/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  Database, 
  CheckCircle, 
  Warning, 
  XCircle,
  FileText,
  BookOpen,
  Brain,
  CloudArrowUp,
  DownloadSimple
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { applyScriptVariant } from '@/lib/translations'
import type { Language, ScriptVariant, HSCode } from '@/types'
import * as XLSX from '@/lib/xlsx-shim'

type ImportRow = Record<string, unknown>

const getString = (row: ImportRow, key: string): string | undefined => {
  const value = row[key]
  if (value === undefined || value === null) return undefined
  return typeof value === 'string' ? value : String(value)
}

const getNumber = (row: ImportRow, key: string): number | undefined => {
  const value = row[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const getBoolean = (row: ImportRow, key: string): boolean | undefined => {
  const value = row[key]
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.toLowerCase()
    if (['true', '1', 'yes', 'da'].includes(normalized)) return true
    if (['false', '0', 'no', 'ne'].includes(normalized)) return false
  }
  return undefined
}

interface KnowledgeBaseImportProps {
  lang: Language
  scriptVariant: ScriptVariant
}

interface ImportStats {
  total: number
  successful: number
  failed: number
  skipped: number
}

interface ImportResult {
  type: 'hs_codes' | 'precedents' | 'examples' | 'training'
  stats: ImportStats
  errors: string[]
  timestamp: number
}

export function KnowledgeBaseImport({ lang, scriptVariant }: KnowledgeBaseImportProps) {
  const [hsCodeData, setHsCodeData] = useKV<HSCode[]>('hs-code-database', [])
  const [precedentData, setPrecedentData] = useKV<Record<string, unknown>[]>('precedent-database', [])
  const [examplesData, setExamplesData] = useKV<Record<string, unknown>[]>('classification-examples', [])
  const [trainingData, setTrainingData] = useKV<Record<string, unknown>[]>('training-data', [])
  
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [currentImport, setCurrentImport] = useState<string>('')
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [selectedTab, setSelectedTab] = useState<'upload' | 'results' | 'stats'>('upload')

  const downloadTemplate = (type: string) => {
    const templates = {
      hs_codes: {
        headers: ['code4Digits', 'code6Digits', 'code8Digits', 'descriptionBa', 'descriptionEn', 'descriptionDe', 'descriptionHr', 'descriptionSr', 'chapter', 'heading', 'dutyRate', 'vatRate', 'excise', 'materialComposition', 'processingMethod', 'endUse', 'isActive'],
        example: ['1101', '1101.00', '1101.00.10', 'Brašno pšenično', 'Wheat flour', 'Weizenmehl', 'Pšenično brašno', 'Pšenično brašno', '11', '1101', '10%', '17%', '', 'Pšenica mljevena', 'Mljavanje', 'Proizvodnja hljeba', 'true'],
        filename: 'HS_Codes_Template.xlsx'
      },
      precedents: {
        headers: ['hsCode', 'source', 'caseId', 'bindingLevel', 'date', 'url', 'summary', 'fullText'],
        example: ['1101.00.10', 'TARIC', 'TARIC-2024-1101', 'mandatory', '2024-01-15', 'https://example.com', 'Classification of wheat flour', 'Full precedent text here...'],
        filename: 'Precedents_Template.xlsx'
      },
      examples: {
        headers: ['productDescription', 'hsCode', 'confidence', 'reasoning', 'materialComposition', 'processingMethod', 'endUse', 'language'],
        example: ['Bijelo pšenično brašno tip 500', '1101.00.10', 'high', 'Standard wheat flour for bread making', 'Wheat', 'Milling', 'Baking', 'ba'],
        filename: 'Classification_Examples_Template.xlsx'
      },
      training: {
        headers: ['query', 'expectedHsCode', 'context', 'keyTerms', 'alternativeDescriptions', 'commonMistakes', 'validationNotes'],
        example: ['pšenično brašno za hleb', '1101.00.10', 'Standard milled wheat for bread', 'wheat, flour, milling', 'wheat flour, bread flour', 'Confused with rye flour', 'Verify milling process'],
        filename: 'Training_Data_Template.xlsx'
      }
    }

    const template = templates[type as keyof typeof templates]
    if (!template) return

    const ws = XLSX.utils.aoa_to_sheet([template.headers, template.example])
    
    const wscols = template.headers.map(() => ({ wch: 20 }))
    ws['!cols'] = wscols

    template.headers.forEach((_, idx) => {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: idx })]
      if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
        ;(cell as XLSX.CellObject).s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } },
          alignment: { horizontal: "center" }
        }
      }
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, template.filename)

    toast.success(applyScriptVariant('Šablon preuzet uspješno', lang, scriptVariant))
  }

  const handleFileUpload = async (file: File, type: 'hs_codes' | 'precedents' | 'examples' | 'training') => {
    setIsImporting(true)
    setImportProgress(0)
    setCurrentImport(file.name)

    try {
      const reader = new FileReader()

      const teardown = () => {
        setIsImporting(false)
      }
      
      reader.onload = async (e) => {
        try {
          setImportProgress(10)
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
          const jsonData: ImportRow[] = Array.isArray(rawData)
            ? rawData.map(row => (typeof row === 'object' && row !== null ? row as ImportRow : {}))
            : []

          setImportProgress(25)

          const stats: ImportStats = {
            total: jsonData.length,
            successful: 0,
            failed: 0,
            skipped: 0
          }
          const errors: string[] = []

          setImportProgress(50)

          switch (type) {
            case 'hs_codes':
              await importHSCodes(jsonData, stats, errors)
              break
            case 'precedents':
              await importPrecedents(jsonData, stats, errors)
              break
            case 'examples':
              await importExamples(jsonData, stats, errors)
              break
            case 'training':
              await importTraining(jsonData, stats, errors)
              break
          }

          setImportProgress(100)

          const result: ImportResult = {
            type,
            stats,
            errors,
            timestamp: Date.now()
          }

          setImportResults(prev => [result, ...prev])
          setSelectedTab('results')

          toast.success(
            applyScriptVariant(
              `Import završen: ${stats.successful} uspješno, ${stats.failed} neuspješno`,
              lang,
              scriptVariant
            )
          )
        } catch (error) {
          console.error('Import parsing error:', error)
          toast.error(applyScriptVariant('Greška pri parsiranju fajla', lang, scriptVariant))
        } finally {
          teardown()
        }
      }

      reader.onerror = () => {
        toast.error(applyScriptVariant('Greška pri čitanju fajla', lang, scriptVariant))
        teardown()
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('File read error:', error)
      toast.error(applyScriptVariant('Greška pri čitanju fajla', lang, scriptVariant))
    }
  }

  const importHSCodes = async (data: ImportRow[], stats: ImportStats, errors: string[]) => {
    const validCodes: HSCode[] = []
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      try {
        const code8Digits = getString(row, 'code8Digits')
        const descriptionBa = getString(row, 'descriptionBa')
        const descriptionEn = getString(row, 'descriptionEn')

        if (!code8Digits || !descriptionBa || !descriptionEn) {
          stats.skipped++
          errors.push(`Row ${i + 2}: Missing required fields`)
          continue
        }

        const hsCode: HSCode = {
          code4Digits: getString(row, 'code4Digits') || code8Digits.substring(0, 4),
          code6Digits: getString(row, 'code6Digits') || code8Digits.substring(0, 6),
          code8Digits,
          descriptionBa,
          descriptionEn,
          descriptionDe: getString(row, 'descriptionDe') || '',
          descriptionHr: getString(row, 'descriptionHr') || '',
          descriptionSr: getString(row, 'descriptionSr') || '',
          chapter: getNumber(row, 'chapter') || parseInt(code8Digits.substring(0, 2), 10),
          heading: getString(row, 'heading') || code8Digits.substring(0, 4),
          precedentReferences: [],
          classificationCriteria: {
            materialComposition: getString(row, 'materialComposition') || undefined,
            processingMethod: getString(row, 'processingMethod') || undefined,
            endUse: getString(row, 'endUse') || undefined
          },
          tariffInfo: {
            dutyRate: getString(row, 'dutyRate') || '0%',
            vatRate: getString(row, 'vatRate') || '17%',
            excise: getString(row, 'excise') || undefined
          },
          isActive: getBoolean(row, 'isActive') ?? true
        }

        validCodes.push(hsCode)
        stats.successful++
      } catch (error) {
        stats.failed++
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`)
      }
    }

    if (validCodes.length > 0) {
      const existingCodes = new Set((hsCodeData || []).map(c => c.code8Digits))
      const newCodes = validCodes.filter(c => !existingCodes.has(c.code8Digits))
      setHsCodeData([...(hsCodeData || []), ...newCodes])
    }
  }

  const importPrecedents = async (data: ImportRow[], stats: ImportStats, errors: string[]) => {
    const validPrecedents: Record<string, unknown>[] = []
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      try {
        const hsCode = getString(row, 'hsCode')
        const caseId = getString(row, 'caseId')
        const source = getString(row, 'source')

        if (!hsCode || !caseId || !source) {
          stats.skipped++
          errors.push(`Row ${i + 2}: Missing required fields`)
          continue
        }

        const precedent = {
          id: `prec-${Date.now()}-${i}`,
          hsCode,
          source,
          caseId,
          bindingLevel: getString(row, 'bindingLevel') || 'informative',
          date: getString(row, 'date') || '',
          url: getString(row, 'url') || '',
          summary: getString(row, 'summary') || '',
          fullText: getString(row, 'fullText') || '',
          createdAt: Date.now()
        }

        validPrecedents.push(precedent)
        stats.successful++
      } catch (error) {
        stats.failed++
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`)
      }
    }

    if (validPrecedents.length > 0) {
      setPrecedentData([...(precedentData || []), ...validPrecedents])
    }
  }

  const importExamples = async (data: ImportRow[], stats: ImportStats, errors: string[]) => {
    const validExamples: Record<string, unknown>[] = []
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      try {
        const productDescription = getString(row, 'productDescription')
        const hsCode = getString(row, 'hsCode')

        if (!productDescription || !hsCode) {
          stats.skipped++
          errors.push(`Row ${i + 2}: Missing required fields`)
          continue
        }

        const example = {
          id: `ex-${Date.now()}-${i}`,
          productDescription,
          hsCode,
          confidence: getString(row, 'confidence') || 'high',
          reasoning: getString(row, 'reasoning') || '',
          materialComposition: getString(row, 'materialComposition') || '',
          processingMethod: getString(row, 'processingMethod') || '',
          endUse: getString(row, 'endUse') || '',
          language: getString(row, 'language') || 'ba',
          createdAt: Date.now()
        }

        validExamples.push(example)
        stats.successful++
      } catch (error) {
        stats.failed++
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`)
      }
    }

    if (validExamples.length > 0) {
      setExamplesData([...(examplesData || []), ...validExamples])
    }
  }

  const importTraining = async (data: ImportRow[], stats: ImportStats, errors: string[]) => {
    const validTraining: Record<string, unknown>[] = []
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      try {
        const query = getString(row, 'query')
        const expectedHsCode = getString(row, 'expectedHsCode')

        if (!query || !expectedHsCode) {
          stats.skipped++
          errors.push(`Row ${i + 2}: Missing required fields`)
          continue
        }

        const keyTermsRaw = getString(row, 'keyTerms')
        const altDescriptionsRaw = getString(row, 'alternativeDescriptions')

        const training = {
          id: `train-${Date.now()}-${i}`,
          query,
          expectedHsCode,
          context: getString(row, 'context') || '',
          keyTerms: keyTermsRaw ? keyTermsRaw.split(',').map((t: string) => t.trim()) : [],
          alternativeDescriptions: altDescriptionsRaw ? altDescriptionsRaw.split(',').map((d: string) => d.trim()) : [],
          commonMistakes: getString(row, 'commonMistakes') || '',
          validationNotes: getString(row, 'validationNotes') || '',
          createdAt: Date.now()
        }

        validTraining.push(training)
        stats.successful++
      } catch (error) {
        stats.failed++
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`)
      }
    }

    if (validTraining.length > 0) {
      setTrainingData([...(trainingData || []), ...validTraining])
    }
  }

  const getDatabaseStats = () => {
    return {
      hsCodes: hsCodeData?.length || 0,
      precedents: precedentData?.length || 0,
      examples: examplesData?.length || 0,
      training: trainingData?.length || 0
    }
  }

  const stats = getDatabaseStats()

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold">
            {applyScriptVariant('Baza Znanja - Import', lang, scriptVariant)}
          </h2>
          <p className="text-muted-foreground mt-1">
            {applyScriptVariant('Uvoz velikih količina podataka u bazu znanja sistema', lang, scriptVariant)}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                HS Kodovi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hsCodes}</div>
              <p className="text-xs text-muted-foreground">ukupno u bazi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" />
                Presedani
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.precedents}</div>
              <p className="text-xs text-muted-foreground">pravni presedani</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-warning" />
                Primjeri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.examples}</div>
              <p className="text-xs text-muted-foreground">primjeri klasifikacija</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-destructive" />
                Trening Podaci
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.training}</div>
              <p className="text-xs text-muted-foreground">trening setovi</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'upload' | 'results' | 'stats')} className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Uvoz Podataka
            </TabsTrigger>
            <TabsTrigger value="results">
              <CheckCircle className="h-4 w-4 mr-2" />
              Rezultati ({importResults.length})
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Database className="h-4 w-4 mr-2" />
              Statistika
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Alert>
              <CloudArrowUp className="h-4 w-4" />
              <AlertDescription>
                {applyScriptVariant(
                  'Preuzmite šablone u Excel formatu, popunite ih podacima i uvezite. Podržani su HS kodovi, pravni presedani, primjeri klasifikacija i trening podaci.',
                  lang,
                  scriptVariant
                )}
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    HS Kodovi
                  </CardTitle>
                  <CardDescription>
                    Uvoz HS kodova sa opisima, tarifnim informacijama i kriterijima
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => downloadTemplate('hs_codes')}
                  >
                    <DownloadSimple className="h-4 w-4 mr-2" />
                    Preuzmi Šablon
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'hs_codes')
                      }}
                      className="hidden"
                      id="hs-codes-upload"
                      disabled={isImporting}
                    />
                    <label htmlFor="hs-codes-upload">
                      <Button
                        variant="default"
                        className="w-full"
                        disabled={isImporting}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Uvezi HS Kodove
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    Pravni Presedani
                  </CardTitle>
                  <CardDescription>
                    Uvoz pravnih presedana iz TARIC, WCO, EU Curia izvora
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => downloadTemplate('precedents')}
                  >
                    <DownloadSimple className="h-4 w-4 mr-2" />
                    Preuzmi Šablon
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'precedents')
                      }}
                      className="hidden"
                      id="precedents-upload"
                      disabled={isImporting}
                    />
                    <label htmlFor="precedents-upload">
                      <Button
                        variant="default"
                        className="w-full"
                        disabled={isImporting}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Uvezi Presedane
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-warning" />
                    Primjeri Klasifikacija
                  </CardTitle>
                  <CardDescription>
                    Uvoz primjera klasifikacija sa obrazloženjima
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => downloadTemplate('examples')}
                  >
                    <DownloadSimple className="h-4 w-4 mr-2" />
                    Preuzmi Šablon
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'examples')
                      }}
                      className="hidden"
                      id="examples-upload"
                      disabled={isImporting}
                    />
                    <label htmlFor="examples-upload">
                      <Button
                        variant="default"
                        className="w-full"
                        disabled={isImporting}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Uvezi Primjere
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-destructive" />
                    Trening Podaci
                  </CardTitle>
                  <CardDescription>
                    Uvoz podataka za trening AI modela
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => downloadTemplate('training')}
                  >
                    <DownloadSimple className="h-4 w-4 mr-2" />
                    Preuzmi Šablon
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'training')
                      }}
                      className="hidden"
                      id="training-upload"
                      disabled={isImporting}
                    />
                    <label htmlFor="training-upload">
                      <Button
                        variant="default"
                        className="w-full"
                        disabled={isImporting}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Uvezi Trening Podatke
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {isImporting && (
              <Card>
                <CardHeader>
                  <CardTitle>Import u toku...</CardTitle>
                  <CardDescription>{currentImport}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {importProgress}% završeno
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {importResults.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {applyScriptVariant('Nema rezultata importa', lang, scriptVariant)}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {importResults.map((result, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {result.type === 'hs_codes' && <Database className="h-5 w-5" />}
                              {result.type === 'precedents' && <BookOpen className="h-5 w-5" />}
                              {result.type === 'examples' && <FileText className="h-5 w-5" />}
                              {result.type === 'training' && <Brain className="h-5 w-5" />}
                              {result.type.replace('_', ' ').toUpperCase()}
                            </CardTitle>
                            <CardDescription>
                              {new Date(result.timestamp).toLocaleString('ba-BA')}
                            </CardDescription>
                          </div>
                          <Badge variant={result.stats.failed > 0 ? 'destructive' : 'default'}>
                            {result.stats.successful}/{result.stats.total}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-accent" />
                            <span className="text-muted-foreground">Uspješno:</span>
                            <span className="font-semibold">{result.stats.successful}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-muted-foreground">Neuspješno:</span>
                            <span className="font-semibold">{result.stats.failed}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Warning className="h-4 w-4 text-warning" />
                            <span className="text-muted-foreground">Preskočeno:</span>
                            <span className="font-semibold">{result.stats.skipped}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Ukupno:</span>
                            <span className="font-semibold">{result.stats.total}</span>
                          </div>
                        </div>

                        {result.errors.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Warning className="h-4 w-4 text-warning" />
                                Greške ({result.errors.length})
                              </h4>
                              <ScrollArea className="h-32">
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {result.errors.slice(0, 10).map((error, i) => (
                                    <li key={i}>• {error}</li>
                                  ))}
                                  {result.errors.length > 10 && (
                                    <li>... i još {result.errors.length - 10} grešaka</li>
                                  )}
                                </ul>
                              </ScrollArea>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Baza Znanja - Pregled</CardTitle>
                  <CardDescription>Trenutno stanje baze podataka</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-primary" />
                      <span className="font-medium">HS Kodovi</span>
                    </div>
                    <Badge variant="outline">{stats.hsCodes}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-accent" />
                      <span className="font-medium">Presedani</span>
                    </div>
                    <Badge variant="outline">{stats.precedents}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-warning" />
                      <span className="font-medium">Primjeri</span>
                    </div>
                    <Badge variant="outline">{stats.examples}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-destructive" />
                      <span className="font-medium">Trening Podaci</span>
                    </div>
                    <Badge variant="outline">{stats.training}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ukupna Statistika</CardTitle>
                  <CardDescription>Agregirani podaci o importima</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ukupno importa:</span>
                      <span className="font-semibold">{importResults.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uspješnih zapisa:</span>
                      <span className="font-semibold text-accent">
                        {importResults.reduce((sum, r) => sum + r.stats.successful, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Neuspješnih zapisa:</span>
                      <span className="font-semibold text-destructive">
                        {importResults.reduce((sum, r) => sum + r.stats.failed, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preskočenih zapisa:</span>
                      <span className="font-semibold text-warning">
                        {importResults.reduce((sum, r) => sum + r.stats.skipped, 0)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Ukupno podataka u bazi:</h4>
                    <div className="text-3xl font-bold">
                      {stats.hsCodes + stats.precedents + stats.examples + stats.training}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Svi tipovi podataka kombinovani
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
