import { useMemo } from 'react'
import type { ClassificationHistory, Language, ScriptVariant } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartLine,
  CheckCircle,
  Warning,
  XCircle,
  TrendUp,
  Star,
  ListNumbers
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'

interface ClassificationStatisticsProps {
  history: ClassificationHistory[]
  lang: Language
  scriptVariant: ScriptVariant
}

export function ClassificationStatistics({
  history,
  lang,
  scriptVariant
}: ClassificationStatisticsProps) {
  const convert = (text: string) => applyScriptVariant(text, lang, scriptVariant)

  const statistics = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        total: 0,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        avgDefensibilityScore: 0,
        favorites: 0,
        last24Hours: 0,
        topChapters: [],
        recentTrend: 0
      }
    }

    const highConf = history.filter(h => h.result.confidence === 'high').length
    const mediumConf = history.filter(h => h.result.confidence === 'medium').length
    const lowConf = history.filter(h => h.result.confidence === 'low').length

    const avgScore = history.reduce((sum, h) => sum + h.result.defensibilityScore, 0) / history.length

    const favCount = history.filter(h => h.isFavorite).length

    const now = Date.now()
    const last24h = history.filter(h => now - h.timestamp < 24 * 60 * 60 * 1000).length

    const chapterCounts: Record<string, number> = {}
    history.forEach(h => {
      const chapter = h.result.hsCode.slice(0, 2)
      chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1
    })

    const topChapters = Object.entries(chapterCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([chapter, count]) => ({ chapter, count }))

    const last7Days = history.filter(h => now - h.timestamp < 7 * 24 * 60 * 60 * 1000).length
    const prev7Days = history.filter(h => {
      const age = now - h.timestamp
      return age >= 7 * 24 * 60 * 60 * 1000 && age < 14 * 24 * 60 * 60 * 1000
    }).length

    const trend = prev7Days === 0 ? 100 : ((last7Days - prev7Days) / prev7Days) * 100

    return {
      total: history.length,
      highConfidence: highConf,
      mediumConfidence: mediumConf,
      lowConfidence: lowConf,
      avgDefensibilityScore: avgScore,
      favorites: favCount,
      last24Hours: last24h,
      topChapters,
      recentTrend: trend
    }
  }, [history])

  const highConfPercentage = statistics.total > 0 
    ? (statistics.highConfidence / statistics.total) * 100 
    : 0
  const mediumConfPercentage = statistics.total > 0 
    ? (statistics.mediumConfidence / statistics.total) * 100 
    : 0
  const lowConfPercentage = statistics.total > 0 
    ? (statistics.lowConfidence / statistics.total) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {convert('Ukupno Klasifikacija')}
            </CardTitle>
            <ListNumbers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.last24Hours} {convert('u zadnjih 24h')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {convert('Prosječan Defensive Score')}
            </CardTitle>
            <ChartLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.avgDefensibilityScore.toFixed(1)}/10
            </div>
            <Progress 
              value={statistics.avgDefensibilityScore * 10} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {convert('Visoka Pouzdanost')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-accent" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.highConfidence}</div>
            <p className="text-xs text-muted-foreground">
              {highConfPercentage.toFixed(1)}% {convert('od ukupnog broja')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {convert('Omiljene')}
            </CardTitle>
            <Star className="h-4 w-4 text-warning" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.favorites}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.total > 0 ? ((statistics.favorites / statistics.total) * 100).toFixed(1) : 0}% {convert('označeno')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{convert('Distribucija Pouzdanosti')}</CardTitle>
            <CardDescription>
              {convert('Razdioba klasifikacija po nivou pouzdanosti')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" weight="fill" />
                  <span>{convert('Visoka')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statistics.highConfidence}</span>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
                    {highConfPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={highConfPercentage} className="h-2 bg-accent/20" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Warning className="h-4 w-4 text-warning" weight="fill" />
                  <span>{convert('Srednja')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statistics.mediumConfidence}</span>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                    {mediumConfPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={mediumConfPercentage} className="h-2 bg-warning/20" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" weight="fill" />
                  <span>{convert('Niska')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statistics.lowConfidence}</span>
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                    {lowConfPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={lowConfPercentage} className="h-2 bg-destructive/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{convert('Top 5 Poglavlja')}</CardTitle>
            <CardDescription>
              {convert('Najčešće klasificirani HS kodovi po poglavljima')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {statistics.topChapters.length > 0 ? (
                  statistics.topChapters.map((item, index) => {
                    const percentage = (item.count / statistics.total) * 100
                    return (
                      <div key={item.chapter} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                              {index + 1}
                            </div>
                            <span className="font-mono font-semibold">{convert('Poglavlje')} {item.chapter}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.count}</span>
                            <Badge variant="secondary" className="text-xs">
                              {percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {convert('Nema dostupnih podataka')}
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{convert('Trend Klasifikacija')}</CardTitle>
            <CardDescription>
              {convert('Promjena broja klasifikacija u odnosu na prethodnu sedmicu')}
            </CardDescription>
          </div>
          <TrendUp className={`h-5 w-5 ${statistics.recentTrend >= 0 ? 'text-accent' : 'text-destructive'}`} />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${statistics.recentTrend >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {statistics.recentTrend >= 0 ? '+' : ''}{statistics.recentTrend.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">
              {convert('u zadnjih 7 dana')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
