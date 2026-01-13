import { useState } from 'react'
import type { ClassificationHistory, Language, ScriptVariant } from '@/types'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FilePdf, DownloadSimple } from '@phosphor-icons/react'
import { 
  generatePDFCertificate, 
  downloadPDFCertificate, 
  generateCertificateNumber,
  type PDFCertificateData 
} from '@/lib/pdfCertificate'
import { toast } from 'sonner'
import { applyScriptVariant } from '@/lib/translations'

interface PDFCertificateButtonProps {
  historyItem: ClassificationHistory
  lang: Language
  scriptVariant: ScriptVariant
}

export function PDFCertificateButton({
  historyItem,
  lang,
  scriptVariant
}: PDFCertificateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    
    try {
      const issueDate = new Date()
      const validUntil = new Date()
      validUntil.setFullYear(validUntil.getFullYear() + 1)
      
      const certificateData: PDFCertificateData = {
        classificationResult: historyItem.result,
        productDescription: historyItem.productDescription,
        certificateNumber: generateCertificateNumber(),
        issueDate,
        validUntil,
        lang,
        scriptVariant
      }
      
      toast.info(applyScriptVariant('Generisanje PDF sertifikata...', lang, scriptVariant))
      
      const pdfBlob = await generatePDFCertificate(certificateData)
      
      const filename = `Carinski-Sertifikat-${historyItem.result.hsCode.replace(/\./g, '-')}-${Date.now()}.png`
      downloadPDFCertificate(pdfBlob, filename)
      
      toast.success(applyScriptVariant('PDF sertifikat uspješno preuzet!', lang, scriptVariant))
      setDialogOpen(false)
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error(
        applyScriptVariant('Greška pri generisanju PDF-a. Pokušajte ponovo.', lang, scriptVariant)
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FilePdf size={16} />
          {applyScriptVariant('PDF Sertifikat', lang, scriptVariant)}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {applyScriptVariant('Preuzmi PDF Sertifikat', lang, scriptVariant)}
          </DialogTitle>
          <DialogDescription>
            {applyScriptVariant(
              'Generišite profesionalni PDF sertifikat klasifikacije sa QR kodom i pravnim odbrambenim parametrima.',
              lang,
              scriptVariant
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {applyScriptVariant('HS Kod:', lang, scriptVariant)}
              </span>
              <span className="font-mono font-bold text-primary">
                {historyItem.result.hsCode}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {applyScriptVariant('Pouzdanost:', lang, scriptVariant)}
              </span>
              <span className="capitalize">{historyItem.result.confidence}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {applyScriptVariant('Defensive Score:', lang, scriptVariant)}
              </span>
              <span>{historyItem.result.defensibilityScore}/10</span>
            </div>
            <div className="text-xs text-muted-foreground mt-3 border-t border-border pt-2">
              <p className="line-clamp-2">
                {applyScriptVariant(historyItem.productDescription, lang, scriptVariant)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="w-full gap-2"
            >
              <DownloadSimple size={18} />
              {isGenerating 
                ? applyScriptVariant('Generisanje...', lang, scriptVariant)
                : applyScriptVariant('Preuzmi PDF', lang, scriptVariant)
              }
            </Button>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <strong>{applyScriptVariant('Napomena:', lang, scriptVariant)}</strong>{' '}
              {applyScriptVariant(
                'Ovaj sertifikat sadrži QR kod za verifikaciju i pravne reference.',
                lang,
                scriptVariant
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}








