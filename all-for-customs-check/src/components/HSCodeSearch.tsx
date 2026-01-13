import { useEffect, useMemo, useState } from 'react'
import type { Language, ScriptVariant } from '@/types'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MagnifyingGlass, Star, Translate } from '@phosphor-icons/react'
import { t, applyScriptVariant } from '@/lib/translations'
import { useScriptConverter } from '@/hooks/use-script-converter'
import { retrieveEvidence } from '@/lib/convexRetrieval'

interface HSCodeSearchProps {
  lang: Language
  hsDescLang: Language
  scriptVariant: ScriptVariant
  favorites: string[]
  onToggleFavorite: (code: string) => void
}

export function HSCodeSearch({
  lang,
  hsDescLang,
  scriptVariant,
  favorites,
  onToggleFavorite
}: HSCodeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const convertedQuery = applyScriptVariant(searchQuery, lang, scriptVariant)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{ code: string; snippet: string }>>([])

  const normalizedQuery = useMemo(() => convertedQuery.trim(), [convertedQuery])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!normalizedQuery) {
        setResults([])
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const retrieval = await retrieveEvidence(normalizedQuery, { limit: 8, include_parent: false })
        if (cancelled) return

        if (!retrieval.ok) {
          setResults([])
          setError(
            retrieval.reason === 'no_hits'
              ? applyScriptVariant('Nema pogodaka u korpusu za ovaj upit.', lang, scriptVariant)
              : applyScriptVariant('Pretraga nije dostupna u ovom trenutku.', lang, scriptVariant)
          )
          return
        }

        const extracted: Array<{ code: string; snippet: string }> = []
        const seen = new Set<string>()

        for (const r of retrieval.results) {
          const text = r.chunk.text
          // Extract 8- or 10-digit HS/TARIC patterns, with optional spacing.
          const matches = text.match(/\b\d{4}(?:\s?\d{2}){2,3}\b/g) ?? []
          for (const m of matches) {
            const digits = m.replace(/\D/g, '')
            if (digits.length < 8) continue
            const hs8 = `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`
            if (seen.has(hs8)) continue
            seen.add(hs8)
            extracted.push({
              code: hs8,
              snippet: text.slice(0, 220).trim(),
            })
            if (extracted.length >= 40) break
          }
          if (extracted.length >= 40) break
        }

        setResults(extracted)
      } catch (e) {
        if (cancelled) return
        setResults([])
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [normalizedQuery, lang, scriptVariant])

  const SnippetText = ({ text }: { text: string }) => {
    const convertedText = useScriptConverter(text, hsDescLang, scriptVariant)
    return <>{convertedText}</>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">{t('search', lang)}</h2>
          {(lang === 'ba' || lang === 'sr') && searchQuery.trim() && (
            <div className="mb-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-help px-2 py-1 rounded-md bg-muted/50 inline-flex">
                    <Translate size={14} weight="duotone" />
                    <span>{t('scriptVariant', lang)}: <span className="font-medium">{scriptVariant === 'latin' ? t('latinScript', lang) : t('cyrillicScript', lang)}</span></span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{t('autoConvertNotice', lang)}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder', lang)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {!normalizedQuery ? (
              <div className="text-center py-12 text-muted-foreground">
                {applyScriptVariant('Unesi upit za pretragu (HS kod ili tekst).', lang, scriptVariant)}
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-muted-foreground">
                {applyScriptVariant('Pretražujem korpus…', lang, scriptVariant)}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                {error}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('noResults', lang)}
              </div>
            ) : (
              results.map(item => {
                const isFavorite = favorites.includes(item.code)

                return (
                  <Card key={item.code} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3">
                            <code className="font-mono text-xl">{item.code}</code>
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleFavorite(item.code)}
                        >
                          <Star size={20} weight={isFavorite ? 'fill' : 'regular'} className={isFavorite ? 'text-warning' : ''} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium mb-1">{applyScriptVariant('Izvod iz korpusa', lang, scriptVariant)}:</p>
                        <p className="text-sm"><SnippetText text={item.snippet} /></p>
                      </div>

                      <Separator />
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
