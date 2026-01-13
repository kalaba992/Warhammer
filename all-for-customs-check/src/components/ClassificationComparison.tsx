import { useState } from 'react'
import type { ClassificationHistory, Language, ScriptVariant } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  ArrowsLeftRight,
  CheckCircle,
  Warning,
  XCircle,
  ShieldCheck,
  Scales,
  X,
  Minus,
  ChartBar,
  ListChecks,
  GitDiff,
  Target,
  BookOpen
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'
import { cn } from '@/lib/utils'

interface ClassificationComparisonProps {
  history: ClassificationHistory[]
  lang: Language
  scriptVariant: ScriptVariant
}

export function ClassificationComparison({
  history,
  lang,
  scriptVariant
}: ClassificationComparisonProps) {
  const [selectedItems, setSelectedItems] = useState<ClassificationHistory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const convert = (text: string) => applyScriptVariant(text, lang, scriptVariant)

  const handleSelectItem = (itemId: string) => {
    const item = history.find(h => h.id === itemId)
    if (!item) return

    if (selectedItems.find(i => i.id === itemId)) {
      setSelectedItems(prev => prev.filter(i => i.id !== itemId))
    } else {
      if (selectedItems.length < 3) {
        setSelectedItems(prev => [...prev, item])
      }
    }
  }

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== itemId))
  }

  const handleClear = () => {
    setSelectedItems([])
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle className="h-5 w-5 text-accent" weight="fill" />
      case 'medium':
        return <Warning className="h-5 w-5 text-warning" weight="fill" />
      case 'low':
        return <XCircle className="h-5 w-5 text-destructive" weight="fill" />
      default:
        return null
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-accent/10 text-accent border-accent'
      case 'medium':
        return 'bg-warning/10 text-warning border-warning'
      case 'low':
        return 'bg-destructive/10 text-destructive border-destructive'
      default:
        return ''
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(lang === 'ba' ? 'bs-BA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const analyzeDifferences = () => {
    if (selectedItems.length < 2) return null

    const differences = {
      sameChapter: selectedItems.every(item => 
        item.result.hsCode.slice(0, 2) === selectedItems[0].result.hsCode.slice(0, 2)
      ),
      sameHeading: selectedItems.every(item => 
        item.result.hsCode.slice(0, 4) === selectedItems[0].result.hsCode.slice(0, 4)
      ),
      sameSubheading: selectedItems.every(item => 
        item.result.hsCode.slice(0, 7) === selectedItems[0].result.hsCode.slice(0, 7)
      ),
      exactMatch: selectedItems.every(item => 
        item.result.hsCode === selectedItems[0].result.hsCode
      ),
      avgDefensibilityScore: (
        selectedItems.reduce((sum, item) => sum + item.result.defensibilityScore, 0) / selectedItems.length
      ).toFixed(1),
      highConfidenceCount: selectedItems.filter(i => i.result.confidence === 'high').length,
      mediumConfidenceCount: selectedItems.filter(i => i.result.confidence === 'medium').length,
      lowConfidenceCount: selectedItems.filter(i => i.result.confidence === 'low').length,
      uniqueChapters: new Set(selectedItems.map(i => i.result.hsCode.slice(0, 2))).size,
      hasVerificationHash: selectedItems.filter(i => i.result.verificationHash).length,
      avgReasoningCount: (
        selectedItems.reduce((sum, item) => sum + item.result.reasoning.length, 0) / selectedItems.length
      ).toFixed(1),
      allPassed: selectedItems.every(item => 
        item.result.validationLayers.every(layer => layer.passed)
      )
    }

    return differences
  }

  const compareValidationLayers = () => {
    if (selectedItems.length === 0) return []

    const layers = ['zero_tolerance', 'anti_hallucination', 'hierarchical']
    return layers.map(layerType => {
      const results = selectedItems.map(item => {
        const layer = item.result.validationLayers.find(l => l.layer === layerType)
        return {
          item,
          passed: layer?.passed ?? false,
          details: layer?.details ?? '',
          trustScore: layer?.trustScore
        }
      })
      return {
        layer: layerType,
        results
      }
    })
  }

  const findCommonReasons = () => {
    if (selectedItems.length < 2) return []

    const allReasons = selectedItems.map(item => 
      item.result.reasoning.map(r => r.toLowerCase().trim())
    )

    const commonReasons = allReasons[0].filter(reason =>
      allReasons.every(reasons => reasons.includes(reason))
    )

    return commonReasons
  }

  const findUniqueDifferences = () => {
    if (selectedItems.length < 2) return []

    return selectedItems.map((item, index) => {
      const otherItems = selectedItems.filter((_, i) => i !== index)
      const uniqueReasons = item.result.reasoning.filter(reason =>
        !otherItems.some(other => 
          other.result.reasoning.some(r => r.toLowerCase().trim() === reason.toLowerCase().trim())
        )
      )
      return {
        item,
        uniqueReasons
      }
    })
  }

  const analysis = analyzeDifferences()
  const validationComparison = compareValidationLayers()
  const commonReasons = findCommonReasons()
  const uniqueDifferences = findUniqueDifferences()

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowsLeftRight className="h-4 w-4" />
          {convert('Uporedi Klasifikacije')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scales className="h-5 w-5" />
            {convert('Uporedna Analiza Klasifikacija')}
          </DialogTitle>
          <DialogDescription>
            {convert('Izaberite do 3 klasifikacije za detaljnu uporednu analizu sa vizuelnim poređenjem')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select onValueChange={handleSelectItem}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={convert('Izaberite klasifikaciju za uporedbu...')} />
              </SelectTrigger>
              <SelectContent>
                {history.slice(0, 50).map((item) => (
                  <SelectItem 
                    key={item.id} 
                    value={item.id}
                    disabled={selectedItems.find(i => i.id === item.id) !== undefined}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{item.result.hsCode}</span>
                      <span className="text-xs text-muted-foreground">-</span>
                      <span className="truncate max-w-[300px]">
                        {item.productDescription.slice(0, 60)}
                        {item.productDescription.length > 60 ? '...' : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedItems.length > 0 && (
              <Button variant="outline" size="icon" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedItems.map((item) => (
                <Badge 
                  key={item.id} 
                  variant="secondary"
                  className="gap-2 py-2 px-3"
                >
                  <span className="font-mono">{item.result.hsCode}</span>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {selectedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowsLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{convert('Izaberite klasifikacije za uporedbu')}</p>
              <p className="text-sm mt-2">
                {convert('Možete izabrati do 3 klasifikacije za detaljnu analizu')}
              </p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="gap-2">
                  <ChartBar className="h-4 w-4" />
                  {convert('Pregled')}
                </TabsTrigger>
                <TabsTrigger value="side-by-side" className="gap-2">
                  <GitDiff className="h-4 w-4" />
                  {convert('Uporedno')}
                </TabsTrigger>
                <TabsTrigger value="validation" className="gap-2">
                  <ListChecks className="h-4 w-4" />
                  {convert('Validacija')}
                </TabsTrigger>
                <TabsTrigger value="differences" className="gap-2">
                  <Target className="h-4 w-4" />
                  {convert('Razlike')}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(95vh-16rem)] mt-4">
                <TabsContent value="overview" className="mt-0 space-y-4">
                  {analysis && (
                    <>
                      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ChartBar className="h-5 w-5" />
                            {convert('Statistička Analiza')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{convert('Prosječan Defensive Score')}</p>
                              <p className="text-2xl font-bold">
                                {analysis.avgDefensibilityScore}
                                <span className="text-sm font-normal text-muted-foreground">/10</span>
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{convert('Visoka Pouzdanost')}</p>
                              <p className="text-2xl font-bold text-accent">
                                {analysis.highConfidenceCount}
                                <span className="text-sm font-normal text-muted-foreground">/{selectedItems.length}</span>
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{convert('Različita Poglavlja')}</p>
                              <p className="text-2xl font-bold">
                                {analysis.uniqueChapters}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">{convert('Prošla Validaciju')}</p>
                              <p className="text-2xl font-bold">
                                {analysis.allPassed ? (
                                  <CheckCircle className="h-8 w-8 text-accent" weight="fill" />
                                ) : (
                                  <Warning className="h-8 w-8 text-warning" weight="fill" />
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            {convert('Podudarnost HS Kodova')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{convert('Isto Poglavlje (2 cifre)')}</span>
                            {analysis.sameChapter ? (
                              <Badge className="gap-1 bg-accent/10 text-accent border-accent">
                                <CheckCircle className="h-3 w-3" weight="fill" />
                                {convert('Da')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                {convert('Ne')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{convert('Ista Pozicija (4 cifre)')}</span>
                            {analysis.sameHeading ? (
                              <Badge className="gap-1 bg-accent/10 text-accent border-accent">
                                <CheckCircle className="h-3 w-3" weight="fill" />
                                {convert('Da')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                {convert('Ne')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{convert('Ista Podpozicija (6 cifara)')}</span>
                            {analysis.sameSubheading ? (
                              <Badge className="gap-1 bg-accent/10 text-accent border-accent">
                                <CheckCircle className="h-3 w-3" weight="fill" />
                                {convert('Da')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                {convert('Ne')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{convert('Identičan Kod (8 cifara)')}</span>
                            {analysis.exactMatch ? (
                              <Badge className="gap-1 bg-accent/10 text-accent border-accent">
                                <CheckCircle className="h-3 w-3" weight="fill" />
                                {convert('Da')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                {convert('Ne')}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-accent" />
                              {convert('Visoka')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold">{analysis.highConfidenceCount}</p>
                            <Progress value={(analysis.highConfidenceCount / selectedItems.length) * 100} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-warning" />
                              {convert('Srednja')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold">{analysis.mediumConfidenceCount}</p>
                            <Progress value={(analysis.mediumConfidenceCount / selectedItems.length) * 100} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-destructive" />
                              {convert('Niska')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold">{analysis.lowConfidenceCount}</p>
                            <Progress value={(analysis.lowConfidenceCount / selectedItems.length) * 100} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="side-by-side" className="mt-0">
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedItems.length}, minmax(0, 1fr))` }}>
                    {selectedItems.map((item, index) => (
                      <Card key={item.id} className="relative">
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="font-mono">{item.result.hsCode}</span>
                            {getConfidenceIcon(item.result.confidence)}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {formatDate(item.timestamp)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {convert('Opis Proizvoda')}
                            </p>
                            <p className="text-sm">
                              {convert(item.productDescription)}
                            </p>
                          </div>

                          <Separator />

                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              {convert('Pouzdanost')}
                            </p>
                            <Badge variant="outline" className={cn("capitalize", getConfidenceColor(item.result.confidence))}>
                              {item.result.confidence === 'high' ? convert('Visoka') : 
                               item.result.confidence === 'medium' ? convert('Srednja') : convert('Niska')}
                            </Badge>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              {convert('Defensive Score')}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold font-mono">
                                {item.result.defensibilityScore}
                              </span>
                              <span className="text-sm text-muted-foreground">/10</span>
                            </div>
                            <Progress 
                              value={item.result.defensibilityScore * 10} 
                              className="h-2 mt-2"
                            />
                          </div>

                          <Separator />

                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              {convert('Obrazloženje')}
                            </p>
                            <ul className="space-y-1.5">
                              {item.result.reasoning.map((reason, idx) => (
                                <li key={idx} className="text-xs flex gap-2">
                                  <span className="text-accent">•</span>
                                  <span>{convert(reason)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {item.result.legalBasis && (
                            <>
                              <Separator />
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  {convert('Pravna Osnova')}
                                </p>
                                <div className="space-y-1 text-xs">
                                  {item.result.legalBasis.wco && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">WCO:</span>
                                      <span className="font-medium">{item.result.legalBasis.wco}</span>
                                    </div>
                                  )}
                                  {item.result.legalBasis.taric && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">TARIC:</span>
                                      <span className="font-medium">{item.result.legalBasis.taric}</span>
                                    </div>
                                  )}
                                  {item.result.legalBasis.euCuria && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">EU Curia:</span>
                                      <span className="font-medium">{item.result.legalBasis.euCuria}</span>
                                    </div>
                                  )}
                                  {item.result.legalBasis.uioBih && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">UIO BiH:</span>
                                      <span className="font-medium">{item.result.legalBasis.uioBih}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {item.result.verificationHash && (
                            <>
                              <Separator />
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {convert('Verification Hash')}
                                </p>
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                                  {item.result.verificationHash}
                                </code>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="mt-0 space-y-4">
                  {validationComparison.map((layerComparison) => (
                    <Card key={layerComparison.layer}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5" />
                          {layerComparison.layer === 'zero_tolerance' && convert('Zero Tolerance Blocker')}
                          {layerComparison.layer === 'anti_hallucination' && convert('Anti-Hallucination Validator')}
                          {layerComparison.layer === 'hierarchical' && convert('Hierarchical Validator')}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {layerComparison.layer === 'zero_tolerance' && convert('Apsolutna validacija - 0% tolerancija za halucinacije')}
                          {layerComparison.layer === 'anti_hallucination' && convert('Soft validacija sa trust score-om')}
                          {layerComparison.layer === 'hierarchical' && convert('Provjera 4→6→8 digit konzistentnosti')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedItems.length}, minmax(0, 1fr))` }}>
                          {layerComparison.results.map((result, index) => (
                            <div key={result.item.id} className={cn(
                              "p-3 rounded-lg border-2",
                              result.passed ? "bg-accent/5 border-accent/30" : "bg-destructive/5 border-destructive/30"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium">#{index + 1}</span>
                                {result.passed ? (
                                  <CheckCircle className="h-5 w-5 text-accent" weight="fill" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-destructive" weight="fill" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{result.details}</p>
                              {result.trustScore !== undefined && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium mb-1">{convert('Trust Score')}</p>
                                  <Progress value={result.trustScore * 100} className="h-1.5" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="differences" className="mt-0 space-y-4">
                  {commonReasons.length > 0 && (
                    <Card className="bg-accent/5 border-accent/30">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          {convert('Zajednička Obrazloženja')}
                        </CardTitle>
                        <CardDescription>
                          {convert('Argumenti koji se pojavljuju u svim klasifikacijama')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {commonReasons.map((reason, idx) => (
                            <li key={idx} className="flex gap-2 text-sm">
                              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" weight="fill" />
                              <span>{convert(reason)}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {uniqueDifferences.map((diff, index) => (
                    <Card key={diff.item.id}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-mono">{diff.item.result.hsCode}</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {convert('Jedinstvena obrazloženja koja se ne pojavljuju u drugim klasifikacijama')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {diff.uniqueReasons.length > 0 ? (
                          <ul className="space-y-2">
                            {diff.uniqueReasons.map((reason, idx) => (
                              <li key={idx} className="flex gap-2 text-sm">
                                <Minus className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <span>{convert(reason)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            {convert('Nema jedinstvenih obrazloženja - sva se pojavljuju i u drugim klasifikacijama')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
