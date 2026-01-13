import { useMemo, useState, useCallback } from 'react'
import type { ClassificationHistory, Language, ScriptVariant } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import {
  ChartLine,
  ChartPie,
  ChartBar,
  TrendUp,
  Calendar
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'

interface AdvancedDashboardProps {
  history: ClassificationHistory[]
  lang: Language
  scriptVariant: ScriptVariant
}

export function AdvancedDashboard({
  history,
  lang,
  scriptVariant
}: AdvancedDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const convert = useCallback((text: string) => applyScriptVariant(text, lang, scriptVariant), [lang, scriptVariant])

  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') return history

    const now = Date.now()
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }
    
    return history.filter(h => now - h.timestamp < ranges[timeRange])
  }, [history, timeRange])

  const confidenceData = useMemo(() => {
    const high = filteredHistory.filter(h => h.result.confidence === 'high').length
    const medium = filteredHistory.filter(h => h.result.confidence === 'medium').length
    const low = filteredHistory.filter(h => h.result.confidence === 'low').length

    return [
      { name: convert('Visoka'), value: high, color: 'oklch(0.55 0.15 155)' },
      { name: convert('Srednja'), value: medium, color: 'oklch(0.70 0.15 75)' },
      { name: convert('Niska'), value: low, color: 'oklch(0.55 0.22 25)' }
    ]
  }, [filteredHistory, convert])

  const chapterDistribution = useMemo(() => {
    const chapters: Record<string, number> = {}
    
    filteredHistory.forEach(h => {
      const chapter = h.result.hsCode.slice(0, 2)
      chapters[chapter] = (chapters[chapter] || 0) + 1
    })

    return Object.entries(chapters)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([chapter, count]) => ({
        chapter: `${convert('Pog.')} ${chapter}`,
        count,
        fullLabel: `${convert('Poglavlje')} ${chapter}`
      }))
  }, [filteredHistory, convert])

  const defensibilityDistribution = useMemo(() => {
    const ranges = {
      '9-10': 0,
      '7-8': 0,
      '5-6': 0,
      '3-4': 0,
      '1-2': 0
    }

    filteredHistory.forEach(h => {
      const score = h.result.defensibilityScore
      if (score >= 9) ranges['9-10']++
      else if (score >= 7) ranges['7-8']++
      else if (score >= 5) ranges['5-6']++
      else if (score >= 3) ranges['3-4']++
      else ranges['1-2']++
    })

    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count
    }))
  }, [filteredHistory])

  const timelineData = useMemo(() => {
    if (filteredHistory.length === 0) return []

    const dataPoints: Record<string, { date: string; count: number }> = {}
    
    filteredHistory.forEach(h => {
      const date = new Date(h.timestamp)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      
      if (!dataPoints[dateKey]) {
        dataPoints[dateKey] = { date: dateKey, count: 0 }
      }
      dataPoints[dateKey].count++
    })

    return Object.values(dataPoints)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString(lang === 'ba' ? 'bs-BA' : 'en-US', {
          month: 'short',
          day: 'numeric'
        })
      }))
  }, [filteredHistory, lang])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{label}</p>
          <p className="text-sm text-accent">
            {convert('Broj')}: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">{convert('Napredna Analitika')}</h2>
          <p className="text-muted-foreground mt-1">
            {convert('Vizuelni pregled performansi klasifikacija')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={(v: '7d' | '30d' | '90d' | 'all') => setTimeRange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{convert('Zadnjih 7 dana')}</SelectItem>
              <SelectItem value="30d">{convert('Zadnjih 30 dana')}</SelectItem>
              <SelectItem value="90d">{convert('Zadnjih 90 dana')}</SelectItem>
              <SelectItem value="all">{convert('Sve vrijeme')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <ChartLine className="h-4 w-4" />
            {convert('Pregled')}
          </TabsTrigger>
          <TabsTrigger value="confidence" className="gap-2">
            <ChartPie className="h-4 w-4" />
            {convert('Pouzdanost')}
          </TabsTrigger>
          <TabsTrigger value="chapters" className="gap-2">
            <ChartBar className="h-4 w-4" />
            {convert('Poglavlja')}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <TrendUp className="h-4 w-4" />
            {convert('Trend')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{convert('Distribucija Pouzdanosti')}</CardTitle>
                <CardDescription>
                  {convert('Razdioba po nivou pouzdanosti klasifikacija')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={confidenceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{convert('Defensive Score Distribucija')}</CardTitle>
                <CardDescription>
                  {convert('Razdioba po opsezima defensive score-a')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={defensibilityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="oklch(0.25 0.08 250)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="confidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{convert('Analiza Pouzdanosti')}</CardTitle>
              <CardDescription>
                {convert('Detaljni pregled nivoa pouzdanosti klasifikacija')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={confidenceData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${((percent ?? 0) * 100).toFixed(1)}%)`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {confidenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid gap-3">
                {confidenceData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-sm" 
                          style={{ backgroundColor: item.color }}
                        />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge variant="outline">{item.value} {convert('klasifikacija')}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{convert('Top 10 Poglavlja')}</CardTitle>
              <CardDescription>
                {convert('Najčešće korištena HS poglavlja')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chapterDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="chapter" type="category" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="oklch(0.55 0.15 155)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{convert('Trend Klasifikacija')}</CardTitle>
              <CardDescription>
                {convert('Dnevni broj klasifikacija u odabranom periodu')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="oklch(0.25 0.08 250)" 
                    strokeWidth={2}
                    name={convert('Klasifikacije')}
                  />
                </LineChart>
              </ResponsiveContainer>
              {timelineData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {convert('Nema podataka za odabrani period')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
