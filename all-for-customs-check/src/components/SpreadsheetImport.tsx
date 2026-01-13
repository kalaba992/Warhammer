import { useState, useRef } from 'react'
import { useKV } from '@/hooks'
import Papa from '@/lib/papaparse-shim'
import type { ParseConfig as PapaParseConfig, ParseResult as PapaParseResult } from '@/lib/papaparse-shim'
import * as XLSX from '@/lib/xlsx-shim'
import type { Language, ScriptVariant, ClassificationHistory } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  X, 
  Play,
  DownloadSimple,
  FileXls,
  FileCsv,
  CheckCircle,
  XCircle,
  Info
} from '@phosphor-icons/react'
import { useScriptConverter } from '@/hooks/use-script-converter'
import { classifyProduct } from '@/lib/aiService'
import { toast } from 'sonner'

interface SpreadsheetRow {
  id: string
  rowNumber: number
  productDescription: string
  additionalInfo?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  hsCode?: string
  confidence?: string
  error?: string
}

interface SpreadsheetImportProps {
  lang: Language
  scriptVariant: ScriptVariant
}

export function SpreadsheetImport({ lang, scriptVariant }: SpreadsheetImportProps) {
  const [rows, setRows] = useState<SpreadsheetRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentProcessing, setCurrentProcessing] = useState<string | null>(null)
  const [, setHistory] = useKV<ClassificationHistory[]>('classification-history', [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef(false)

  const TitleDisplay = ({ text }: { text: string }) => {
    const converted = useScriptConverter(text, lang, scriptVariant)
    return <>{converted}</>
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'csv') {
      parseCSV(file)
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseExcel(file)
    } else {
      toast.error(<TitleDisplay text="Nepoznat format fajla. Podržani formati: CSV, XLSX, XLS" />)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const parseCSV = (file: File) => {
    const config: PapaParseConfig = {
      header: true,
      skipEmptyLines: true,
      complete: (results: PapaParseResult) => {
        const data = (results.data ?? []) as Record<string, unknown>[]
        const errors = (results.errors ?? []) as Array<{ message?: string }>
        const firstError = errors[0]
        if (firstError?.message) {
          toast.error(<TitleDisplay text={`Greška pri parsiranju CSV fajla: ${firstError.message}`} />)
          return
        }

        const parsedRows: SpreadsheetRow[] = []

        data.forEach((row: Record<string, unknown>, index: number) => {
          const productDescription = 
            row['Product Description'] || 
            row['Opis Proizvoda'] || 
            row['Description'] || 
            row['Opis'] ||
            row['product_description'] ||
            row['description'] ||
            Object.values(row)[0]

          if (productDescription && typeof productDescription === 'string' && productDescription.trim()) {
            parsedRows.push({
              id: `row-${Date.now()}-${index}`,
              rowNumber: index + 1,
              productDescription: productDescription.trim(),
              additionalInfo: String(row['Additional Info'] || row['Dodatne Informacije'] || ''),
              status: 'pending'
            })
          }
        })

        if (parsedRows.length === 0) {
          toast.error(<TitleDisplay text="CSV fajl ne sadrži validne podatke. Provjerite da prva kolona sadrži opise proizvoda." />)
          return
        }

        if (parsedRows.length > 100) {
          toast.warning(<TitleDisplay text={`CSV sadrži ${parsedRows.length} redova. Procesuiraće se prvih 100.`} />)
          setRows(parsedRows.slice(0, 100))
        } else {
          setRows(parsedRows)
          toast.success(<TitleDisplay text={`Učitano ${parsedRows.length} redova iz CSV fajla`} />)
        }
      }
    }

    Papa.parse(file, config)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const parseExcel = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          toast.error(<TitleDisplay text="Greška pri čitanju Excel fajla" />)
          return
        }

        if (typeof data === 'string') {
          toast.error(<TitleDisplay text="Greška pri parsiranju Excel fajla: očekivan binarni sadržaj" />)
          return
        }

        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[]

        if (!Array.isArray(rawData) || rawData.length === 0) {
          toast.error(<TitleDisplay text="Excel fajl je prazan" />)
          return
        }

        const normalizeHeader = (value: unknown) => {
          if (typeof value === 'string') return value
          if (value == null) return ''
          return String(value)
        }

        const headersRow = Array.isArray(rawData[0]) ? rawData[0] : []
        const headers = headersRow.map(normalizeHeader)
        const rows = rawData.slice(1) as unknown[][]

        const productDescIndex = headers.findIndex(h => 
          h && (
            h.toLowerCase().includes('product') ||
            h.toLowerCase().includes('description') ||
            h.toLowerCase().includes('opis') ||
            h.toLowerCase().includes('proizvod')
          )
        )

        const additionalInfoIndex = headers.findIndex(h => 
          h && (
            h.toLowerCase().includes('additional') ||
            h.toLowerCase().includes('info') ||
            h.toLowerCase().includes('dodatne') ||
            h.toLowerCase().includes('informacije')
          )
        )

        const descriptionIndex = productDescIndex >= 0 ? productDescIndex : 0

        const parsedRows: SpreadsheetRow[] = []

        rows.forEach((row, index) => {
          const rawDescription = row[descriptionIndex]
          const productDescription = rawDescription != null ? String(rawDescription).trim() : ''

          if (productDescription) {
            const rawAdditional = additionalInfoIndex >= 0 ? row[additionalInfoIndex] : undefined
            parsedRows.push({
              id: `row-${Date.now()}-${index}`,
              rowNumber: index + 2,
              productDescription,
              additionalInfo: rawAdditional != null ? String(rawAdditional).trim() : '',
              status: 'pending'
            })
          }
        })

        if (parsedRows.length === 0) {
          toast.error(<TitleDisplay text="Excel fajl ne sadrži validne podatke. Provjerite da postoji kolona sa opisima proizvoda." />)
          return
        }

        if (parsedRows.length > 100) {
          toast.warning(<TitleDisplay text={`Excel sadrži ${parsedRows.length} redova. Procesuiraće se prvih 100.`} />)
          setRows(parsedRows.slice(0, 100))
        } else {
          setRows(parsedRows)
          toast.success(<TitleDisplay text={`Učitano ${parsedRows.length} redova iz Excel fajla`} />)
        }
      } catch (error) {
        console.error('Excel parsing error:', error)
        toast.error(<TitleDisplay text={`Greška pri parsiranju Excel fajla: ${error instanceof Error ? error.message : 'Unknown error'}`} />)
      }
    }

    reader.onerror = () => {
      toast.error(<TitleDisplay text="Greška pri čitanju Excel fajla" />)
    }

    reader.readAsArrayBuffer(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleStartProcessing = async () => {
    if (rows.length === 0) return

    abortRef.current = false
    setIsProcessing(true)
    setProgress(0)

    const pendingRows = rows.filter(r => r.status === 'pending' || r.status === 'error')

    for (let i = 0; i < pendingRows.length; i++) {
      if (abortRef.current) break

      const row = pendingRows[i]
      setCurrentProcessing(row.productDescription)

      setRows(prev => prev.map(r => 
        r.id === row.id ? { ...r, status: 'processing' } : r
      ))

      try {
        const classificationText = row.additionalInfo 
          ? `${row.productDescription}\n\nDodatne informacije: ${row.additionalInfo}`
          : row.productDescription

        const result = await classifyProduct(classificationText, lang)

        const historyEntry: ClassificationHistory = {
          id: `hist-${Date.now()}-${row.id}`,
          productDescription: `[CSV Red ${row.rowNumber}] ${row.productDescription}`,
          result,
          timestamp: Date.now()
        }

        setHistory(currentHistory => [historyEntry, ...(currentHistory || [])])

        setRows(prev => prev.map(r => 
          r.id === row.id 
            ? { 
                ...r, 
                status: 'completed', 
                hsCode: result.hsCode,
                confidence: result.confidence 
              } 
            : r
        ))
      } catch (error) {
        setRows(prev => prev.map(r => 
          r.id === row.id 
            ? { 
                ...r, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              } 
            : r
        ))
      }

      setProgress(Math.round(((i + 1) / pendingRows.length) * 100))
    }

    setCurrentProcessing(null)
    setIsProcessing(false)

    const completed = rows.filter(r => r.status === 'completed').length
    const failed = rows.filter(r => r.status === 'error').length

    if (completed > 0) {
      toast.success(<TitleDisplay text={`Uspješno klasificirano ${completed} od ${pendingRows.length} proizvoda`} />)
    }

    if (failed > 0) {
      toast.warning(<TitleDisplay text={`${failed} proizvoda nije klasificirano`} />)
    }
  }

  const handleStop = () => {
    abortRef.current = true
    setIsProcessing(false)
    setCurrentProcessing(null)
    toast.info(<TitleDisplay text="Obrada zaustavljena" />)
  }

  const handleClear = () => {
    setRows([])
    setProgress(0)
    setCurrentProcessing(null)
  }

  const handleExportResults = () => {
    const completedRows = rows.filter(r => r.status === 'completed')

    if (completedRows.length === 0) {
      toast.error(<TitleDisplay text="Nema rezultata za eksport" />)
      return
    }

    const exportData = completedRows.map(r => ({
      'Br.': r.rowNumber,
      'Opis Proizvoda': r.productDescription,
      'HS Kod': r.hsCode,
      'Pouzdanost': r.confidence === 'high' ? 'Visoka' : r.confidence === 'medium' ? 'Srednja' : 'Niska',
      'Dodatne Informacije': r.additionalInfo || ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    
    const columnWidths = [
      { wch: 8 },
      { wch: 45 },
      { wch: 15 },
      { wch: 15 },
      { wch: 45 }
    ]
    worksheet['!cols'] = columnWidths

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = worksheet[cellAddress] as XLSX.CellObject & { s?: unknown }
        if (!cell) continue
        
        if (R === 0) {
          cell.s = {
            font: { bold: true, sz: 11 },
            fill: { fgColor: { rgb: 'E8E8E8' } },
            alignment: { vertical: 'center', horizontal: 'center' }
          }
        } else {
          cell.s = {
            alignment: { vertical: 'top', wrapText: true }
          }
        }
      }
    }

    const autoFilterRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(autoFilterRange) }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rezultati Klasifikacije')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
    const fileName = `Carinski-Alat-CSV-Export-${timestamp[0]}-${timestamp[1].substring(0, 8)}.xlsx`
    
    XLSX.writeFile(workbook, fileName)

    toast.success(<TitleDisplay text={`Eksportovano ${completedRows.length} rezultata u Excel`} />)
  }

  const handleDownloadTemplate = () => {
    const template = [
      { 'Product Description': 'Šećer', 'Additional Info': 'Bijeli kristalni šećer u vreći od 25kg' },
      { 'Product Description': 'Računar laptop', 'Additional Info': 'Proizvođač: Dell, RAM: 16GB' },
      { 'Product Description': '', 'Additional Info': '' }
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template-import.csv'
    link.click()
    URL.revokeObjectURL(url)

    toast.success(<TitleDisplay text="CSV Template preuzet" />)
  }

  const handleDownloadExcelTemplate = () => {
    const template = [
      { 'Product Description': 'Šećer', 'Additional Info': 'Bijeli kristalni šećer u vreći od 25kg' },
      { 'Product Description': 'Računar laptop', 'Additional Info': 'Proizvođač: Dell, RAM: 16GB' },
      { 'Product Description': 'Pšenično brašno', 'Additional Info': 'Tip 500, pakovanje 1kg' }
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 50 }
    ]

    XLSX.writeFile(workbook, 'template-import.xlsx')

    toast.success(<TitleDisplay text="Excel Template preuzet" />)
  }

  const pendingCount = rows.filter(r => r.status === 'pending').length
  const completedCount = rows.filter(r => r.status === 'completed').length
  const errorCount = rows.filter(r => r.status === 'error').length

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2">
            <TitleDisplay text="CSV/Excel Uvoz" />
          </h2>
          <p className="text-muted-foreground text-sm">
            <TitleDisplay text="Uvezite proizvode iz CSV fajla za grupnu klasifikaciju" />
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Alert className="bg-accent/10 border-accent">
                <Info className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm">
                  <TitleDisplay text="CSV/Excel fajl treba da ima kolonu 'Product Description' ili 'Opis Proizvoda' sa opisom proizvoda za klasifikaciju. Opciono možete dodati kolonu 'Additional Info' sa dodatnim informacijama." />
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle><TitleDisplay text="Učitaj CSV ili Excel Fajl" /></CardTitle>
                  <CardDescription>
                    <TitleDisplay text="Izaberite CSV (.csv) ili Excel (.xlsx, .xls) fajl sa opisima proizvoda za klasifikaciju (max 100 redova)" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <label
                      htmlFor="file-input"
                      className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex gap-2 mb-2">
                          <FileCsv size={28} className="text-muted-foreground" />
                          <FileXls size={28} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium"><TitleDisplay text="Kliknite za izbor CSV ili Excel fajla" /></span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <TitleDisplay text="Podržani formati: .csv, .xlsx, .xls" />
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="file-input"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        aria-label="Odaberite CSV ili Excel fajl"
                        onChange={handleFileUpload}
                        disabled={isProcessing}
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                      >
                        <FileCsv size={16} className="mr-1.5" />
                        <TitleDisplay text="CSV Template" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadExcelTemplate}
                      >
                        <FileXls size={16} className="mr-1.5" />
                        <TitleDisplay text="Excel Template" />
                      </Button>
                    </div>

                    {rows.length > 0 && (
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <TitleDisplay text="Ukupno" />: <span className="font-semibold text-foreground">{rows.length}</span>
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
                    )}
                  </div>
                </CardContent>
              </Card>

              {isProcessing && (
                <Card>
                  <CardHeader>
                    <CardTitle><TitleDisplay text="Napredak Obrade" /></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground"><TitleDisplay text="Napredak" /></span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    {currentProcessing && (
                      <div className="text-sm text-muted-foreground">
                        <TitleDisplay text="Trenutno obrađuje" />: <span className="text-foreground font-medium">{currentProcessing}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {rows.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle><TitleDisplay text="Učitani Proizvodi" /></CardTitle>
                      <div className="flex gap-2">
                        {completedCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportResults}
                            disabled={isProcessing}
                          >
                            <DownloadSimple size={16} className="mr-1.5" />
                            <TitleDisplay text="Eksportuj Rezultate" />
                          </Button>
                        )}
                        {!isProcessing && pendingCount > 0 && (
                          <Button
                            onClick={handleStartProcessing}
                            size="sm"
                          >
                            <Play size={16} className="mr-1.5" weight="fill" />
                            <TitleDisplay text="Pokreni Klasifikaciju" />
                          </Button>
                        )}
                        {isProcessing && (
                          <Button
                            onClick={handleStop}
                            variant="destructive"
                            size="sm"
                          >
                            <X size={16} className="mr-1.5" />
                            <TitleDisplay text="Zaustavi" />
                          </Button>
                        )}
                        {!isProcessing && (
                          <Button
                            onClick={handleClear}
                            variant="outline"
                            size="sm"
                          >
                            <X size={16} className="mr-1.5" />
                            <TitleDisplay text="Očisti" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead><TitleDisplay text="Opis Proizvoda" /></TableHead>
                            <TableHead className="w-32"><TitleDisplay text="HS Kod" /></TableHead>
                            <TableHead className="w-28"><TitleDisplay text="Pouzdanost" /></TableHead>
                            <TableHead className="w-28"><TitleDisplay text="Status" /></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="font-medium text-muted-foreground">
                                {row.rowNumber}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-md">
                                  <div className="font-medium truncate">{row.productDescription}</div>
                                  {row.additionalInfo && (
                                    <div className="text-xs text-muted-foreground truncate mt-1">
                                      {row.additionalInfo}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {row.hsCode && (
                                  <span className="font-mono font-semibold">{row.hsCode}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {row.confidence && (
                                  <Badge 
                                    variant={
                                      row.confidence === 'high' ? 'default' :
                                      row.confidence === 'medium' ? 'secondary' :
                                      'outline'
                                    }
                                  >
                                    {row.confidence === 'high' && <TitleDisplay text="Visoka" />}
                                    {row.confidence === 'medium' && <TitleDisplay text="Srednja" />}
                                    {row.confidence === 'low' && <TitleDisplay text="Niska" />}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {row.status === 'pending' && (
                                  <Badge variant="outline">
                                    <TitleDisplay text="Na čekanju" />
                                  </Badge>
                                )}
                                {row.status === 'processing' && (
                                  <Badge variant="secondary">
                                    <TitleDisplay text="Obrađuje..." />
                                  </Badge>
                                )}
                                {row.status === 'completed' && (
                                  <Badge variant="default" className="bg-accent">
                                    <CheckCircle size={14} className="mr-1" weight="fill" />
                                    <TitleDisplay text="Završeno" />
                                  </Badge>
                                )}
                                {row.status === 'error' && (
                                  <Badge variant="destructive">
                                    <XCircle size={14} className="mr-1" weight="fill" />
                                    <TitleDisplay text="Greška" />
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle><TitleDisplay text="Upustva za CSV/Excel Uvoz" /></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2"><TitleDisplay text="Format Fajla" /></h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</div>
                        <p><TitleDisplay text="Prva kolona treba da bude 'Product Description' ili 'Opis Proizvoda'" /></p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</div>
                        <p><TitleDisplay text="Opciono dodajte kolonu 'Additional Info' ili 'Dodatne Informacije' za dodatne detalje" /></p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</div>
                        <p><TitleDisplay text="Maksimalno 100 redova po uvozu" /></p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">4</div>
                        <p><TitleDisplay text="Preuzmite CSV ili Excel template za lakše formatiranje" /></p>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-accent/10 border-accent">
                    <CheckCircle className="h-4 w-4 text-accent" weight="fill" />
                    <AlertDescription className="text-sm">
                      <TitleDisplay text="Excel podrška omogućava direktno učitavanje .xlsx i .xls fajlova bez potrebe za konverzijom u CSV format." />
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-semibold mb-2"><TitleDisplay text="Primjer CSV Strukture" /></h4>
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                      <pre>
Product Description,Additional Info
Šećer,Bijeli kristalni šećer u vreći od 25kg
Računar laptop,Proizvođač: Dell, RAM: 16GB
Automobile parts,Steel components for engines
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2"><TitleDisplay text="Podržani Formati" /></h4>
                    <div className="flex gap-3 text-sm">
                      <Badge variant="outline" className="gap-1.5">
                        <FileCsv size={14} />
                        CSV (.csv)
                      </Badge>
                      <Badge variant="outline" className="gap-1.5">
                        <FileXls size={14} />
                        Excel (.xlsx)
                      </Badge>
                      <Badge variant="outline" className="gap-1.5">
                        <FileXls size={14} />
                        Excel (.xls)
                      </Badge>
                    </div>
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
