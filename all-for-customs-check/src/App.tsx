import { useState, lazy, Suspense, useEffect } from 'react'
import { useKV } from '@/hooks'
import type { Message, Conversation, ClassificationHistory, UserPreferences } from '@/types'
import { classifyProduct, answerClassificationQuestion } from '@/lib/aiService'
import { ChatInterface } from '@/components/ChatInterface'
import { HSCodeSearch } from '@/components/HSCodeSearch'
import { HSCodeTreeView } from '@/components/HSCodeTreeView'
import { LanguageSettings } from '@/components/LanguageSettings'
import { DocumentUpload } from '@/components/DocumentUpload'
import { Sidebar } from '@/components/Sidebar'
import { LoadingFallback } from '@/components/LoadingFallback'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Info } from '@phosphor-icons/react'
import { t, applyScriptVariant } from '@/lib/translations'
import { toast } from 'sonner'
import { auditLogger } from '@/lib/auditLog'

// Lazy load large components
const ClassificationHistoryView = lazy(() => import('@/components/ClassificationHistoryView').then(m => ({ default: m.ClassificationHistoryView })))
const ClassificationStatistics = lazy(() => import('@/components/ClassificationStatistics').then(m => ({ default: m.ClassificationStatistics })))
const AdvancedDashboard = lazy(() => import('@/components/AdvancedDashboard').then(m => ({ default: m.AdvancedDashboard })))
const BatchDocumentUpload = lazy(() => import('@/components/BatchDocumentUpload').then(m => ({ default: m.BatchDocumentUpload })))
const SpreadsheetImport = lazy(() => import('@/components/SpreadsheetImport').then(m => ({ default: m.SpreadsheetImport })))
const AdminDashboard = lazy(() => import('@/components/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const KnowledgeBaseImport = lazy(() => import('@/components/KnowledgeBaseImport').then(m => ({ default: m.KnowledgeBaseImport })))
const KnowledgeBaseBrowser = lazy(() => import('@/components/KnowledgeBaseBrowser').then(m => ({ default: m.KnowledgeBaseBrowser })))

function App() {
  const [preferences, setPreferences] = useKV<UserPreferences>('user-preferences', {
    uiLanguage: 'ba',
    hsDescriptionLanguage: 'ba',
    aiCommunicationLanguage: 'ba',
    scriptVariant: 'latin'
  })

  const [conversations, setConversations] = useKV<Conversation[]>('conversations', [])
  const [history, setHistory] = useKV<ClassificationHistory[]>('classification-history', [])
  const [favorites, setFavorites] = useKV<string[]>('favorites', [])

  const [currentView, setCurrentView] = useState<'chat' | 'search' | 'tree-view' | 'history' | 'settings' | 'documents' | 'batch-upload' | 'spreadsheet-import' | 'dashboard' | 'advanced-dashboard' | 'admin' | 'knowledge-base' | 'knowledge-browser'>('chat')
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  // userChecked tracks if user role initialization is complete

  const lang = preferences?.uiLanguage || 'ba'
  const scriptVariant = preferences?.scriptVariant || 'latin'

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const user = await window.spark?.user?.()
        setIsOwner(user?.isOwner || false)
        await auditLogger.initializeUser()
        await auditLogger.log('USER_LOGIN', {
          metadata: { 
            isOwner: user?.isOwner || false,
            email: user?.email || 'user@carinski-asistent.com'
          }
        })
      } catch (error) {
        console.error('Error checking user role:', error)
        setIsOwner(false)
      }
    }
    checkUserRole()
  }, [])

  const getCurrentConversation = (): Conversation | undefined => {
    return conversations?.find(c => c.id === currentConversationId)
  }

  const createNewConversation = (firstMessage: string): string => {
    const newId = `conv-${Date.now()}`
    const newConversation: Conversation = {
      id: newId,
      title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setConversations(prev => [...(prev || []), newConversation])
    return newId
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return

    setIsProcessing(true)

    let activeConvId: string | null = currentConversationId

    try {
      let convId = currentConversationId
      if (!convId) {
        convId = createNewConversation(content)
        setCurrentConversationId(convId)
      }

      activeConvId = convId

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now()
      }

      setConversations(currentConvs =>
        (currentConvs || []).map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, userMessage], updatedAt: Date.now() }
            : c
        )
      )

      const trimmed = content.trim()
      const lower = trimmed.toLowerCase()

      const isFallbackRequest = /^fallback\s*:/i.test(trimmed)

      // Heuristic routing:
      // - Allow "općeniti chat" by NOT treating every long message as a classification request.
      // - Still treat explicit HS/classification intents (or structured product specs) as classification.
      const hasClassificationKeywords =
        lower.includes('klasificiraj') ||
        lower.includes('classify') ||
        lower.includes('hs kod') ||
        lower.includes('hs code') ||
        lower.includes('taric') ||
        lower.includes('tarifa') ||
        lower.includes('tarifni') ||
        lower.includes('gir') ||
        lower.includes('carinska klasifikacija')

      const mentionsHsFormat = /\b\d{4}\.\d{2}\.\d{2}\b/.test(trimmed)

      const looksLikeStructuredProductSpec =
        trimmed.length > 40 &&
        (lower.includes('materijal') ||
          lower.includes('sastav') ||
          lower.includes('namjena') ||
          lower.includes('upotreba') ||
          lower.includes('porijeklo') ||
          lower.includes('dimenz') ||
          /\b(kg|g|cm|mm|%|w|v)\b/.test(lower) ||
          trimmed.includes('\n') ||
          trimmed.includes(':'))

      const isClassificationRequest =
        isFallbackRequest || hasClassificationKeywords || mentionsHsFormat || looksLikeStructuredProductSpec

      if (isClassificationRequest) {
        const description = isFallbackRequest ? trimmed.replace(/^fallback\s*:/i, '').trim() : content

        const result = await classifyProduct(
          description,
          preferences?.aiCommunicationLanguage || 'ba',
          isFallbackRequest ? { mode: 'FALLBACK' } : undefined
        )

        const historyEntry: ClassificationHistory = {
          id: `hist-${Date.now()}`,
          productDescription: content,
          result,
          conversationId: convId,
          timestamp: Date.now()
        }

        setHistory(currentHistory => [historyEntry, ...(currentHistory || [])])

        await auditLogger.log('CLASSIFICATION_CREATED', {
          targetResource: 'classification',
          resourceId: historyEntry.id,
          metadata: {
            hsCode: result.hsCode,
            confidence: result.confidence,
            productDescription: content.slice(0, 100)
          }
        })

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content:
            result.hsCode === 'STOP'
              ? (result.reasoning?.[0] || 'Ne mogu završiti klasifikaciju bez dodatnih informacija.')
              : `Klasifikacija završena. HS Kod: ${result.hsCode}`,
          timestamp: Date.now(),
          classification: result
        }

        setConversations(currentConvs =>
          (currentConvs || []).map(c =>
            c.id === convId
              ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() }
              : c
          )
        )
      } else {
        const answer = await answerClassificationQuestion(content, preferences?.aiCommunicationLanguage || 'ba')

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: answer,
          timestamp: Date.now()
        }

        setConversations(currentConvs =>
          (currentConvs || []).map(c =>
            c.id === convId
              ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() }
              : c
          )
        )
      }
    } catch (error) {
      console.error('Error:', error)
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Došlo je do greške. Molimo pokušajte ponovo.',
        timestamp: Date.now()
      }

      setConversations(currentConvs =>
        (currentConvs || []).map(c =>
          c.id === (activeConvId || currentConversationId)
            ? { ...c, messages: [...c.messages, errorMessage], updatedAt: Date.now() }
            : c
        )
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNewConversation = () => {
    setCurrentConversationId(null)
  }

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
    setCurrentView('chat')
  }

  const handleToggleFavorite = (historyId: string) => {
    setHistory(currentHistory =>
      (currentHistory || []).map(h =>
        h.id === historyId ? { ...h, isFavorite: !h.isFavorite } : h
      )
    )
  }

  const handleDeleteHistory = async (historyId: string) => {
    const deletedItem = history?.find(h => h.id === historyId)
    setHistory(currentHistory => (currentHistory || []).filter(h => h.id !== historyId))
    
    if (deletedItem) {
      await auditLogger.log('CLASSIFICATION_DELETED', {
        targetResource: 'classification',
        resourceId: historyId,
        metadata: {
          hsCode: deletedItem.result.hsCode,
          productDescription: deletedItem.productDescription.slice(0, 100)
        }
      })
    }
  }

  const handleDocumentUpload = async (file: File, productDescription: string) => {
    setIsProcessing(true)
    try {
      toast.info(applyScriptVariant('Analiziranje dokumenta...', lang, scriptVariant))
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        
        const classificationText = productDescription 
          ? `${productDescription}\n\nEkstraktovan tekst iz dokumenta: ${text.slice(0, 1000)}` 
          : `Dokument: ${file.name}\n\n${text.slice(0, 1000)}`
        
        const result = await classifyProduct(classificationText, preferences?.aiCommunicationLanguage || 'ba')
        
        const historyEntry: ClassificationHistory = {
          id: `hist-${Date.now()}`,
          productDescription: `[Dokument: ${file.name}] ${productDescription || 'Automatska analiza'}`,
          result,
          timestamp: Date.now()
        }
        
        setHistory(currentHistory => [historyEntry, ...(currentHistory || [])])
        
        toast.success(
          applyScriptVariant(`Dokument analiziran! HS Kod: ${result.hsCode}`, lang, scriptVariant)
        )
      }
      
      reader.readAsText(file)
    } catch (error) {
      console.error('Document upload error:', error)
      toast.error(
        applyScriptVariant('Greška pri analizi dokumenta. Molimo pokušajte ponovo.', lang, scriptVariant)
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleChangeView = (view: 'chat' | 'search' | 'tree-view' | 'history' | 'settings' | 'documents' | 'batch-upload' | 'spreadsheet-import' | 'dashboard' | 'advanced-dashboard' | 'admin' | 'knowledge-base' | 'knowledge-browser') => {
    setCurrentView(view)
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <Toaster />
        <Sidebar
          conversations={conversations || []}
          currentConversationId={currentConversationId}
          currentView={currentView}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onChangeView={handleChangeView}
          lang={lang}
          scriptVariant={scriptVariant}
          isOwner={isOwner}
        />

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            {import.meta.env.DEV && (
              <Alert className="bg-accent/10 border-accent">
                <Info className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm">
                  {applyScriptVariant(t('demoNotice', lang), lang, scriptVariant)}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {currentView === 'chat' && (
              <ChatInterface
                conversation={getCurrentConversation()}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                lang={lang}
                scriptVariant={scriptVariant}
              />
            )}

            {currentView === 'dashboard' && (
              <div className="h-full overflow-auto p-6">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-3xl font-semibold">{applyScriptVariant('Dashboard', lang, scriptVariant)}</h2>
                    <p className="text-muted-foreground mt-1">
                      {applyScriptVariant('Pregled statistika klasifikacija i korištenja', lang, scriptVariant)}
                    </p>
                  </div>
                  <Suspense fallback={<LoadingFallback />}>
                    <ClassificationStatistics
                      history={history || []}
                      lang={lang}
                      scriptVariant={scriptVariant}
                    />
                  </Suspense>
                </div>
              </div>
            )}

            {currentView === 'advanced-dashboard' && (
              <div className="h-full overflow-auto p-6">
                <div className="max-w-7xl mx-auto">
                  <Suspense fallback={<LoadingFallback />}>
                    <AdvancedDashboard
                      history={history || []}
                      lang={lang}
                      scriptVariant={scriptVariant}
                    />
                  </Suspense>
                </div>
              </div>
            )}

            {currentView === 'search' && (
              <HSCodeSearch
                lang={lang}
                hsDescLang={preferences?.hsDescriptionLanguage || 'ba'}
                scriptVariant={scriptVariant}
                favorites={favorites || []}
                onToggleFavorite={(code) => {
                  setFavorites(currentFavs =>
                    (currentFavs || []).includes(code)
                      ? (currentFavs || []).filter(f => f !== code)
                      : [...(currentFavs || []), code]
                  )
                }}
              />
            )}

            {currentView === 'tree-view' && (
              <HSCodeTreeView
                lang={lang}
                scriptVariant={scriptVariant}
                favorites={favorites || []}
                onToggleFavorite={(code) => {
                  setFavorites(currentFavs =>
                    (currentFavs || []).includes(code)
                      ? (currentFavs || []).filter(f => f !== code)
                      : [...(currentFavs || []), code]
                  )
                }}
                onSelectCode={(code) => {
                  console.log('Selected code:', code)
                }}
              />
            )}

            {currentView === 'history' && (
              <Suspense fallback={<LoadingFallback />}>
                <ClassificationHistoryView
                  history={history || []}
                  lang={lang}
                  scriptVariant={scriptVariant}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteHistory}
                />
              </Suspense>
            )}

            {currentView === 'documents' && (
              <DocumentUpload
                lang={lang}
                scriptVariant={scriptVariant}
                onUpload={handleDocumentUpload}
                isProcessing={isProcessing}
              />
            )}

            {currentView === 'batch-upload' && (
              <Suspense fallback={<LoadingFallback />}>
                <BatchDocumentUpload
                  lang={lang}
                  scriptVariant={scriptVariant}
                  isProcessing={isProcessing}
                />
              </Suspense>
            )}

            {currentView === 'spreadsheet-import' && (
              <Suspense fallback={<LoadingFallback />}>
                <SpreadsheetImport
                  lang={lang}
                  scriptVariant={scriptVariant}
                />
              </Suspense>
            )}

            {currentView === 'settings' && preferences && (
              <LanguageSettings
                preferences={preferences}
                onUpdatePreferences={setPreferences}
                lang={lang}
              />
            )}

            {currentView === 'admin' && (
              <Suspense fallback={<LoadingFallback />}>
                {isOwner ? (
                  <AdminDashboard
                    lang={lang}
                    scriptVariant={scriptVariant}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    <Alert className="max-w-md" variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {applyScriptVariant('Pristup odbijen. Admin panel je dostupan samo vlasnicima aplikacije.', lang, scriptVariant)}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </Suspense>
            )}

            {currentView === 'knowledge-base' && (
              <Suspense fallback={<LoadingFallback />}>
                {isOwner ? (
                  <KnowledgeBaseImport
                    lang={lang}
                    scriptVariant={scriptVariant}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    <Alert className="max-w-md" variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {applyScriptVariant('Pristup odbijen. Baza znanja je dostupna samo vlasnicima aplikacije.', lang, scriptVariant)}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </Suspense>
            )}

            {currentView === 'knowledge-browser' && (
              <Suspense fallback={<LoadingFallback />}>
                <KnowledgeBaseBrowser
                  lang={lang}
                  scriptVariant={scriptVariant}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
