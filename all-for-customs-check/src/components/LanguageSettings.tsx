import type { UserPreferences, Language, ScriptVariant } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SUPPORTED_LANGUAGES, t, applyScriptVariant } from '@/lib/translations'
import { GlobeHemisphereWest, CheckCircle, Translate, ChatCircle, FileText, TextAa } from '@phosphor-icons/react'
import { CacheStatistics } from '@/components/CacheStatistics'
import { DiagnosticsPanel } from '@/components/DiagnosticsPanel'

interface LanguageSettingsProps {
  preferences: UserPreferences
  onUpdatePreferences: (prefs: UserPreferences) => void
  lang: Language
}

const languageIcons: Record<Language, string> = {
  ba: '🇧🇦',
  en: '🇬🇧',
  de: '🇩🇪',
  hr: '🇭🇷',
  sr: '🇷🇸',
  sk: '🇸🇰',
  sl: '🇸🇮',
  al: '🇦🇱',
  mk: '🇲🇰',
  fr: '🇫🇷',
  es: '🇪🇸',
  it: '🇮🇹'
}

export function LanguageSettings({
  preferences,
  onUpdatePreferences,
  lang
}: LanguageSettingsProps) {
  const handleLanguageChange = (type: keyof UserPreferences, value: Language | ScriptVariant) => {
    onUpdatePreferences({
      ...preferences,
      [type]: value
    })
  }

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang)
  const supportsScriptVariant = currentLangInfo?.supportsScriptVariant
  const scriptVariant = preferences.scriptVariant || 'latin'

  return (
    <div className="flex flex-col h-full overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-accent/10">
              <GlobeHemisphereWest size={32} className="text-accent" weight="duotone" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">
                {t('settings', lang)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentLangInfo ? `${languageIcons[lang]} ${currentLangInfo.name}` : 'Language Settings'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Alert className="bg-accent/5 border-accent/20">
            <CheckCircle className="h-5 w-5 text-accent" weight="fill" />
            <AlertDescription className="text-sm">
              {scriptVariant === 'latin' ? (
                <>
                  {lang === 'ba' && 'Podržavamo 12 jezika za potpunu multilateralnu fleksibilnost. Promjene se primjenjuju odmah.'}
                  {lang === 'en' && 'We support 12 languages for full multilingual flexibility. Changes apply immediately.'}
                  {lang === 'de' && 'Wir unterstützen 12 Sprachen für volle mehrsprachige Flexibilität. Änderungen werden sofort angewendet.'}
                  {lang === 'hr' && 'Podržavamo 12 jezika za potpunu višejezičnu fleksibilnost. Promjene se primjenjuju odmah.'}
                  {lang === 'sr' && 'Podržavamo 12 jezika za potpunu višejezičku fleksibilnost. Promene se primenjuju odmah.'}
                  {lang === 'sk' && 'Podporujeme 12 jazykov pre plnú viacjazyčnú flexibilitu. Zmeny sa aplikujú okamžite.'}
                  {lang === 'sl' && 'Podpiramo 12 jezikov za polno večjezično fleksibilnost. Spremembe se uporabijo takoj.'}
                  {lang === 'al' && 'Mbështesim 12 gjuhë për fleksibilitet të plotë shumëgjuhësor. Ndryshimet aplikohen menjëherë.'}
                  {lang === 'mk' && 'Поддржуваме 12 јазици за целосна повеќејазична флексибилност. Промените се применуваат веднаш.'}
                  {lang === 'fr' && 'Nous prenons en charge 12 langues pour une flexibilité multilingue complète. Les modifications sont appliquées immédiatement.'}
                  {lang === 'es' && 'Admitimos 12 idiomas para una flexibilidad multilingüe completa. Los cambios se aplican de inmediato.'}
                  {lang === 'it' && 'Supportiamo 12 lingue per una completa flessibilità multilingue. Le modifiche vengono applicate immediatamente.'}
                </>
              ) : (
                <>
                  {lang === 'ba' && 'Подржавамо 12 језика за потпуну мултилатералну флексибилност. Промјене се примјењују одмах.'}
                  {lang === 'en' && 'We support 12 languages for full multilingual flexibility. Changes apply immediately.'}
                  {lang === 'de' && 'Wir unterstützen 12 Sprachen für volle mehrsprachige Flexibilität. Änderungen werden sofort angewendet.'}
                  {lang === 'hr' && 'Podržavamo 12 jezika za potpunu višejezičnu fleksibilnost. Promjene se primjenjuju odmah.'}
                  {lang === 'sr' && 'Подржавамо 12 језика за потпуну вишејезичку флексибилност. Промене се примењују одмах.'}
                  {lang === 'sk' && 'Podporujeme 12 jazykov pre plnú viacjazyčnú flexibilitu. Zmeny sa aplikujú okamžite.'}
                  {lang === 'sl' && 'Podpiramo 12 jezikov za polno večjezično fleksibilnost. Spremembe se uporabijo takoj.'}
                  {lang === 'al' && 'Mbështesim 12 gjuhë për fleksibilitet të plotë shumëgjuhësor. Ndryshimet aplikohen menjëherë.'}
                  {lang === 'mk' && 'Поддржуваме 12 јазици за целосна повеќејазична флексибилност. Промените се применуваат веднаш.'}
                  {lang === 'fr' && 'Nous prenons en charge 12 langues pour une flexibilité multilingue complète. Les modifications sont appliquées immédiatement.'}
                  {lang === 'es' && 'Admitimos 12 idiomas para una flexibilidad multilingüe completa. Los cambios se aplican de inmediato.'}
                  {lang === 'it' && 'Supportiamo 12 lingue per una completa flessibilità multilingue. Le modifiche vengono applicate immediatamente.'}
                </>
              )}
            </AlertDescription>
          </Alert>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-2">
                <Translate size={24} className="text-primary" weight="duotone" />
                <CardTitle className="text-xl">{t('uiLanguage', lang)}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {lang === 'ba' && 'Jezik za interfejs, menije i dugmad'}
                {lang === 'en' && 'Language for the interface, menus, and buttons'}
                {lang === 'de' && 'Sprache für die Benutzeroberfläche, Menüs und Schaltflächen'}
                {lang === 'hr' && 'Jezik za sučelje, izbornike i gumbe'}
                {lang === 'sr' && 'Језик за интерфејс, меније и дугмад'}
                {lang === 'sk' && 'Jazyk pre rozhranie, ponuky a tlačidlá'}
                {lang === 'sl' && 'Jezik za vmesnik, menije in gumbe'}
                {lang === 'al' && 'Gjuha për ndërfaqe, menu dhe butona'}
                {lang === 'mk' && 'Јазик за интерфејс, менија и копчиња'}
                {lang === 'fr' && "Langue pour l'interface, les menus et les boutons"}
                {lang === 'es' && 'Idioma para la interfaz, menús y botones'}
                {lang === 'it' && "Lingua per l'interfaccia, i menu e i pulsanti"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ui-language" className="text-sm font-medium">
                    {t('uiLanguage', lang)}
                  </Label>
                  <Badge variant="secondary" className="gap-1">
                    {languageIcons[preferences.uiLanguage]}
                    {SUPPORTED_LANGUAGES.find(l => l.code === preferences.uiLanguage)?.name}
                  </Badge>
                </div>
                <Select
                  value={preferences.uiLanguage}
                  onValueChange={(value) => handleLanguageChange('uiLanguage', value as Language)}
                >
                  <SelectTrigger id="ui-language" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code} className="cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{languageIcons[l.code]}</span>
                          <span>{l.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent/20 transition-colors">
            <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-accent" weight="duotone" />
                <CardTitle className="text-xl">{t('hsDescLanguage', lang)}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {lang === 'ba' && 'Jezik za HS kodne opise i detalje klasifikacije'}
                {lang === 'en' && 'Language for HS code descriptions and classification details'}
                {lang === 'de' && 'Sprache für HS-Code-Beschreibungen und Klassifizierungsdetails'}
                {lang === 'hr' && 'Jezik za opise HS kodova i detalje klasifikacije'}
                {lang === 'sr' && 'Језик за описе HS кодова и детаље класификације'}
                {lang === 'sk' && 'Jazyk pre popisy HS kódov a detaily klasifikácie'}
                {lang === 'sl' && 'Jezik za opise HS kod in podrobnosti klasifikacije'}
                {lang === 'al' && 'Gjuha për përshkrimet e kodeve HS dhe detajet e klasifikimit'}
                {lang === 'mk' && 'Јазик за описи на HS кодови и детали за класификација'}
                {lang === 'fr' && 'Langue pour les descriptions de codes HS et les détails de classification'}
                {lang === 'es' && 'Idioma para descripciones de códigos HS y detalles de clasificación'}
                {lang === 'it' && 'Lingua per le descrizioni dei codici HS e i dettagli di classificazione'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hs-desc-language" className="text-sm font-medium">
                    {t('hsDescLanguage', lang)}
                  </Label>
                  <Badge variant="secondary" className="gap-1">
                    {languageIcons[preferences.hsDescriptionLanguage]}
                    {SUPPORTED_LANGUAGES.find(l => l.code === preferences.hsDescriptionLanguage)?.name}
                  </Badge>
                </div>
                <Select
                  value={preferences.hsDescriptionLanguage}
                  onValueChange={(value) => handleLanguageChange('hsDescriptionLanguage', value as Language)}
                >
                  <SelectTrigger id="hs-desc-language" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code} className="cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{languageIcons[l.code]}</span>
                          <span>{l.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary/20 transition-colors">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-transparent">
              <div className="flex items-center gap-2">
                <ChatCircle size={24} className="text-secondary-foreground" weight="duotone" />
                <CardTitle className="text-xl">{t('aiCommLanguage', lang)}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {lang === 'ba' && 'Jezik za AI odgovore i obrazloženja klasifikacije'}
                {lang === 'en' && 'Language for AI responses and classification reasoning'}
                {lang === 'de' && 'Sprache für KI-Antworten und Klassifizierungsbegründungen'}
                {lang === 'hr' && 'Jezik za AI odgovore i obrazloženja klasifikacije'}
                {lang === 'sr' && 'Језик за AI одговоре и образложења класификације'}
                {lang === 'sk' && 'Jazyk pre AI odpovede a odôvodnenia klasifikácie'}
                {lang === 'sl' && 'Jezik za AI odgovore in obrazložitve klasifikacije'}
                {lang === 'al' && 'Gjuha për përgjigjet e AI dhe arsyetimin e klasifikimit'}
                {lang === 'mk' && 'Јазик за AI одговори и образложенија за класификација'}
                {lang === 'fr' && 'Langue pour les réponses IA et le raisonnement de classification'}
                {lang === 'es' && 'Idioma para respuestas de IA y razonamiento de clasificación'}
                {lang === 'it' && 'Lingua per le risposte AI e il ragionamento di classificazione'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-comm-language" className="text-sm font-medium">
                    {t('aiCommLanguage', lang)}
                  </Label>
                  <Badge variant="secondary" className="gap-1">
                    {languageIcons[preferences.aiCommunicationLanguage]}
                    {SUPPORTED_LANGUAGES.find(l => l.code === preferences.aiCommunicationLanguage)?.name}
                  </Badge>
                </div>
                <Select
                  value={preferences.aiCommunicationLanguage}
                  onValueChange={(value) => handleLanguageChange('aiCommunicationLanguage', value as Language)}
                >
                  <SelectTrigger id="ai-comm-language" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code} className="cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{languageIcons[l.code]}</span>
                          <span>{l.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {supportsScriptVariant && (
            <Card className="border-2 hover:border-warning/20 transition-colors bg-gradient-to-br from-warning/5 to-transparent">
              <CardHeader className="bg-gradient-to-r from-warning/10 to-transparent">
                <div className="flex items-center gap-2">
                  <TextAa size={24} className="text-warning-foreground" weight="duotone" />
                  <CardTitle className="text-xl">{applyScriptVariant(t('scriptVariant', lang), lang, scriptVariant)}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {applyScriptVariant(t('scriptNote', lang), lang, scriptVariant)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="script-variant" className="text-sm font-medium">
                      {applyScriptVariant(t('scriptVariant', lang), lang, scriptVariant)}
                    </Label>
                    <Badge variant="secondary" className="gap-1 font-mono">
                      {scriptVariant === 'latin' ? 'ABC' : 'АБВ'}
                    </Badge>
                  </div>
                  <Select
                    value={scriptVariant}
                    onValueChange={(value) => handleLanguageChange('scriptVariant', value as ScriptVariant)}
                  >
                    <SelectTrigger id="script-variant" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latin" className="cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-lg">ABC</span>
                          <span>{applyScriptVariant(t('latinScript', lang), lang, scriptVariant)}</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="cyrillic" className="cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-lg">АБВ</span>
                          <span>{applyScriptVariant(t('cyrillicScript', lang), lang, scriptVariant)}</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm font-medium text-foreground mb-3">
                      {scriptVariant === 'latin' ? 'Live Preview / Uživo pregled:' : 'Живи преглед:'}
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-background rounded border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Latin Script:</p>
                        <p className="font-medium">Carinski Alat - AI Klasifikacija proizvoda</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ovaj sistem koristi naprednu AI tehnologiju za tačnu klasifikaciju.
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded border border-accent/30">
                        <p className="text-xs text-muted-foreground mb-1">Cyrillic Script (Ћирилица):</p>
                        <p className="font-medium">Царински Алат - AI Класификација производа</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Овај систем користи напредну AI технологију за тачну класификацију.
                        </p>
                      </div>
                      
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">
                          {scriptVariant === 'latin' ? 'Current interface displays in:' : 'Тренутни интерфејс приказује у:'}
                        </p>
                        <Badge variant={scriptVariant === 'latin' ? 'default' : 'secondary'} className="mr-2">
                          {scriptVariant === 'latin' ? '✓ Latin (ABC)' : 'Latin (ABC)'}
                        </Badge>
                        <Badge variant={scriptVariant === 'cyrillic' ? 'default' : 'secondary'}>
                          {scriptVariant === 'cyrillic' ? '✓ Cyrillic (АБВ)' : 'Cyrillic (АБВ)'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <CacheStatistics />

          <DiagnosticsPanel />

          <Card className="border border-muted bg-muted/30">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {lang === 'ba' && 'Podržani jezici:'}
                  {lang === 'en' && 'Supported languages:'}
                  {lang === 'de' && 'Unterstützte Sprachen:'}
                  {lang === 'hr' && 'Podržani jezici:'}
                  {lang === 'sr' && 'Подржани језици:'}
                  {lang === 'sk' && 'Podporované jazyky:'}
                  {lang === 'sl' && 'Podprti jeziki:'}
                  {lang === 'al' && 'Gjuhët e mbështetura:'}
                  {lang === 'mk' && 'Поддржани јазици:'}
                  {lang === 'fr' && 'Langues prises en charge :'}
                  {lang === 'es' && 'Idiomas admitidos:'}
                  {lang === 'it' && 'Lingue supportate:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_LANGUAGES.map(l => (
                    <Badge key={l.code} variant="outline" className="gap-1">
                      {languageIcons[l.code]}
                      {l.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
