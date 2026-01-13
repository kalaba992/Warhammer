import type { Conversation, Language, ScriptVariant } from '@/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  ChatCircle, 
  MagnifyingGlass, 
  Clock, 
  Gear, 
  Plus,
  FileText,
  Files,
  Table,
  TreeStructure,
  ChartLine,
  ChartPie,
  Shield,
  Database,
  BookOpenText
} from '@phosphor-icons/react'
import { t, applyScriptVariant } from '@/lib/translations'
import { cn } from '@/lib/utils'

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  currentView: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onChangeView: (view: 'chat' | 'search' | 'tree-view' | 'history' | 'settings' | 'documents' | 'batch-upload' | 'spreadsheet-import' | 'dashboard' | 'advanced-dashboard' | 'admin' | 'knowledge-base' | 'knowledge-browser') => void
  lang: Language
  scriptVariant?: ScriptVariant
  isOwner: boolean
}

export function Sidebar({
  conversations,
  currentConversationId,
  currentView,
  onSelectConversation,
  onNewConversation,
  onChangeView,
  lang,
  scriptVariant = 'latin',
  isOwner
}: SidebarProps) {
  const navItems = [
    { id: 'chat' as const, icon: ChatCircle, label: applyScriptVariant(t('chat', lang), lang, scriptVariant) },
    { id: 'dashboard' as const, icon: ChartLine, label: applyScriptVariant('Dashboard', lang, scriptVariant) },
    { id: 'advanced-dashboard' as const, icon: ChartPie, label: applyScriptVariant('Napredna Analitika', lang, scriptVariant) },
    { id: 'search' as const, icon: MagnifyingGlass, label: applyScriptVariant(t('search', lang), lang, scriptVariant) },
    { id: 'tree-view' as const, icon: TreeStructure, label: applyScriptVariant('HS Tree View', lang, scriptVariant) },
    { id: 'knowledge-browser' as const, icon: BookOpenText, label: applyScriptVariant('Pretraživanje Baze', lang, scriptVariant) },
    { id: 'documents' as const, icon: FileText, label: applyScriptVariant(t('documents', lang), lang, scriptVariant) },
    { id: 'batch-upload' as const, icon: Files, label: applyScriptVariant('Grupno Učitavanje', lang, scriptVariant) },
    { id: 'spreadsheet-import' as const, icon: Table, label: applyScriptVariant('CSV/Excel Uvoz', lang, scriptVariant) },
    { id: 'history' as const, icon: Clock, label: applyScriptVariant(t('history', lang), lang, scriptVariant) },
    ...(isOwner ? [
      { id: 'knowledge-base' as const, icon: Database, label: applyScriptVariant('Baza Znanja', lang, scriptVariant), special: true },
      { id: 'admin' as const, icon: Shield, label: applyScriptVariant('Admin', lang, scriptVariant), special: true }
    ] : []),
    { id: 'settings' as const, icon: Gear, label: applyScriptVariant(t('settings', lang), lang, scriptVariant) }
  ]

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-semibold text-primary mb-4">
          {applyScriptVariant(t('appTitle', lang), lang, scriptVariant)}
        </h1>

        <Button 
          onClick={onNewConversation}
          className="w-full"
          size="sm"
        >
          <Plus className="mr-2" />
          {t('chat', lang)}
        </Button>
      </div>

      <Separator />

      <nav className="p-2">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start mb-1',
                currentView === item.id && 'bg-secondary',
                item.special && 'text-accent hover:text-accent'
              )}
              onClick={() => onChangeView(item.id)}
            >
              <Icon className="mr-2" weight={item.special ? 'fill' : 'regular'} />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <Separator />

      {currentView === 'chat' && conversations.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-2 text-xs font-medium text-muted-foreground">
            {t('history', lang)}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map(conv => (
                <Button
                  key={conv.id}
                  variant={currentConversationId === conv.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-left truncate"
                  size="sm"
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <span className="truncate">{conv.title}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
