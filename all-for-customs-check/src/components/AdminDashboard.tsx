import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@/hooks'
import type { ClassificationHistory, Conversation, UserPreferences } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Database,
  Trash,
  Download,
  Upload,
  ArrowClockwise,
  Terminal,
  Shield,
  Users,
  FileText,
  ChartBar,
  Gear,
  Key,
  Archive,
  Warning,
  CheckCircle,
  XCircle,
  Pulse,
  Lightning,
  Lock,
  LockOpen,
  ClockClockwise
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { applyScriptVariant } from '@/lib/translations'
import type { Language } from '@/types'
import { auditLogger } from '@/lib/auditLog'
import { AuditLogViewer } from '@/components/AuditLogViewer'
import { DiagnosticsPanel } from '@/components/DiagnosticsPanel'

interface AdminDashboardProps {
  lang: Language
  scriptVariant: 'latin' | 'cyrillic'
}

interface SystemStats {
  totalClassifications: number
  totalConversations: number
  totalUsers: number
  cacheSize: number
  lastSync: number
  apiCallsToday: number
  errorRate: number
  avgResponseTime: number
}

interface CommandResult {
  success: boolean
  message: string
  data?: unknown
  timestamp: number
}

export function AdminDashboard({ lang, scriptVariant }: AdminDashboardProps) {
  const [history, setHistory] = useKV<ClassificationHistory[]>('classification-history', [])
  const [conversations, setConversations] = useKV<Conversation[]>('conversations', [])
  const [preferences] = useKV<UserPreferences>('user-preferences', {
    uiLanguage: 'ba',
    hsDescriptionLanguage: 'ba',
    aiCommunicationLanguage: 'ba',
    scriptVariant: 'latin'
  })
  const [favorites, setFavorites] = useKV<string[]>('favorites', [])
  const [adminLogs, setAdminLogs] = useKV<CommandResult[]>('admin-logs', [])
  const [godMode, setGodMode] = useKV<boolean>('god-mode-enabled', false)

  const [commandInput, setCommandInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1)
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalClassifications: 0,
    totalConversations: 0,
    totalUsers: 1,
    cacheSize: 0,
    lastSync: Date.now(),
    apiCallsToday: 0,
    errorRate: 0,
    avgResponseTime: 245
  })
  const [selectedTab, setSelectedTab] = useState('overview')
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const calculateSystemStats = useCallback(() => {
    const cacheSize = (() => {
      try {
        const historySize = JSON.stringify(history || []).length
        const conversationSize = JSON.stringify(conversations || []).length
        return Math.round((historySize + conversationSize) / 1024)
      } catch {
        return 0
      }
    })()

    setSystemStats({
      totalClassifications: history?.length || 0,
      totalConversations: conversations?.length || 0,
      totalUsers: 1,
      cacheSize,
      lastSync: Date.now(),
      apiCallsToday: history?.filter(h =>
        Date.now() - h.timestamp < 24 * 60 * 60 * 1000
      ).length || 0,
      errorRate: 0.02,
      avgResponseTime: 245
    })
  }, [conversations, history])

  useEffect(() => {
    calculateSystemStats()
    auditLogger.initializeUser()
  }, [calculateSystemStats])

  const logCommand = (command: string, result: CommandResult) => {
    setAdminLogs(logs => [{
      ...result,
      message: `[${command}] ${result.message}`,
      timestamp: Date.now()
    }, ...(logs || [])].slice(0, 100))
  }

  const executeCommand = async (cmd: string) => {
    const command = cmd.trim().toLowerCase()
    setIsProcessing(true)

    try {
      let result: CommandResult = {
        success: false,
        message: 'Unknown command',
        timestamp: Date.now()
      }

      if (command === 'help' || command === '?') {
        result = {
          success: true,
          message: 'Available commands: help, stats, clear-history, clear-conversations, clear-cache, clear-all, export-data, import-data, god-mode-on, god-mode-off, refresh, backup, restore, delete-old, optimize, reset-favorites, count-*, list-*',
          timestamp: Date.now()
        }
        await auditLogger.log('COMMAND_EXECUTED', { targetResource: 'command', success: true })
      }
      else if (command === 'stats') {
        result = {
          success: true,
          message: `Classifications: ${systemStats.totalClassifications} | Conversations: ${systemStats.totalConversations} | Cache: ${systemStats.cacheSize}KB | API Calls Today: ${systemStats.apiCallsToday}`,
          data: systemStats,
          timestamp: Date.now()
        }
      }
      else if (command === 'clear-history') {
        const count = history?.length || 0
        setHistory([])
        result = {
          success: true,
          message: `Deleted ${count} classification records`,
          data: { deleted: count },
          timestamp: Date.now()
        }
        await auditLogger.log('DATA_DELETED', {
          targetResource: 'classification-history',
          metadata: { count },
          success: true
        })
        toast.success(`Obrisano ${count} klasifikacija`)
      }
      else if (command === 'clear-conversations') {
        const count = conversations?.length || 0
        setConversations([])
        result = {
          success: true,
          message: `Deleted ${count} conversations`,
          data: { deleted: count },
          timestamp: Date.now()
        }
        await auditLogger.log('DATA_DELETED', {
          targetResource: 'conversations',
          metadata: { count },
          success: true
        })
        toast.success(`Obrisano ${count} konverzacija`)
      }
      else if (command === 'clear-cache') {
        let keys: string[] = []
        if (window.spark?.kv?.keys) {
          keys = await window.spark!.kv!.keys()
        }
        const cacheKeys = keys.filter(k => k.startsWith('classification-cache-'))
        for (const key of cacheKeys) {
          if (window.spark?.kv?.delete) {
            await window.spark!.kv!.delete(key)
          }
        }
        result = {
          success: true,
          message: `Cleared ${cacheKeys.length} cache entries`,
          data: { deleted: cacheKeys.length },
          timestamp: Date.now()
        }
        await auditLogger.log('CACHE_CLEARED', {
          targetResource: 'cache',
          metadata: { count: cacheKeys.length },
          success: true
        })
        toast.success(`Očišćen cache: ${cacheKeys.length} stavki`)
      }
      else if (command === 'clear-all') {
        const histCount = history?.length || 0
        const convCount = conversations?.length || 0
        setHistory([])
        setConversations([])
        setFavorites([])
        setAdminLogs([])
        result = {
          success: true,
          message: `Cleared all data: ${histCount} classifications, ${convCount} conversations`,
          data: { classifications: histCount, conversations: convCount },
          timestamp: Date.now()
        }
        await auditLogger.log('DATA_DELETED', {
          targetResource: 'all-data',
          metadata: { classifications: histCount, conversations: convCount },
          success: true
        })
        toast.success('Svi podaci obrisani')
      }
      else if (command === 'export-data') {
        const exportObj = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          history: history || [],
          conversations: conversations || [],
          favorites: favorites || [],
          preferences: preferences
        }
        const exportJson = JSON.stringify(exportObj, null, 2)
        setExportData(exportJson)
        
        const blob = new Blob([exportJson], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `carinski-alat-backup-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        
        result = {
          success: true,
          message: `Exported ${(exportJson.length / 1024).toFixed(2)}KB of data`,
          data: { size: exportJson.length },
          timestamp: Date.now()
        }
        await auditLogger.log('DATA_EXPORT', {
          targetResource: 'full-database',
          metadata: { sizeBytes: exportJson.length },
          success: true
        })
        toast.success('Podaci eksportovani')
      }
      else if (command.startsWith('import-data')) {
        if (!importData) {
          result = {
            success: false,
            message: 'No import data available. Paste JSON in Import tab first.',
            timestamp: Date.now()
          }
          await auditLogger.log('DATA_IMPORT', {
            actionDescription: 'Import failed: No data provided',
            targetResource: 'full-database',
            success: false,
            errorMessage: 'No import data available'
          })
          toast.error('Nema podataka za import')
        } else {
          try {
            const importObj = JSON.parse(importData)
            if (importObj.history) setHistory(importObj.history)
            if (importObj.conversations) setConversations(importObj.conversations)
            if (importObj.favorites) setFavorites(importObj.favorites)
            result = {
              success: true,
              message: `Imported ${importObj.history?.length || 0} classifications, ${importObj.conversations?.length || 0} conversations`,
              timestamp: Date.now()
            }
            await auditLogger.log('DATA_IMPORT', {
              targetResource: 'full-database',
              metadata: { 
                classifications: importObj.history?.length || 0,
                conversations: importObj.conversations?.length || 0
              },
              success: true
            })
            toast.success('Podaci importovani')
          } catch (e) {
            result = {
              success: false,
              message: `Import failed: ${e instanceof Error ? e.message : 'Invalid JSON'}`,
              timestamp: Date.now()
            }
            await auditLogger.log('DATA_IMPORT', {
              actionDescription: 'Import failed: Invalid JSON',
              targetResource: 'full-database',
              success: false,
              errorMessage: e instanceof Error ? e.message : 'Invalid JSON'
            })
            toast.error('Import neuspješan')
          }
        }
      }
      else if (command === 'god-mode-on') {
        setGodMode(true)
        result = {
          success: true,
          message: '⚡ GOD MODE ACTIVATED - All restrictions removed',
          timestamp: Date.now()
        }
        await auditLogger.log('GOD_MODE_TOGGLED', {
          actionDescription: 'God Mode activated',
          targetResource: 'system-settings',
          oldValue: false,
          newValue: true,
          success: true
        })
        toast.success('🔥 God Mode aktiviran')
      }
      else if (command === 'god-mode-off') {
        setGodMode(false)
        result = {
          success: true,
          message: 'God Mode deactivated',
          timestamp: Date.now()
        }
        await auditLogger.log('GOD_MODE_TOGGLED', {
          actionDescription: 'God Mode deactivated',
          targetResource: 'system-settings',
          oldValue: true,
          newValue: false,
          success: true
        })
        toast.info('God Mode deaktiviran')
      }
      else if (command === 'refresh') {
        calculateSystemStats()
        result = {
          success: true,
          message: 'System stats refreshed',
          data: systemStats,
          timestamp: Date.now()
        }
        toast.success('Statistike osvježene')
      }
      else if (command === 'backup') {
        const backupData = {
          timestamp: Date.now(),
          history: history || [],
          conversations: conversations || [],
          favorites: favorites || []
        }
        const backupKey = `backup-${Date.now()}`
        if (window.spark?.kv?.set) {
          await window.spark!.kv!.set(backupKey, backupData)
        }
        result = {
          success: true,
          message: `Backup created: ${backupKey}`,
          timestamp: Date.now()
        }
        await auditLogger.log('BACKUP_CREATED', {
          targetResource: 'backup',
          resourceId: backupKey,
          metadata: {
            classifications: history?.length || 0,
            conversations: conversations?.length || 0
          },
          success: true
        })
        toast.success('Backup kreiran')
      }
      else if (command.startsWith('restore ')) {
        const backupKey = command.replace('restore ', '')
        let backupData: {history?: ClassificationHistory[], conversations?: Conversation[], favorites?: string[]} | undefined
        if (window.spark?.kv?.get) {
          const fetched = await window.spark!.kv!.get<{history?: ClassificationHistory[], conversations?: Conversation[], favorites?: string[]}>(backupKey)
          backupData = fetched ?? undefined
        }
        if (backupData) {
          setHistory(backupData.history || [])
          setConversations(backupData.conversations || [])
          setFavorites(backupData.favorites || [])
          result = {
            success: true,
            message: `Restored from ${backupKey}`,
            timestamp: Date.now()
          }
          await auditLogger.log('BACKUP_RESTORED', {
            targetResource: 'backup',
            resourceId: backupKey,
            metadata: {
              classifications: backupData.history?.length || 0,
              conversations: backupData.conversations?.length || 0
            },
            success: true
          })
          toast.success('Podaci vraćeni')
        } else {
          result = {
            success: false,
            message: `Backup ${backupKey} not found`,
            timestamp: Date.now()
          }
          await auditLogger.log('BACKUP_RESTORED', {
            targetResource: 'backup',
            resourceId: backupKey,
            success: false,
            errorMessage: 'Backup not found'
          })
          toast.error('Backup nije pronađen')
        }
      }
      else if (command.startsWith('delete-old ')) {
        const days = parseInt(command.replace('delete-old ', ''))
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
        const oldHistory = history?.filter(h => h.timestamp < cutoff) || []
        const newHistory = history?.filter(h => h.timestamp >= cutoff) || []
        setHistory(newHistory)
        result = {
          success: true,
          message: `Deleted ${oldHistory.length} records older than ${days} days`,
          data: { deleted: oldHistory.length },
          timestamp: Date.now()
        }
        toast.success(`Obrisano ${oldHistory.length} starih zapisa`)
      }
      else if (command === 'optimize') {
        const oldHistory = history || []
        const uniqueHistory = oldHistory.filter((h, index, self) =>
          index === self.findIndex(t => t.productDescription === h.productDescription)
        )
        setHistory(uniqueHistory)
        result = {
          success: true,
          message: `Optimized: ${oldHistory.length - uniqueHistory.length} duplicates removed`,
          data: { removed: oldHistory.length - uniqueHistory.length },
          timestamp: Date.now()
        }
        await auditLogger.log('SYSTEM_OPTIMIZED', {
          targetResource: 'classification-history',
          metadata: {
            before: oldHistory.length,
            after: uniqueHistory.length,
            removed: oldHistory.length - uniqueHistory.length
          },
          success: true
        })
        toast.success('Baza optimizovana')
      }
      else if (command === 'reset-favorites') {
        const count = favorites?.length || 0
        setFavorites([])
        result = {
          success: true,
          message: `Reset ${count} favorites`,
          timestamp: Date.now()
        }
        toast.success(`Resetovano ${count} omiljenih`)
      }
      else if (command === 'count-classifications') {
        result = {
          success: true,
          message: `Total classifications: ${history?.length || 0}`,
          data: { count: history?.length || 0 },
          timestamp: Date.now()
        }
      }
      else if (command === 'count-conversations') {
        result = {
          success: true,
          message: `Total conversations: ${conversations?.length || 0}`,
          data: { count: conversations?.length || 0 },
          timestamp: Date.now()
        }
      }
      else if (command === 'list-backups') {
        let keys: string[] = []
        if (window.spark?.kv?.keys) {
          keys = await window.spark!.kv!.keys()
        }
        const backups = keys.filter(k => k.startsWith('backup-'))
        result = {
          success: true,
          message: `Found ${backups.length} backups: ${backups.join(', ')}`,
          data: { backups },
          timestamp: Date.now()
        }
      }
      else if (command === 'list-keys') {
        let keys: string[] = []
        if (window.spark?.kv?.keys) {
          keys = await window.spark!.kv!.keys()
        }
        result = {
          success: true,
          message: `Found ${keys.length} keys in storage`,
          data: { keys },
          timestamp: Date.now()
        }
      }
      else if (command === 'system-info') {
        let user: {avatarUrl: string, email: string, id: string, isOwner: boolean, login: string} | undefined
        if (window.spark?.user) {
          user = await window.spark!.user()
        }
        result = {
          success: true,
          message: `User: ${user?.login || 'N/A'} | Email: ${user?.email || 'N/A'} | Owner: ${user?.isOwner || false}`,
          data: user,
          timestamp: Date.now()
        }
      }
      else if (command === 'clear-logs') {
        setAdminLogs([])
        result = {
          success: true,
          message: 'Admin logs cleared',
          timestamp: Date.now()
        }
        toast.success('Logovi obrisani')
      }
      else {
        result = {
          success: false,
          message: `Unknown command: ${command}. Type 'help' for available commands.`,
          timestamp: Date.now()
        }
        toast.error('Nepoznata komanda')
      }

      logCommand(command, result)
      setCommandHistory(prev => [cmd, ...prev].slice(0, 50))
      setCommandHistoryIndex(-1)
      setCommandInput('')
      
      return result
    } catch (error) {
      const result: CommandResult = {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      }
      logCommand(cmd, result)
      toast.error('Greška pri izvršavanju komande')
      return result
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (commandInput.trim()) {
        executeCommand(commandInput)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistoryIndex < commandHistory.length - 1) {
        const newIndex = commandHistoryIndex + 1
        setCommandHistoryIndex(newIndex)
        setCommandInput(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (commandHistoryIndex > 0) {
        const newIndex = commandHistoryIndex - 1
        setCommandHistoryIndex(newIndex)
        setCommandInput(commandHistory[newIndex])
      } else if (commandHistoryIndex === 0) {
        setCommandHistoryIndex(-1)
        setCommandInput('')
      }
    }
  }

  const quickCommands = [
    { cmd: 'stats', label: 'Statistike', icon: ChartBar },
    { cmd: 'clear-cache', label: 'Očisti Cache', icon: ArrowClockwise },
    { cmd: 'export-data', label: 'Export', icon: Download },
    { cmd: 'backup', label: 'Backup', icon: Archive },
    { cmd: 'optimize', label: 'Optimizuj', icon: Lightning },
    { cmd: 'refresh', label: 'Osvježi', icon: Pulse },
  ]

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Shield className="h-8 w-8 text-accent" weight="fill" />
              {applyScriptVariant('Admin Dashboard', lang, scriptVariant)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {applyScriptVariant('Centralna kontrola i upravljanje sistemom', lang, scriptVariant)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {godMode ? (
              <Badge variant="destructive" className="gap-1">
                <Lightning className="h-3 w-3" weight="fill" />
                GOD MODE
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Normal Mode
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Klasifikacije
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{systemStats.totalClassifications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {systemStats.apiCallsToday} danas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Konverzacije
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{systemStats.totalConversations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aktivnih sesija
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-accent" />
                Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{systemStats.cacheSize} KB</div>
              <p className="text-xs text-muted-foreground mt-1">
                Memorija
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pulse className="h-4 w-4 text-accent" />
                Performanse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{systemStats.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground mt-1">
                Prosječno vrijeme
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <Terminal className="h-4 w-4 mr-2" />
              Terminal
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="h-4 w-4 mr-2" />
              Podaci
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="h-4 w-4 mr-2" />
              Logovi
            </TabsTrigger>
            <TabsTrigger value="audit">
              <ClockClockwise className="h-4 w-4 mr-2" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export/Import
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Gear className="h-4 w-4 mr-2" />
              Postavke
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Command Terminal
                </CardTitle>
                <CardDescription>
                  Unesite komandu za upravljanje sistemom. Tip 'help' za listu komandi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="command-input"
                      placeholder="Unesite komandu... (npr. 'help', 'stats', 'clear-cache')"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="font-mono"
                      disabled={isProcessing}
                    />
                  </div>
                  <Button 
                    onClick={() => executeCommand(commandInput)}
                    disabled={!commandInput.trim() || isProcessing}
                  >
                    {isProcessing ? <ArrowClockwise className="h-4 w-4 animate-spin" /> : 'Execute'}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {quickCommands.map(({ cmd, label, icon: Icon }) => (
                    <Button
                      key={cmd}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCommandInput(cmd)
                        executeCommand(cmd)
                      }}
                      disabled={isProcessing}
                      className="gap-2"
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Recent Commands</Label>
                  <ScrollArea className="h-64 w-full rounded-md border bg-muted/30 p-4">
                    <div className="space-y-2 font-mono text-sm">
                      {adminLogs && adminLogs.length > 0 ? (
                        adminLogs.map((log, index) => (
                          <div key={index} className="flex items-start gap-2">
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" weight="fill" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" weight="fill" />
                            )}
                            <div className="flex-1 break-words">
                              <span className="text-muted-foreground text-xs">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <br />
                              {log.message}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-center py-8">
                          Nema izvršenih komandi
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Dostupne Komande
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Opšte</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li><code>help</code> - Lista komandi</li>
                      <li><code>stats</code> - Sistemske statistike</li>
                      <li><code>refresh</code> - Osvježi podatke</li>
                      <li><code>system-info</code> - Info o korisniku</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Brisanje</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li><code>clear-history</code> - Obriši klasifikacije</li>
                      <li><code>clear-conversations</code> - Obriši chat</li>
                      <li><code>clear-cache</code> - Obriši cache</li>
                      <li><code>clear-all</code> - Obriši sve</li>
                      <li><code>clear-logs</code> - Obriši logove</li>
                      <li><code>delete-old [days]</code> - Obriši stare</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Backup/Export</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li><code>backup</code> - Kreiraj backup</li>
                      <li><code>restore [key]</code> - Vrati backup</li>
                      <li><code>export-data</code> - Export JSON</li>
                      <li><code>import-data</code> - Import JSON</li>
                      <li><code>list-backups</code> - Lista backup-a</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Ostalo</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li><code>optimize</code> - Optimizuj bazu</li>
                      <li><code>god-mode-on</code> - Aktiviraj God Mode</li>
                      <li><code>god-mode-off</code> - Deaktiviraj God Mode</li>
                      <li><code>list-keys</code> - Sve storage ključeve</li>
                      <li><code>count-*</code> - Brojanje stavki</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Klasifikacije</CardTitle>
                  <CardDescription>
                    {history?.length || 0} ukupno klasifikacija u sistemu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => executeCommand('count-classifications')}
                  >
                    <ChartBar className="h-4 w-4" />
                    Prebroj klasifikacije
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      if (confirm('Da li ste sigurni? Ova akcija se ne može poništiti.')) {
                        executeCommand('clear-history')
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                    Obriši sve klasifikacije
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Konverzacije</CardTitle>
                  <CardDescription>
                    {conversations?.length || 0} aktivnih konverzacija
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => executeCommand('count-conversations')}
                  >
                    <ChartBar className="h-4 w-4" />
                    Prebroj konverzacije
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      if (confirm('Da li ste sigurni? Ova akcija se ne može poništiti.')) {
                        executeCommand('clear-conversations')
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                    Obriši sve konverzacije
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache i Optimizacija</CardTitle>
                  <CardDescription>
                    {systemStats.cacheSize} KB cache memorije
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => executeCommand('optimize')}
                  >
                    <Lightning className="h-4 w-4" />
                    Optimizuj bazu
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => executeCommand('clear-cache')}
                  >
                    <ArrowClockwise className="h-4 w-4" />
                    Očisti cache
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opasne Akcije</CardTitle>
                  <CardDescription>
                    Akcije koje brišu sve podatke
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      if (confirm('UPOZORENJE: Ova akcija će obrisati SVE podatke!\n\nDa li ste apsolutno sigurni?')) {
                        executeCommand('clear-all')
                      }
                    }}
                  >
                    <Warning className="h-4 w-4" />
                    Obriši SVE podatke
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Admin Logovi</CardTitle>
                  <CardDescription>
                    Povijest izvršenih komandi i sistemskih događaja
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => executeCommand('clear-logs')}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Očisti
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {adminLogs && adminLogs.length > 0 ? (
                      adminLogs.map((log, index) => {
                        const hasData = log.data !== undefined && log.data !== null
                        return (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              {log.success ? (
                                <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" weight="fill" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" weight="fill" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm break-words">{log.message}</p>
                                {hasData && (
                                  <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </Badge>
                          </div>
                        </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Nema logova
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditLogViewer lang={lang} scriptVariant={scriptVariant} />
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Podataka
                </CardTitle>
                <CardDescription>
                  Eksportuj sve podatke u JSON format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full gap-2"
                  onClick={() => executeCommand('export-data')}
                  disabled={isProcessing}
                >
                  <Download className="h-4 w-4" />
                  Export podataka
                </Button>
                {exportData && (
                  <div className="space-y-2">
                    <Label>Eksportovani podaci (preview)</Label>
                    <Textarea 
                      value={exportData.slice(0, 500) + '...'}
                      readOnly
                      className="font-mono text-xs h-32"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Podataka
                </CardTitle>
                <CardDescription>
                  Importuj podatke iz JSON fajla
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-data">JSON podaci</Label>
                  <Textarea 
                    id="import-data"
                    placeholder='{"version": "1.0", "history": [...], "conversations": [...]}'
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="font-mono text-xs h-32"
                  />
                </div>
                <Button 
                  className="w-full gap-2"
                  onClick={() => executeCommand('import-data')}
                  disabled={!importData || isProcessing}
                >
                  <Upload className="h-4 w-4" />
                  Import podataka
                </Button>
                <Alert>
                  <Warning className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Import će prepisati postojeće podatke. Napravite backup prije importa.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {godMode ? (
                    <LockOpen className="h-5 w-5 text-destructive" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                  God Mode
                </CardTitle>
                <CardDescription>
                  Napredni režim sa svim privilegijama i bez ograničenja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {godMode ? 'God Mode je trenutno aktivan' : 'God Mode je deaktiviran'}
                    </p>
                  </div>
                  <Badge variant={godMode ? "destructive" : "outline"}>
                    {godMode ? 'AKTIVAN' : 'NEAKTIVAN'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button 
                    variant={godMode ? "outline" : "destructive"}
                    className="flex-1 gap-2"
                    onClick={() => executeCommand(godMode ? 'god-mode-off' : 'god-mode-on')}
                  >
                    {godMode ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Deaktiviraj
                      </>
                    ) : (
                      <>
                        <Lightning className="h-4 w-4" />
                        Aktiviraj
                      </>
                    )}
                  </Button>
                </div>
                {godMode && (
                  <Alert variant="destructive">
                    <Warning className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      God Mode omogućava neograničen pristup svim funkcijama sistema. Koristite odgovorno.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sistemske Informacije</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Verzija</p>
                    <p className="font-mono">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Build</p>
                    <p className="font-mono">2024.01</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cache Size</p>
                    <p className="font-mono">{systemStats.cacheSize} KB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="font-mono">Active</p>
                  </div>
                </div>
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => executeCommand('system-info')}
                >
                  <Pulse className="h-4 w-4" />
                  Provjeri sistem info
                </Button>
              </CardContent>
            </Card>

            <DiagnosticsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
