import { useState, useMemo } from 'react'
import type { ClassificationHistory, Language, ScriptVariant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Star, Trash, CheckCircle, Warning, XCircle, ShieldCheck, DownloadSimple, MagnifyingGlass, FileArrowDown, FileCsv, FileCode, CheckSquare } from '@phosphor-icons/react'
import { t, applyScriptVariant } from '@/lib/translations'
import { useScriptConverter } from '@/hooks/use-script-converter'
import { exportHistoryToExcel, exportHistoryToCSV, exportHistoryToJSON } from '@/lib/excelExport'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ClassificationComparison } from '@/components/ClassificationComparison'
import { ExportTemplatesManager } from '@/components/ExportTemplatesManager'

interface ClassificationHistoryViewProps {
  history: ClassificationHistory[]
  lang: Language
  scriptVariant: ScriptVariant
  onToggleFavorite: (id: string) => void
  onDelete: (id: string) => void
}

export function ClassificationHistoryView({
  history,
  lang,
  scriptVariant,
  onToggleFavorite,
  onDelete
}: ClassificationHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'json'>('excel')
  const [exportOptions, setExportOptions] = useState({
    includeAllFields: true,
    filterFavorites: false,
    filterConfidence: 'all' as 'high' | 'medium' | 'low' | 'all'
  })

  const filteredHistory = useMemo(() => {
    let filtered = [...history]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(h =>
        h.productDescription.toLowerCase().includes(query) ||
        h.result.hsCode.includes(query) ||
        h.result.reasoning.some(r => r.toLowerCase().includes(query))
      )
    }

    if (filterFavorites) {
      filtered = filtered.filter(h => h.isFavorite)
    }

    if (filterConfidence !== 'all') {
      filtered = filtered.filter(h => h.result.confidence === filterConfidence)
    }

    if (dateRange !== 'all') {
      const now = Date.now()
      const ranges = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      }
      const range = ranges[dateRange]
      filtered = filtered.filter(h => now - h.timestamp < range)
    }

    return filtered
  }, [history, searchQuery, filterFavorites, filterConfidence, dateRange])

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedItems(new Set(filteredHistory.map(h => h.id)))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return
    selectedItems.forEach(id => onDelete(id))
    setSelectedItems(new Set())
    toast.success(`Obrisano ${selectedItems.size} stavki`)
  }

  const handleBulkFavorite = () => {
    if (selectedItems.size === 0) return
    selectedItems.forEach(id => {
      const item = history.find(h => h.id === id)
      if (item && !item.isFavorite) {
        onToggleFavorite(id)
      }
    })
    setSelectedItems(new Set())
    toast.success(`Dodato ${selectedItems.size} stavki u favorite`)
  }

  const getFilteredCount = () => {
    let filtered = [...history]
    
    if (exportOptions.filterFavorites) {
      filtered = filtered.filter(h => h.isFavorite)
    }
    
    if (exportOptions.filterConfidence && exportOptions.filterConfidence !== 'all') {
      filtered = filtered.filter(h => h.result.confidence === exportOptions.filterConfidence)
    }
    
    return filtered.length
  }

  const handleExport = () => {
    try {
      const filteredCount = getFilteredCount()
      
      if (filteredCount === 0) {
        toast.error('Nema podataka za eksport sa odabranim filterima')
        return
      }

      const exportFn = exportFormat === 'excel' ? exportHistoryToExcel :
                       exportFormat === 'csv' ? exportHistoryToCSV :
                       exportHistoryToJSON

      exportFn(history, {
        lang,
        scriptVariant,
        includeAllFields: exportOptions.includeAllFields,
        filterFavorites: exportOptions.filterFavorites,
        filterConfidence: exportOptions.filterConfidence
      })
      
      const formatName = exportFormat === 'excel' ? 'Excel' : exportFormat === 'csv' ? 'CSV' : 'JSON'
      toast.success(`Uspješno eksportovano ${filteredCount} ${filteredCount === 1 ? 'rezultat' : 'rezultata'} u ${formatName}`)
      setExportDialogOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Greška pri eksportu podataka')
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return (
          <Badge className="bg-accent text-accent-foreground">
            <CheckCircle className="mr-1" size={14} />
            {t('highConfidence', lang)}
          </Badge>
        )
      case 'medium':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Warning className="mr-1" size={14} />
            {t('mediumConfidence', lang)}
          </Badge>
        )
      case 'low':
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <XCircle className="mr-1" size={14} />
            {t('lowConfidence', lang)}
          </Badge>
        )
      default:
        return null
    }
  }

  const ProductDescription = ({ text }: { text: string }) => {
    const convertedText = useScriptConverter(text, lang, scriptVariant)
    return <>{convertedText}</>
  }

  const HSDescription = ({ text }: { text: string }) => {
    const convertedText = useScriptConverter(text, lang, scriptVariant)
    return <>{convertedText}</>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border space-y-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">{t('history', lang)}</h2>
            <div className="flex gap-2">
              <ClassificationComparison
                history={history}
                lang={lang}
                scriptVariant={scriptVariant}
              />
              <ExportTemplatesManager
                history={history}
                lang={lang}
                scriptVariant={scriptVariant}
              />
              <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <DownloadSimple size={18} />
                    {applyScriptVariant('Eksportuj', lang, scriptVariant)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{applyScriptVariant('Opcije Eksporta', lang, scriptVariant)}</DialogTitle>
                  <DialogDescription>
                    {applyScriptVariant('Eksportuj', lang, scriptVariant)} {getFilteredCount()} {applyScriptVariant('rezultata', lang, scriptVariant)} {history.length > 0 && getFilteredCount() !== history.length && `(od ${history.length})`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <Label>{applyScriptVariant('Format Eksporta', lang, scriptVariant)}</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={exportFormat === 'excel' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setExportFormat('excel')}
                        className="flex-1 gap-2"
                      >
                        <FileArrowDown size={16} />
                        Excel
                      </Button>
                      <Button
                        variant={exportFormat === 'csv' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setExportFormat('csv')}
                        className="flex-1 gap-2"
                      >
                        <FileCsv size={16} />
                        CSV
                      </Button>
                      <Button
                        variant={exportFormat === 'json' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setExportFormat('json')}
                        className="flex-1 gap-2"
                      >
                        <FileCode size={16} />
                        JSON
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="all-fields" className="flex flex-col gap-1">
                      <span className="font-medium">{applyScriptVariant('Sva Polja', lang, scriptVariant)}</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        {applyScriptVariant('Uključi sve detalje klasifikacije', lang, scriptVariant)}
                      </span>
                    </Label>
                    <Switch
                      id="all-fields"
                      checked={exportOptions.includeAllFields}
                      onCheckedChange={(checked) =>
                        setExportOptions(prev => ({ ...prev, includeAllFields: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="favorites-only">{applyScriptVariant('Samo Favoriti', lang, scriptVariant)}</Label>
                    <Switch
                      id="favorites-only"
                      checked={exportOptions.filterFavorites}
                      onCheckedChange={(checked) =>
                        setExportOptions(prev => ({ ...prev, filterFavorites: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confidence-filter">{applyScriptVariant('Filter Pouzdanosti', lang, scriptVariant)}</Label>
                    <Select
                      value={exportOptions.filterConfidence}
                      onValueChange={(value) =>
                        setExportOptions(prev => ({ ...prev, filterConfidence: value as 'high' | 'medium' | 'low' | 'all' }))
                      }
                    >
                      <SelectTrigger id="confidence-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{applyScriptVariant('Sve', lang, scriptVariant)}</SelectItem>
                        <SelectItem value="high">{t('highConfidence', lang)}</SelectItem>
                        <SelectItem value="medium">{t('mediumConfidence', lang)}</SelectItem>
                        <SelectItem value="low">{t('lowConfidence', lang)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {getFilteredCount() === 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {applyScriptVariant('Nema rezultata sa odabranim filterima', lang, scriptVariant)}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleExport}
                    disabled={getFilteredCount() === 0}
                    className="flex-1"
                  >
                    {applyScriptVariant('Eksportuj', lang, scriptVariant)}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExportDialogOpen(false)}
                  >
                    {applyScriptVariant('Otkaži', lang, scriptVariant)}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder={applyScriptVariant('Pretraži po opisu, HS kodu ili razlogu...', lang, scriptVariant)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setFilterFavorites(!filterFavorites)}
              >
                <Star size={16} weight={filterFavorites ? 'fill' : 'regular'} />
                {applyScriptVariant('Favoriti', lang, scriptVariant)}
              </Button>

              <Select value={filterConfidence} onValueChange={(value) => setFilterConfidence(value as 'high' | 'medium' | 'low' | 'all')}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{applyScriptVariant('Sve', lang, scriptVariant)}</SelectItem>
                  <SelectItem value="high">{t('highConfidence', lang)}</SelectItem>
                  <SelectItem value="medium">{t('mediumConfidence', lang)}</SelectItem>
                  <SelectItem value="low">{t('lowConfidence', lang)}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={(value) => setDateRange(value as 'all' | 'today' | 'week' | 'month')}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{applyScriptVariant('Svi Periodi', lang, scriptVariant)}</SelectItem>
                  <SelectItem value="today">{applyScriptVariant('Danas', lang, scriptVariant)}</SelectItem>
                  <SelectItem value="week">{applyScriptVariant('Ova Sedmica', lang, scriptVariant)}</SelectItem>
                  <SelectItem value="month">{applyScriptVariant('Ovaj Mjesec', lang, scriptVariant)}</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || filterFavorites || filterConfidence !== 'all' || dateRange !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterFavorites(false)
                    setFilterConfidence('all')
                    setDateRange('all')
                  }}
                >
                  {applyScriptVariant('Resetuj Filtere', lang, scriptVariant)}
                </Button>
              )}

              <div className="ml-auto text-sm text-muted-foreground">
                {filteredHistory.length} {applyScriptVariant('rezultata', lang, scriptVariant)}
                {filteredHistory.length !== history.length && ` (od ${history.length})`}
              </div>
            </div>

            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
                <CheckSquare size={18} className="text-accent" />
                <span className="text-sm font-medium">
                  {selectedItems.size} {applyScriptVariant('odabrano', lang, scriptVariant)}
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkFavorite}
                    className="gap-2"
                  >
                    <Star size={14} />
                    {applyScriptVariant('Dodaj u Favorite', lang, scriptVariant)}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                  >
                    <Trash size={14} />
                    {applyScriptVariant('Obriši', lang, scriptVariant)}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deselectAll}
                  >
                    {applyScriptVariant('Poništi', lang, scriptVariant)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery || filterFavorites || filterConfidence !== 'all' || dateRange !== 'all'
                  ? applyScriptVariant('Nema rezultata koji odgovaraju filterima', lang, scriptVariant)
                  : applyScriptVariant('Nema rezultata', lang, scriptVariant)}
              </div>
            ) : (
              <>
                {selectedItems.size === 0 && filteredHistory.length > 5 && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      className="gap-2"
                    >
                      <CheckSquare size={14} />
                      {applyScriptVariant('Odaberi Sve', lang, scriptVariant)}
                    </Button>
                  </div>
                )}

                {filteredHistory.map(item => {
                  const date = new Date(item.timestamp)
                  const isSelected = selectedItems.has(item.id)

                  return (
                    <Card 
                      key={item.id} 
                      className={cn(
                        "hover:border-primary/50 transition-all",
                        isSelected && "border-accent ring-2 ring-accent/20"
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectItem(item.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <CardTitle className="text-base mb-2">
                                <ProductDescription text={item.productDescription} />
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onToggleFavorite(item.id)}
                            >
                              <Star size={20} weight={item.isFavorite ? 'fill' : 'regular'} className={item.isFavorite ? 'text-warning' : ''} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(item.id)}
                            >
                              <Trash size={20} className="text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <code className="font-mono text-lg font-semibold px-2 py-1 bg-muted rounded">
                            {item.result.hsCode}
                          </code>
                          {getConfidenceBadge(item.result.confidence)}
                        </div>

                        {item.result.verificationHash && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck size={14} />
                            {t('verificationHash', lang)}: {item.result.verificationHash}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{t('defensibilityScore', lang)}:</span>
                            <span className="text-lg font-semibold">{item.result.defensibilityScore}/10</span>
                          </div>
                          <Progress value={item.result.defensibilityScore * 10} className="h-2" />
                        </div>

                        {/* HS description/tariff fields intentionally omitted: no hardcoded demo data. */}
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
