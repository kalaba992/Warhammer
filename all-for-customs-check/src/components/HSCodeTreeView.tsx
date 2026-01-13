import { useState, useMemo } from 'react'
import type { Language, ScriptVariant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  TreeStructure,
  CaretRight,
  CaretDown,
  MagnifyingGlass,
  ChartBar,
  Star
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'
import { cn } from '@/lib/utils'

interface HSCodeTreeViewProps {
  lang: Language
  scriptVariant: ScriptVariant
  favorites: string[]
  onToggleFavorite: (code: string) => void
  onSelectCode?: (code: string) => void
}

interface ChapterNode {
  chapter: number
  title: string
  count: number
  codes: string[]
}

export function HSCodeTreeView({
  lang,
  scriptVariant,
  favorites,
  onToggleFavorite,
  onSelectCode
}: HSCodeTreeViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  // Demo HS tree data removed. A structured HS dataset (chapters/headings/subheadings)
  // should be provided from Convex for this view to be meaningful.
  const chapterNodes = useMemo<ChapterNode[]>(() => [], [])
  const filteredChapters = useMemo(() => [], [chapterNodes, searchQuery])

  const toggleChapter = (chapter: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapter)) next.delete(chapter)
      else next.add(chapter)
      return next
    })
  }

  const handleCodeClick = (code: string) => {
    setSelectedCode(code)
    onSelectCode?.(code)
  }

  const totalCodes = 0
  const totalFavorites = favorites.length

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <TreeStructure className="h-8 w-8 text-primary" weight="bold" />
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {applyScriptVariant('HS Code Tree View', lang, scriptVariant)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {applyScriptVariant('Hierarchical Browse & Navigation', lang, scriptVariant)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Card className="flex-1">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <ChartBar className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {applyScriptVariant('Total HS Codes', lang, scriptVariant)}
                </p>
                <p className="text-xl font-semibold font-mono">{totalCodes}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Star className="h-5 w-5 text-warning" weight="fill" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {applyScriptVariant('Favorites', lang, scriptVariant)}
                </p>
                <p className="text-xl font-semibold font-mono">{totalFavorites}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative mt-4">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={applyScriptVariant('Search chapters or codes...', lang, scriptVariant)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {applyScriptVariant(
                'HS Tree View zahtijeva strukturiranu HS/TARIC bazu (poglavlja/pozicije/podpozicije) iz Convex-a. Trenutno nije dostupno u ovoj aplikaciji.',
                lang,
                scriptVariant
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
