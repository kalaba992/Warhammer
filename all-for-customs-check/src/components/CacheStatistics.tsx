import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Lightning, 
  Clock, 
  Trash,
  CheckCircle
} from '@phosphor-icons/react'
import { getCacheStatistics, clearExpiredCache } from '@/lib/classificationCache'
import { toast } from 'sonner'

export function CacheStatistics() {
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalUsage: 0,
    averageAge: 0,
    oldestEntry: 0,
    newestEntry: 0
  })
  const [isClearing, setIsClearing] = useState(false)

  const loadStats = async () => {
    const cacheStats = await getCacheStatistics()
    setStats(cacheStats)
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleClearExpired = async () => {
    setIsClearing(true)
    try {
      const removed = await clearExpiredCache()
      toast.success(`Uklonjeno ${removed} isteklih zapisa iz keša`)
      await loadStats()
    } catch {
      toast.error('Greška pri čišćenju keša')
    } finally {
      setIsClearing(false)
    }
  }

  const formatAge = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h`
    return '< 1h'
  }

  const cacheUsagePercent = (stats.totalEntries / 500) * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-accent" weight="bold" />
            <div>
              <CardTitle>Smart Classification Cache</CardTitle>
              <CardDescription>
                Intelligent caching with similarity matching
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Lightning size={14} weight="fill" className="text-accent" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Database size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">Cached Entries</span>
            </div>
            <p className="text-2xl font-bold font-mono">
              {stats.totalEntries} <span className="text-sm font-normal text-muted-foreground">/ 500</span>
            </p>
          </div>

          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-accent" weight="fill" />
              <span className="text-xs text-muted-foreground">Total Usage</span>
            </div>
            <p className="text-2xl font-bold font-mono">{stats.totalUsage}</p>
          </div>

          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Average Age</span>
            </div>
            <p className="text-lg font-semibold">{formatAge(stats.averageAge)}</p>
          </div>

          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Oldest Entry</span>
            </div>
            <p className="text-lg font-semibold">{formatAge(stats.oldestEntry)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cache Usage</span>
            <span className="font-mono">{cacheUsagePercent.toFixed(1)}%</span>
          </div>
          <Progress value={cacheUsagePercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {500 - stats.totalEntries} slots available
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleClearExpired}
          disabled={isClearing}
        >
          <Trash size={16} />
          {isClearing ? 'Clearing...' : 'Clear Expired Cache (90+ days)'}
        </Button>

        <div className="text-xs text-muted-foreground bg-accent/5 p-3 rounded-md">
          <strong>How it works:</strong> Repeated or similar product descriptions are instantly
          retrieved from cache, improving classification speed and ensuring consistency.
          Cache uses Jaccard + Levenshtein similarity matching with 85% threshold.
        </div>
      </CardContent>
    </Card>
  )
}
