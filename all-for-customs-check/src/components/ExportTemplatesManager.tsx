import { useState } from 'react'
import { useKV } from '@/hooks'
import type { ClassificationHistory, Language, ScriptVariant } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  FileCode,
  Plus,
  Trash,
  PencilSimple,
  Star,
  Check,
  FileXls
} from '@phosphor-icons/react'
import { applyScriptVariant } from '@/lib/translations'
import { exportHistoryToExcel } from '@/lib/excelExport'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ExportTemplate {
  id: string
  name: string
  description: string
  includeAllFields: boolean
  filterFavorites: boolean
  filterConfidence: 'all' | 'high' | 'medium' | 'low'
  customFields: string[]
  createdAt: number
  isDefault?: boolean
}

interface ExportTemplatesManagerProps {
  history: ClassificationHistory[]
  lang: Language
  scriptVariant: ScriptVariant
}

export function ExportTemplatesManager({
  history,
  lang,
  scriptVariant
}: ExportTemplatesManagerProps) {
  const [templates, setTemplates] = useKV<ExportTemplate[]>('export-templates', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    includeAllFields: true,
    filterFavorites: false,
    filterConfidence: 'all' as 'all' | 'high' | 'medium' | 'low'
  })

  const convert = (text: string) => applyScriptVariant(text, lang, scriptVariant)

  const defaultTemplates: ExportTemplate[] = [
    {
      id: 'default-full',
      name: convert('Kompletni Export'),
      description: convert('Svi zapisi sa svim poljima - kompletna istorija'),
      includeAllFields: true,
      filterFavorites: false,
      filterConfidence: 'all',
      customFields: [],
      createdAt: Date.now(),
      isDefault: true
    },
    {
      id: 'default-basic',
      name: convert('Osnovni Export'),
      description: convert('Svi zapisi sa osnovnim poljima - jednostavan pregled'),
      includeAllFields: false,
      filterFavorites: false,
      filterConfidence: 'all',
      customFields: [],
      createdAt: Date.now(),
      isDefault: true
    },
    {
      id: 'default-favorites',
      name: convert('Omiljeni Export'),
      description: convert('Samo omiljeni zapisi sa svim detaljima'),
      includeAllFields: true,
      filterFavorites: true,
      filterConfidence: 'all',
      customFields: [],
      createdAt: Date.now(),
      isDefault: true
    },
    {
      id: 'default-high-confidence',
      name: convert('Visoka Pouzdanost Export'),
      description: convert('Samo klasifikacije sa visokom pouzdanošću'),
      includeAllFields: true,
      filterFavorites: false,
      filterConfidence: 'high',
      customFields: [],
      createdAt: Date.now(),
      isDefault: true
    }
  ]

  const allTemplates = [...defaultTemplates, ...(templates || [])]

  const handleCreateTemplate = () => {
    setIsCreating(true)
    setFormData({
      name: '',
      description: '',
      includeAllFields: true,
      filterFavorites: false,
      filterConfidence: 'all'
    })
    setEditingTemplate(null)
  }

  const handleEditTemplate = (template: ExportTemplate) => {
    if (template.isDefault) {
      toast.error(convert('Ne možete mijenjati default template'))
      return
    }
    setIsCreating(true)
    setFormData({
      name: template.name,
      description: template.description,
      includeAllFields: template.includeAllFields,
      filterFavorites: template.filterFavorites,
      filterConfidence: template.filterConfidence
    })
    setEditingTemplate(template)
  }

  const handleDeleteTemplate = (templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId)
    if (template?.isDefault) {
      toast.error(convert('Ne možete obrisati default template'))
      return
    }
    
    setTemplates((current) => (current || []).filter(t => t.id !== templateId))
    toast.success(convert('Template obrisan'))
  }

  const handleSaveTemplate = () => {
    if (!formData.name.trim()) {
      toast.error(convert('Unesite naziv templatea'))
      return
    }

    if (editingTemplate) {
      setTemplates((current) =>
        (current || []).map(t =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: formData.name,
                description: formData.description,
                includeAllFields: formData.includeAllFields,
                filterFavorites: formData.filterFavorites,
                filterConfidence: formData.filterConfidence
              }
            : t
        )
      )
      toast.success(convert('Template ažuriran'))
    } else {
      const newTemplate: ExportTemplate = {
        id: `template-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        includeAllFields: formData.includeAllFields,
        filterFavorites: formData.filterFavorites,
        filterConfidence: formData.filterConfidence,
        customFields: [],
        createdAt: Date.now()
      }
      setTemplates((current) => [...(current || []), newTemplate])
      toast.success(convert('Template kreiran'))
    }

    setIsCreating(false)
    setEditingTemplate(null)
  }

  const handleExportWithTemplate = async (template: ExportTemplate) => {
    try {
      exportHistoryToExcel(history, {
        lang,
        scriptVariant,
        includeAllFields: template.includeAllFields,
        filterFavorites: template.filterFavorites,
        filterConfidence: template.filterConfidence
      })

      const filteredCount = history.filter(h => {
        if (template.filterFavorites && !h.isFavorite) return false
        if (template.filterConfidence !== 'all' && h.result.confidence !== template.filterConfidence) return false
        return true
      }).length

      toast.success(convert(`Eksportovano ${filteredCount} zapisa`))
      setDialogOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(convert('Greška pri exportu'))
    }
  }

  const getFilterBadges = (template: ExportTemplate) => {
    const badges: React.ReactElement[] = []
    
    if (template.includeAllFields) {
      badges.push(
        <Badge key="fields" variant="outline" className="text-xs">
          {convert('Sva Polja')}
        </Badge>
      )
    } else {
      badges.push(
        <Badge key="fields" variant="outline" className="text-xs">
          {convert('Osnovna Polja')}
        </Badge>
      )
    }

    if (template.filterFavorites) {
      badges.push(
        <Badge key="favorites" variant="outline" className="text-xs bg-warning/10 text-warning border-warning">
          <Star className="h-3 w-3 mr-1" weight="fill" />
          {convert('Omiljeni')}
        </Badge>
      )
    }

    if (template.filterConfidence !== 'all') {
      const confidenceText = template.filterConfidence === 'high' ? convert('Visoka') :
                             template.filterConfidence === 'medium' ? convert('Srednja') : convert('Niska')
      const confidenceColor = template.filterConfidence === 'high' ? 'bg-accent/10 text-accent border-accent' :
                              template.filterConfidence === 'medium' ? 'bg-warning/10 text-warning border-warning' :
                              'bg-destructive/10 text-destructive border-destructive'
      badges.push(
        <Badge key="confidence" variant="outline" className={cn("text-xs", confidenceColor)}>
          {confidenceText}
        </Badge>
      )
    }

    return badges
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileCode className="h-4 w-4" />
          {convert('Export Templatei')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            {convert('Upravljanje Export Templateima')}
          </DialogTitle>
          <DialogDescription>
            {convert('Kreirajte i sačuvajte predložene konfiguracije za export sa različitim filterima')}
          </DialogDescription>
        </DialogHeader>

        {!isCreating ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {convert('Izaberite template ili kreirajte novi')}
              </p>
              <Button onClick={handleCreateTemplate} className="gap-2">
                <Plus className="h-4 w-4" />
                {convert('Novi Template')}
              </Button>
            </div>

            <ScrollArea className="h-[60vh]">
              <div className="space-y-3">
                {allTemplates.map((template) => (
                  <Card key={template.id} className={cn(
                    "relative transition-all hover:shadow-md",
                    template.isDefault && "bg-accent/5 border-accent/30"
                  )}>
                    {template.isDefault && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
                          <Check className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 pr-20">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {getFilterBadges(template)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleExportWithTemplate(template)}
                          className="flex-1 gap-2"
                        >
                          <FileXls className="h-4 w-4" />
                          {convert('Exportuj')}
                        </Button>
                        {!template.isDefault && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <PencilSimple className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="template-name">{convert('Naziv Templatea')}</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={convert('Npr. "Mjesečni izvještaj sa visokom pouzdanošću"')}
                />
              </div>

              <div>
                <Label htmlFor="template-description">{convert('Opis')}</Label>
                <Textarea
                  id="template-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={convert('Kratka napomena o svrsi ovog templatea')}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <Label htmlFor="all-fields">{convert('Sva Polja')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {convert('Uključi sve detalje klasifikacije')}
                  </p>
                </div>
                <Switch
                  id="all-fields"
                  checked={formData.includeAllFields}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeAllFields: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <Label htmlFor="favorites-only">{convert('Samo Omiljeni')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {convert('Exportuj samo označene omiljene')}
                  </p>
                </div>
                <Switch
                  id="favorites-only"
                  checked={formData.filterFavorites}
                  onCheckedChange={(checked) => setFormData({ ...formData, filterFavorites: checked })}
                />
              </div>

              <div>
                <Label htmlFor="confidence-filter">{convert('Filter Pouzdanosti')}</Label>
                <Select
                  value={formData.filterConfidence}
                  onValueChange={(value) => setFormData({ ...formData, filterConfidence: value as 'high' | 'medium' | 'low' | 'all' })}
                >
                  <SelectTrigger id="confidence-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{convert('Sve')}</SelectItem>
                    <SelectItem value="high">{convert('Samo Visoka')}</SelectItem>
                    <SelectItem value="medium">{convert('Samo Srednja')}</SelectItem>
                    <SelectItem value="low">{convert('Samo Niska')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveTemplate} className="flex-1">
                {editingTemplate ? convert('Ažuriraj Template') : convert('Sačuvaj Template')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setEditingTemplate(null)
                }}
              >
                {convert('Otkaži')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
