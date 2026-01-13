import { useState, useMemo } from 'react'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MagnifyingGlass,
  FunnelSimple,
  Tree,
  Database,
  BookOpen,
  FileText,
  Brain,
  CaretRight,
  CaretDown,
  Star,
  Export,
  Folder,
  FolderOpen,
  Hash,
  TextAlignLeft,
  CalendarBlank,
  Tag,
  ChartBar
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'
import type { Language, ScriptVariant, HSCode } from '@/types'
import { cn } from '@/lib/utils'

type PrecedentData = {
  id: string
  summary?: string
  caseId?: string
  source?: string
  bindingLevel?: string
  hsCode?: string
  createdAt?: number
}

type ExampleData = {
  id: string
  productDescription: string
  hsCode: string
  confidence?: string
  language?: string
  reasoning?: string
  createdAt?: number
}

type TrainingData = {
  id: string
  query: string
  expectedHsCode: string
  keyTerms?: string[]
  context?: string
  createdAt?: number
}

interface KnowledgeBaseBrowserProps {
  lang: Language
  scriptVariant: ScriptVariant
}

type DataType = 'all' | 'hs_codes' | 'precedents' | 'examples' | 'training'
type SortBy = 'date' | 'code' | 'name' | 'relevance'
type ViewMode = 'tree' | 'list' | 'grid'

interface KnowledgeItem {
  id: string
  type: DataType
  title: string
  subtitle?: string
  code?: string
  date?: number
  tags?: string[]
  data: HSCode | PrecedentData | ExampleData | TrainingData
}

const isPrecedent = (data: KnowledgeItem['data']): data is PrecedentData =>
  typeof data === 'object' && data !== null && 'caseId' in data

const isExample = (data: KnowledgeItem['data']): data is ExampleData =>
  typeof data === 'object' && data !== null && 'productDescription' in data

const isTraining = (data: KnowledgeItem['data']): data is TrainingData =>
  typeof data === 'object' && data !== null && 'expectedHsCode' in data

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

const toNumberValue = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(toStringValue).filter(Boolean) as string[]
  if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean)
  return []
}

export function KnowledgeBaseBrowser({ lang, scriptVariant }: KnowledgeBaseBrowserProps) {
  const [hsCodeData] = useKV<HSCode[]>('hs-code-database', [])
  const [precedentData] = useKV<Record<string, unknown>[]>('precedent-database', [])
  const [examplesData] = useKV<Record<string, unknown>[]>('classification-examples', [])
  const [trainingData] = useKV<Record<string, unknown>[]>('training-data', [])

  const [searchQuery, setSearchQuery] = useState('')
  const [dataType, setDataType] = useState<DataType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [expandedHeadings, setExpandedHeadings] = useState<Set<string>>(new Set())
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterConfidence, setFilterConfidence] = useState<string>('all')

  const allItems = useMemo(() => {
    const items: KnowledgeItem[] = []

    if (dataType === 'all' || dataType === 'hs_codes') {
      (hsCodeData || []).forEach(code => {
        items.push({
          id: `hs-${code.code8Digits}`,
          type: 'hs_codes',
          title: code.descriptionBa || code.descriptionEn,
          subtitle: code.descriptionEn,
          code: code.code8Digits,
          tags: [
            `Chapter ${code.chapter}`,
            code.isActive ? 'Active' : 'Inactive',
            code.tariffInfo.dutyRate
          ],
          data: code
        })
      })
    }

    if (dataType === 'all' || dataType === 'precedents') {
      (precedentData || []).forEach(raw => {
        if (!raw || typeof raw !== 'object') return
        const id = toStringValue((raw as Record<string, unknown>).id)
        if (!id) return

        const hsCode = toStringValue((raw as Record<string, unknown>).hsCode)
        const summary = toStringValue((raw as Record<string, unknown>).summary)
        const caseId = toStringValue((raw as Record<string, unknown>).caseId)
        const source = toStringValue((raw as Record<string, unknown>).source)
        const bindingLevel = toStringValue((raw as Record<string, unknown>).bindingLevel)
        const createdAt = toNumberValue((raw as Record<string, unknown>).createdAt)

        const normalized: PrecedentData = {
          id,
          summary,
          caseId,
          source,
          bindingLevel,
          hsCode,
          createdAt
        }

        const tags = [source, bindingLevel, hsCode].filter(Boolean) as string[]

        items.push({
          id,
          type: 'precedents',
          title: summary || caseId || 'Precedent',
          subtitle: `${source || 'Unknown'} - ${bindingLevel || 'informative'}`,
          code: hsCode,
          date: createdAt,
          tags,
          data: normalized
        })
      })
    }

    if (dataType === 'all' || dataType === 'examples') {
      (examplesData || []).forEach(raw => {
        if (!raw || typeof raw !== 'object') return
        const id = toStringValue((raw as Record<string, unknown>).id)
        const productDescription = toStringValue((raw as Record<string, unknown>).productDescription)
        const hsCode = toStringValue((raw as Record<string, unknown>).hsCode)
        if (!id || !productDescription || !hsCode) return

        const confidence = toStringValue((raw as Record<string, unknown>).confidence)
        const language = toStringValue((raw as Record<string, unknown>).language)
        const reasoning = toStringValue((raw as Record<string, unknown>).reasoning)
        const createdAt = toNumberValue((raw as Record<string, unknown>).createdAt)

        const normalized: ExampleData = {
          id,
          productDescription,
          hsCode,
          confidence,
          language,
          reasoning,
          createdAt
        }

        const tags = [confidence, language, hsCode].filter(Boolean) as string[]

        items.push({
          id,
          type: 'examples',
          title: productDescription,
          subtitle: `HS: ${hsCode}`,
          code: hsCode,
          date: createdAt,
          tags,
          data: normalized
        })
      })
    }

    if (dataType === 'all' || dataType === 'training') {
      (trainingData || []).forEach(raw => {
        if (!raw || typeof raw !== 'object') return
        const id = toStringValue((raw as Record<string, unknown>).id)
        const query = toStringValue((raw as Record<string, unknown>).query)
        const expectedHsCode = toStringValue((raw as Record<string, unknown>).expectedHsCode)
        if (!id || !query || !expectedHsCode) return

        const createdAt = toNumberValue((raw as Record<string, unknown>).createdAt)
        const context = toStringValue((raw as Record<string, unknown>).context)
        const keyTerms = toStringArray((raw as Record<string, unknown>).keyTerms)

        const normalized: TrainingData = {
          id,
          query,
          expectedHsCode,
          context,
          keyTerms,
          createdAt
        }

        const tags = [...keyTerms, expectedHsCode].filter(Boolean)

        items.push({
          id,
          type: 'training',
          title: query,
          subtitle: `Expected: ${expectedHsCode}`,
          code: expectedHsCode,
          date: createdAt,
          tags,
          data: normalized
        })
      })
    }

    return items
  }, [hsCodeData, precedentData, examplesData, trainingData, dataType])

  const filteredItems = useMemo(() => {
    let filtered = [...allItems]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (filterSource !== 'all' && dataType === 'precedents') {
      filtered = filtered.filter(item => 
        item.type === 'precedents' && isPrecedent(item.data) && item.data.source === filterSource
      )
    }

    if (filterConfidence !== 'all' && dataType === 'examples') {
      filtered = filtered.filter(item => 
        item.type === 'examples' && isExample(item.data) && item.data.confidence === filterConfidence
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (b.date || 0) - (a.date || 0)
        case 'code':
          return (a.code || '').localeCompare(b.code || '')
        case 'name':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [allItems, searchQuery, sortBy, filterSource, filterConfidence, dataType])

  const hierarchicalData = useMemo(() => {
    if (dataType !== 'hs_codes' && dataType !== 'all') return null

    const chapters: Map<number, { codes: HSCode[], heading: Map<string, HSCode[]> }> = new Map()

    const hsItems = (hsCodeData || []).filter(code => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return code.descriptionBa.toLowerCase().includes(query) ||
        code.descriptionEn.toLowerCase().includes(query) ||
        code.code8Digits.includes(query)
    })

    hsItems.forEach(code => {
      if (!chapters.has(code.chapter)) {
        chapters.set(code.chapter, { codes: [], heading: new Map() })
      }
      const chapter = chapters.get(code.chapter)!
      chapter.codes.push(code)

      if (!chapter.heading.has(code.heading)) {
        chapter.heading.set(code.heading, [])
      }
      chapter.heading.get(code.heading)!.push(code)
    })

    return chapters
  }, [hsCodeData, searchQuery, dataType])

  const toggleChapter = (chapterNum: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterNum)) {
        next.delete(chapterNum)
      } else {
        next.add(chapterNum)
      }
      return next
    })
  }

  const toggleHeading = (heading: string) => {
    setExpandedHeadings(prev => {
      const next = new Set(prev)
      if (next.has(heading)) {
        next.delete(heading)
      } else {
        next.add(heading)
      }
      return next
    })
  }

  const getItemIcon = (type: DataType) => {
    switch (type) {
      case 'hs_codes':
        return <Database className="h-4 w-4 text-primary" />
      case 'precedents':
        return <BookOpen className="h-4 w-4 text-accent" />
      case 'examples':
        return <FileText className="h-4 w-4 text-warning" />
      case 'training':
        return <Brain className="h-4 w-4 text-destructive" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const stats = {
    total: allItems.length,
    hsCodes: (hsCodeData || []).length,
    precedents: (precedentData || []).length,
    examples: (examplesData || []).length,
    training: (trainingData || []).length,
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold mb-1">
            {applyScriptVariant('Pretraživanje Baze Znanja', lang, scriptVariant)}
          </h2>
          <p className="text-muted-foreground">
            {applyScriptVariant('Hijerarhijska navigacija i napredno pretraživanje', lang, scriptVariant)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto p-6 flex gap-6">
          <div className="w-80 flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChartBar className="h-4 w-4" />
                  Statistika
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ukupno:</span>
                  <Badge variant="outline">{stats.total}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">HS Kodovi:</span>
                  </div>
                  <Badge variant="outline">{stats.hsCodes}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3 text-accent" />
                    <span className="text-muted-foreground">Presedani:</span>
                  </div>
                  <Badge variant="outline">{stats.precedents}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-warning" />
                    <span className="text-muted-foreground">Primjeri:</span>
                  </div>
                  <Badge variant="outline">{stats.examples}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3 text-destructive" />
                    <span className="text-muted-foreground">Trening:</span>
                  </div>
                  <Badge variant="outline">{stats.training}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FunnelSimple className="h-4 w-4" />
                  Filteri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Tip Podataka</label>
                  <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Svi Podaci</SelectItem>
                      <SelectItem value="hs_codes">HS Kodovi</SelectItem>
                      <SelectItem value="precedents">Presedani</SelectItem>
                      <SelectItem value="examples">Primjeri</SelectItem>
                      <SelectItem value="training">Trening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Sortiraj Po</label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Datum</SelectItem>
                      <SelectItem value="code">HS Kod</SelectItem>
                      <SelectItem value="name">Naziv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dataType === 'precedents' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Izvor</label>
                    <Select value={filterSource} onValueChange={setFilterSource}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Svi Izvori</SelectItem>
                        <SelectItem value="WCO">WCO</SelectItem>
                        <SelectItem value="TARIC">TARIC</SelectItem>
                        <SelectItem value="EU_CURIA">EU Curia</SelectItem>
                        <SelectItem value="UIO_BIH">UIO BiH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {dataType === 'examples' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Pouzdanost</label>
                    <Select value={filterConfidence} onValueChange={setFilterConfidence}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Sve Razine</SelectItem>
                        <SelectItem value="high">Visoka</SelectItem>
                        <SelectItem value="medium">Srednja</SelectItem>
                        <SelectItem value="low">Niska</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <label className="text-xs font-medium">Prikaz</label>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === 'tree' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewMode('tree')}
                    >
                      <Tree className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewMode('list')}
                    >
                      <TextAlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewMode('grid')}
                    >
                      <Hash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={applyScriptVariant('Pretraži bazu znanja...', lang, scriptVariant)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-hidden flex gap-4">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {filteredItems.length} Rezultata
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      <Export className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full px-6 pb-6">
                    {viewMode === 'tree' && hierarchicalData && (dataType === 'hs_codes' || dataType === 'all') ? (
                      <div className="space-y-2">
                        {Array.from(hierarchicalData.entries()).map(([chapterNum, chapterData]) => {
                          const isExpanded = expandedChapters.has(chapterNum)
                          return (
                            <div key={chapterNum} className="border rounded-lg">
                              <button
                                onClick={() => toggleChapter(chapterNum)}
                                className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
                              >
                                {isExpanded ? (
                                  <FolderOpen className="h-4 w-4 text-primary" />
                                ) : (
                                  <Folder className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium">
                                  {applyScriptVariant(`Poglavlje ${chapterNum}`, lang, scriptVariant)}
                                </span>
                                <Badge variant="secondary" className="ml-auto">
                                  {chapterData.codes.length}
                                </Badge>
                                {isExpanded ? (
                                  <CaretDown className="h-4 w-4" />
                                ) : (
                                  <CaretRight className="h-4 w-4" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="border-t p-2 space-y-1">
                                  {Array.from(chapterData.heading.entries()).map(([heading, codes]) => {
                                    const headingExpanded = expandedHeadings.has(heading)
                                    return (
                                      <div key={heading}>
                                        <button
                                          onClick={() => toggleHeading(heading)}
                                          className="w-full flex items-center gap-2 p-2 pl-6 hover:bg-muted/50 rounded transition-colors"
                                        >
                                          {headingExpanded ? (
                                            <CaretDown className="h-3 w-3" />
                                          ) : (
                                            <CaretRight className="h-3 w-3" />
                                          )}
                                          <Hash className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-sm font-medium">{heading}</span>
                                          <Badge variant="outline" className="ml-auto text-xs">
                                            {codes.length}
                                          </Badge>
                                        </button>

                                        {headingExpanded && (
                                          <div className="pl-12 space-y-1 mt-1">
                                            {codes.map(code => (
                                              <button
                                                key={code.code8Digits}
                                                onClick={() => setSelectedItem({
                                                  id: `hs-${code.code8Digits}`,
                                                  type: 'hs_codes',
                                                  title: code.descriptionBa,
                                                  subtitle: code.descriptionEn,
                                                  code: code.code8Digits,
                                                  data: code
                                                })}
                                                className={cn(
                                                  "w-full text-left p-2 rounded hover:bg-accent/10 transition-colors",
                                                  selectedItem?.id === `hs-${code.code8Digits}` && "bg-accent/20"
                                                )}
                                              >
                                                <div className="flex items-start gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-mono text-primary">
                                                      {code.code8Digits}
                                                    </div>
                                                    <div className="text-sm truncate">
                                                      {code.descriptionBa}
                                                    </div>
                                                    {code.isActive && (
                                                      <Badge variant="outline" className="text-xs mt-1">
                                                        Active
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : viewMode === 'list' ? (
                      <div className="space-y-2">
                        {filteredItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                              selectedItem?.id === item.id && "bg-accent/20 border-accent"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {getItemIcon(item.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {item.code && (
                                    <span className="text-xs font-mono text-primary">
                                      {item.code}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {item.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="text-sm font-medium truncate">
                                  {item.title}
                                </div>
                                {item.subtitle && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {item.subtitle}
                                  </div>
                                )}
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.tags.slice(0, 3).map((tag, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {filteredItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={cn(
                              "text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors",
                              selectedItem?.id === item.id && "bg-accent/20 border-accent"
                            )}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              {getItemIcon(item.type)}
                              <Badge variant="outline" className="text-xs">
                                {item.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            {item.code && (
                              <div className="text-xs font-mono text-primary mb-1">
                                {item.code}
                              </div>
                            )}
                            <div className="text-sm font-medium line-clamp-2 mb-1">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {item.subtitle}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredItems.length === 0 && (
                      <div className="h-full flex items-center justify-center text-center p-8">
                        <div>
                          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {applyScriptVariant('Nema rezultata za odabrani filter', lang, scriptVariant)}
                          </p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {selectedItem && (
                <Card className="w-96 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getItemIcon(selectedItem.type)}
                        <CardTitle className="text-sm">
                          {applyScriptVariant('Detalji', lang, scriptVariant)}
                        </CardTitle>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            {applyScriptVariant('Tip', lang, scriptVariant)}
                          </label>
                          <Badge variant="outline" className="mt-1">
                            {selectedItem.type.replace('_', ' ')}
                          </Badge>
                        </div>

                        {selectedItem.code && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              HS Kod
                            </label>
                            <div className="mt-1 font-mono text-sm font-medium text-primary">
                              {selectedItem.code}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            {applyScriptVariant('Naziv', lang, scriptVariant)}
                          </label>
                          <div className="mt-1 text-sm">
                            {selectedItem.title}
                          </div>
                        </div>

                        {selectedItem.subtitle && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              {applyScriptVariant('Dodatno', lang, scriptVariant)}
                            </label>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {selectedItem.subtitle}
                            </div>
                          </div>
                        )}

                        {selectedItem.date && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <CalendarBlank className="h-3 w-3" />
                              Datum
                            </label>
                            <div className="mt-1 text-sm">
                              {new Date(selectedItem.date).toLocaleDateString('ba-BA')}
                            </div>
                          </div>
                        )}

                        {selectedItem.tags && selectedItem.tags.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Tagovi
                            </label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedItem.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        {selectedItem.type === 'hs_codes' && 'tariffInfo' in selectedItem.data && (
                          (() => {
                            const hsData = selectedItem.data as HSCode
                            return (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">
                                Tarifa
                              </label>
                              <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Carina:</span>{' '}
                                  <span className="font-medium">{hsData.tariffInfo.dutyRate}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">PDV:</span>{' '}
                                  <span className="font-medium">{hsData.tariffInfo.vatRate}</span>
                                </div>
                              </div>
                            </div>

                            {hsData.classificationCriteria && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Kriteriji Klasifikacije
                                </label>
                                <div className="mt-1 space-y-1 text-sm">
                                  {hsData.classificationCriteria.materialComposition && (
                                    <div className="text-muted-foreground">
                                      <span className="font-medium">Materijal:</span>{' '}
                                      {hsData.classificationCriteria.materialComposition}
                                    </div>
                                  )}
                                  {hsData.classificationCriteria.processingMethod && (
                                    <div className="text-muted-foreground">
                                      <span className="font-medium">Proces:</span>{' '}
                                      {hsData.classificationCriteria.processingMethod}
                                    </div>
                                  )}
                                  {hsData.classificationCriteria.endUse && (
                                    <div className="text-muted-foreground">
                                      <span className="font-medium">Upotreba:</span>{' '}
                                      {hsData.classificationCriteria.endUse}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                            )
                          })()
                        )}

                        {selectedItem.type === 'precedents' && isPrecedent(selectedItem.data) && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">
                                Izvor
                              </label>
                              <div className="mt-1">
                                <Badge variant="outline">{selectedItem.data.source}</Badge>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">
                                ID Slučaja
                              </label>
                              <div className="mt-1 text-sm font-mono">
                                {selectedItem.data.caseId}
                              </div>
                            </div>
                            {selectedItem.data.summary && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Sažetak
                                </label>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {selectedItem.data.summary}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedItem.type === 'examples' && isExample(selectedItem.data) && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">
                                Pouzdanost
                              </label>
                              <div className="mt-1">
                                <Badge variant={
                                  selectedItem.data.confidence === 'high' ? 'default' :
                                  selectedItem.data.confidence === 'medium' ? 'secondary' :
                                  'outline'
                                }>
                                  {selectedItem.data.confidence}
                                </Badge>
                              </div>
                            </div>
                            {selectedItem.data.reasoning && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Obrazloženje
                                </label>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {selectedItem.data.reasoning}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedItem.type === 'training' && isTraining(selectedItem.data) && (
                          <div className="space-y-3">
                            {selectedItem.data.context && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Kontekst
                                </label>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {selectedItem.data.context}
                                </div>
                              </div>
                            )}
                            {selectedItem.data.keyTerms && selectedItem.data.keyTerms.length > 0 && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Ključni Termini
                                </label>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {selectedItem.data.keyTerms.map((term: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {term}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
