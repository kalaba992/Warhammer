import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useKV } from '@/hooks'
import type { AuditLogEntry, AuditActionType, Language } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ClockClockwise,
  Download,
  Trash,
  MagnifyingGlass,
  FunnelSimple,
  Info,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Tag,
  FileText,
  Shield,
  Lightning,
  Database,
  Gear,
  Warning
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { applyScriptVariant } from '@/lib/translations'
import { auditLogger } from '@/lib/auditLog'

interface AuditLogViewerProps {
  lang: Language
  scriptVariant: 'latin' | 'cyrillic'
}

const actionTypeLabels: Record<AuditActionType, string> = {
  COMMAND_EXECUTED: 'Komanda izvršena',
  DATA_EXPORT: 'Podaci eksportovani',
  DATA_IMPORT: 'Podaci importovani',
  DATA_DELETED: 'Podaci obrisani',
  CACHE_CLEARED: 'Cache očišćen',
  BACKUP_CREATED: 'Backup kreiran',
  BACKUP_RESTORED: 'Backup vraćen',
  SETTINGS_CHANGED: 'Postavke promijenjene',
  GOD_MODE_TOGGLED: 'God Mode promijenjen',
  USER_LOGIN: 'Korisnik prijavljen',
  USER_LOGOUT: 'Korisnik odjavljen',
  CLASSIFICATION_CREATED: 'Klasifikacija kreirana',
  CLASSIFICATION_DELETED: 'Klasifikacija obrisana',
  CONVERSATION_DELETED: 'Konverzacija obrisana',
  SYSTEM_OPTIMIZED: 'Sistem optimizovan',
  ERROR_OCCURRED: 'Greška došla'
}

type IconComponent = React.ComponentType<{ className?: string; weight?: React.ComponentProps<typeof CheckCircle>['weight'] }>

const actionTypeIcons: Record<AuditActionType, IconComponent> = {
  COMMAND_EXECUTED: Lightning,
  DATA_EXPORT: Download,
  DATA_IMPORT: Download,
  DATA_DELETED: Trash,
  CACHE_CLEARED: Database,
  BACKUP_CREATED: Shield,
  BACKUP_RESTORED: Shield,
  SETTINGS_CHANGED: Gear,
  GOD_MODE_TOGGLED: Lightning,
  USER_LOGIN: User,
  USER_LOGOUT: User,
  CLASSIFICATION_CREATED: FileText,
  CLASSIFICATION_DELETED: Trash,
  CONVERSATION_DELETED: Trash,
  SYSTEM_OPTIMIZED: Lightning,
  ERROR_OCCURRED: Warning
}

const actionTypeColors: Record<AuditActionType, string> = {
  COMMAND_EXECUTED: 'bg-blue-500/10 text-blue-700',
  DATA_EXPORT: 'bg-green-500/10 text-green-700',
  DATA_IMPORT: 'bg-purple-500/10 text-purple-700',
  DATA_DELETED: 'bg-red-500/10 text-red-700',
  CACHE_CLEARED: 'bg-yellow-500/10 text-yellow-700',
  BACKUP_CREATED: 'bg-cyan-500/10 text-cyan-700',
  BACKUP_RESTORED: 'bg-cyan-500/10 text-cyan-700',
  SETTINGS_CHANGED: 'bg-gray-500/10 text-gray-700',
  GOD_MODE_TOGGLED: 'bg-orange-500/10 text-orange-700',
  USER_LOGIN: 'bg-green-500/10 text-green-700',
  USER_LOGOUT: 'bg-gray-500/10 text-gray-700',
  CLASSIFICATION_CREATED: 'bg-blue-500/10 text-blue-700',
  CLASSIFICATION_DELETED: 'bg-red-500/10 text-red-700',
  CONVERSATION_DELETED: 'bg-red-500/10 text-red-700',
  SYSTEM_OPTIMIZED: 'bg-green-500/10 text-green-700',
  ERROR_OCCURRED: 'bg-red-500/10 text-red-700'
}

export function AuditLogViewer({ lang, scriptVariant }: AuditLogViewerProps) {
  const [auditLogs, setAuditLogs] = useKV<AuditLogEntry[]>('audit-logs', [])
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedActionType, setSelectedActionType] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const applyFilters = useCallback(() => {
    let filtered = [...(auditLogs || [])]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log =>
        log.actionDescription.toLowerCase().includes(term) ||
        log.userEmail.toLowerCase().includes(term) ||
        log.userLogin.toLowerCase().includes(term) ||
        log.targetResource?.toLowerCase().includes(term)
      )
    }

    if (selectedActionType !== 'all') {
      filtered = filtered.filter(log => log.actionType === selectedActionType)
    }

    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.userId === selectedUser)
    }

    if (dateRange !== 'all') {
      const now = Date.now()
      let cutoff = 0
      switch (dateRange) {
        case 'today':
          cutoff = now - 24 * 60 * 60 * 1000
          break
        case 'week':
          cutoff = now - 7 * 24 * 60 * 60 * 1000
          break
        case 'month':
          cutoff = now - 30 * 24 * 60 * 60 * 1000
          break
      }
      filtered = filtered.filter(log => log.timestamp >= cutoff)
    }

    setFilteredLogs(filtered)
  }, [auditLogs, dateRange, searchTerm, selectedActionType, selectedUser])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const getUniqueUsers = () => {
    const users = new Set<string>()
    auditLogs?.forEach(log => users.add(log.userId))
    return Array.from(users)
  }

  const handleExportLogs = () => {
    const exportData = JSON.stringify(filteredLogs, null, 2)
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(applyScriptVariant('Logovi eksportovani', lang, scriptVariant))
  }

  const handleClearLogs = async () => {
    if (confirm(applyScriptVariant('Da li ste sigurni da želite obrisati sve audit logove?', lang, scriptVariant))) {
      await auditLogger.log('DATA_DELETED', {
        targetResource: 'audit-logs',
        metadata: { count: auditLogs?.length || 0 }
      })
      setAuditLogs([])
      toast.success(applyScriptVariant('Logovi obrisani', lang, scriptVariant))
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-GB')
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-GB')
  }

  const getActionIcon = (actionType: AuditActionType) => {
    const Icon = actionTypeIcons[actionType] || Info
    return <Icon className="h-4 w-4" />
  }

  const getActionColor = (actionType: AuditActionType) => {
    return actionTypeColors[actionType] || 'bg-gray-500/10 text-gray-700'
  }

  const stats = {
    total: auditLogs?.length || 0,
    today: auditLogs?.filter(log => log.timestamp > Date.now() - 24 * 60 * 60 * 1000).length || 0,
    successful: auditLogs?.filter(log => log.success).length || 0,
    failed: auditLogs?.filter(log => !log.success).length || 0
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <ClockClockwise className="h-8 w-8 text-accent" weight="fill" />
              {applyScriptVariant('Audit Log', lang, scriptVariant)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {applyScriptVariant('Kompletan pregled svih admin aktivnosti sa vremenskim oznakama', lang, scriptVariant)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="destructive" onClick={handleClearLogs}>
              <Trash className="h-4 w-4 mr-2" />
              Obriši sve
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ukupno Logova</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Svi zapisi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Danas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stats.today}</div>
              <p className="text-xs text-muted-foreground mt-1">Posljednjih 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" weight="fill" />
                Uspješno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-accent">{stats.successful}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}% stopa uspjeha
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" weight="fill" />
                Greške
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-destructive">{stats.failed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}% stopa greške
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FunnelSimple className="h-5 w-5" />
              Filteri
            </CardTitle>
            <CardDescription>
              Filtrirajte audit logove po različitim kriterijima
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">
                  <MagnifyingGlass className="h-4 w-4 inline mr-1" />
                  Pretraga
                </Label>
                <Input
                  id="search"
                  placeholder="Pretraži logove..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="action-type">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Tip akcije
                </Label>
                <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                  <SelectTrigger id="action-type">
                    <SelectValue placeholder="Svi tipovi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi tipovi</SelectItem>
                    {Object.entries(actionTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">
                  <User className="h-4 w-4 inline mr-1" />
                  Korisnik
                </Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Svi korisnici" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi korisnici</SelectItem>
                    {getUniqueUsers().map(userId => (
                      <SelectItem key={userId} value={userId}>
                        {userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-range">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Vremenski period
                </Label>
                <Select value={dateRange} onValueChange={(value: 'all' | 'today' | 'week' | 'month') => setDateRange(value)}>
                  <SelectTrigger id="date-range">
                    <SelectValue placeholder="Svi datumi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi datumi</SelectItem>
                    <SelectItem value="today">Danas</SelectItem>
                    <SelectItem value="week">Posljednjih 7 dana</SelectItem>
                    <SelectItem value="month">Posljednjih 30 dana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(searchTerm || selectedActionType !== 'all' || selectedUser !== 'all' || dateRange !== 'all') && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary">
                  {filteredLogs.length} rezultata
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedActionType('all')
                    setSelectedUser('all')
                    setDateRange('all')
                  }}
                >
                  Resetuj filtere
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logovi</CardTitle>
            <CardDescription>
              {filteredLogs.length} {filteredLogs.length === 1 ? 'zapis' : 'zapisa'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Vrijeme</TableHead>
                    <TableHead>Korisnik</TableHead>
                    <TableHead>Akcija</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead>Resurs</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="group">
                        <TableCell>
                          {log.success ? (
                            <CheckCircle className="h-5 w-5 text-accent" weight="fill" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" weight="fill" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div>{formatDate(log.timestamp)}</div>
                          <div className="text-muted-foreground">{formatTime(log.timestamp)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{log.userLogin}</div>
                              <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${getActionColor(log.actionType)}`}>
                            {getActionIcon(log.actionType)}
                            {actionTypeLabels[log.actionType]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.actionDescription}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.targetResource || '-'}
                        </TableCell>
                        <TableCell>
                          <Dialog open={isDetailsOpen && selectedLog?.id === log.id} onOpenChange={(open) => {
                            setIsDetailsOpen(open)
                            if (!open) setSelectedLog(null)
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log)
                                  setIsDetailsOpen(true)
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {getActionIcon(log.actionType)}
                                  Detalji Audit Loga
                                </DialogTitle>
                                <DialogDescription>
                                  Log ID: {log.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      {log.success ? (
                                        <>
                                          <CheckCircle className="h-5 w-5 text-accent" weight="fill" />
                                          <span className="font-medium text-accent">Uspješno</span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-5 w-5 text-destructive" weight="fill" />
                                          <span className="font-medium text-destructive">Neuspješno</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Vrijeme</Label>
                                    <div className="font-mono text-sm mt-1">{formatTimestamp(log.timestamp)}</div>
                                  </div>
                                </div>

                                <Separator />

                                <div>
                                  <Label className="text-xs text-muted-foreground">Korisnik</Label>
                                  <div className="mt-1 space-y-1">
                                    <div className="text-sm"><strong>Login:</strong> {log.userLogin}</div>
                                    <div className="text-sm"><strong>Email:</strong> {log.userEmail}</div>
                                    <div className="text-sm"><strong>ID:</strong> {log.userId}</div>
                                  </div>
                                </div>

                                <Separator />

                                <div>
                                  <Label className="text-xs text-muted-foreground">Akcija</Label>
                                  <Badge variant="outline" className={`gap-1 mt-1 ${getActionColor(log.actionType)}`}>
                                    {getActionIcon(log.actionType)}
                                    {actionTypeLabels[log.actionType]}
                                  </Badge>
                                </div>

                                <div>
                                  <Label className="text-xs text-muted-foreground">Opis</Label>
                                  <div className="text-sm mt-1">{log.actionDescription}</div>
                                </div>

                                {log.targetResource && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Ciljni resurs</Label>
                                    <div className="text-sm mt-1 font-mono bg-muted px-2 py-1 rounded">
                                      {log.targetResource}
                                      {log.resourceId && <span className="text-muted-foreground"> ({log.resourceId})</span>}
                                    </div>
                                  </div>
                                )}

                                {log.errorMessage && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground text-destructive">Poruka greške</Label>
                                    <div className="text-sm mt-1 text-destructive bg-destructive/10 px-2 py-1 rounded">
                                      {log.errorMessage}
                                    </div>
                                  </div>
                                )}

                                {(log.oldValue !== undefined || log.newValue !== undefined) && (
                                  <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                      {log.oldValue !== undefined && (
                                        <div>
                                          <Label className="text-xs text-muted-foreground">Stara vrijednost</Label>
                                          <pre className="text-xs mt-1 bg-muted px-2 py-1 rounded overflow-auto max-h-32">
                                            {JSON.stringify(log.oldValue, null, 2) ?? ''}
                                          </pre>
                                        </div>
                                      )}
                                      {log.newValue !== undefined && (
                                        <div>
                                          <Label className="text-xs text-muted-foreground">Nova vrijednost</Label>
                                          <pre className="text-xs mt-1 bg-muted px-2 py-1 rounded overflow-auto max-h-32">
                                            {JSON.stringify(log.newValue, null, 2) ?? ''}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}

                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Dodatni podaci (Metadata)</Label>
                                    <pre className="text-xs mt-1 bg-muted px-2 py-1 rounded overflow-auto max-h-32">
                                      {JSON.stringify(log.metadata, null, 2) ?? ''}
                                    </pre>
                                  </div>
                                )}

                                {log.userAgent && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">User Agent</Label>
                                    <div className="text-xs mt-1 text-muted-foreground font-mono break-all">
                                      {log.userAgent}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Nema logova koji odgovaraju filterima
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
