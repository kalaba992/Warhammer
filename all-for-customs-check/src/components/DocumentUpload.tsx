import { useState } from 'react'
import type { Language, ScriptVariant } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Upload, FileText, X, Translate } from '@phosphor-icons/react'
import { t, applyScriptVariant } from '@/lib/translations'
import { useScriptConverter } from '@/hooks/use-script-converter'

interface DocumentUploadProps {
  lang: Language
  scriptVariant: ScriptVariant
  onUpload: (file: File, productDescription: string) => Promise<void>
  isProcessing: boolean
}

export function DocumentUpload({
  lang,
  scriptVariant,
  onUpload,
  isProcessing
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [productDescription, setProductDescription] = useState('')
  const [documentTitle, setDocumentTitle] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!documentTitle) {
        setDocumentTitle(file.name)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setDocumentTitle('')
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    const convertedDescription = applyScriptVariant(productDescription, lang, scriptVariant)
    
    await onUpload(selectedFile, convertedDescription)
    
    setSelectedFile(null)
    setProductDescription('')
    setDocumentTitle('')
  }

  const TitleDisplay = ({ text }: { text: string }) => {
    const converted = useScriptConverter(text, lang, scriptVariant)
    return <>{converted}</>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2">{t('documents', lang)}</h2>
          <p className="text-muted-foreground text-sm">{t('uploadDocument', lang)}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{t('uploadDocument', lang)}</CardTitle>
                <CardDescription>
                  <TitleDisplay text="Učitajte dokument za analizu i klasifikaciju proizvoda" />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="document-file">
                    <TitleDisplay text="Dokument (PDF, slike, ili tekst fajlovi)" />
                  </Label>
                  {!selectedFile ? (
                    <label
                      htmlFor="document-file"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={32} className="mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium"><TitleDisplay text="Kliknite za izbor" /></span> <TitleDisplay text="ili povucite fajl" />
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <TitleDisplay text="PDF, PNG, JPG, ili TXT (max 10MB)" />
                        </p>
                      </div>
                      <input
                        id="document-file"
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        onChange={handleFileSelect}
                        disabled={isProcessing}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={24} className="text-primary" />
                        <div>
                          <p className="font-medium text-sm">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        disabled={isProcessing}
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="document-title">
                    <TitleDisplay text="Naziv dokumenta" />
                  </Label>
                  {(lang === 'ba' || lang === 'sr') && documentTitle.trim() && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-help px-2 py-1 rounded-md bg-muted/50 inline-flex mb-2">
                          <Translate size={14} weight="duotone" />
                          <span>{t('scriptVariant', lang)}: <span className="font-medium">{scriptVariant === 'latin' ? t('latinScript', lang) : t('cyrillicScript', lang)}</span></span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p>{t('autoConvertNotice', lang)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Input
                    id="document-title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder={useScriptConverter('Unesite naziv dokumenta...', lang, scriptVariant)}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-description">
                    <TitleDisplay text="Opis proizvoda (opcionalno)" />
                  </Label>
                  {(lang === 'ba' || lang === 'sr') && productDescription.trim() && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-help px-2 py-1 rounded-md bg-muted/50 inline-flex mb-2">
                          <Translate size={14} weight="duotone" />
                          <span>{t('scriptVariant', lang)}: <span className="font-medium">{scriptVariant === 'latin' ? t('latinScript', lang) : t('cyrillicScript', lang)}</span></span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p>{t('autoConvertNotice', lang)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Textarea
                    id="product-description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder={useScriptConverter('Dodatne informacije o proizvodu koji se klasificira...', lang, scriptVariant)}
                    className="min-h-[100px]"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    <TitleDisplay text="Dodatni kontekst može pomoći u preciznijoj klasifikaciji" />
                  </p>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <Upload className="mr-2" size={20} />
                  {isProcessing ? t('analyzing', lang) : t('uploadDocument', lang)}
                </Button>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle><TitleDisplay text="Kako funkcionira" /></CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</div>
                    <p><TitleDisplay text="Učitajte komercijalni dokument, fakturu, ili specifikaciju proizvoda" /></p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</div>
                    <p><TitleDisplay text="Sistem automatski ekstraktuje tekst i identifikuje proizvode" /></p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</div>
                    <p><TitleDisplay text="AI klasificira svaki proizvod sa HS kodom i confidence score-om" /></p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">4</div>
                    <p><TitleDisplay text="Preuzmite kompletni izvještaj sa svim klasifikacijama" /></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
