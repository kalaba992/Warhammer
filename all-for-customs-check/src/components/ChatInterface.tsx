import { useState, useRef, useEffect } from 'react'
import type { Conversation, Language, ScriptVariant } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PaperPlaneRight, User, Robot, Translate } from '@phosphor-icons/react'
import { t, applyScriptVariant } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { useScriptConverter } from '@/hooks/use-script-converter'
import { ClassificationDetailsPanel } from '@/components/ClassificationDetailsPanel'
import { QuickActionsBar } from '@/components/QuickActionsBar'

interface ChatInterfaceProps {
  conversation?: Conversation
  onSendMessage: (content: string) => void
  isProcessing: boolean
  lang: Language
  hsDescLang: Language
  scriptVariant: ScriptVariant
}

export function ChatInterface({
  conversation,
  onSendMessage,
  isProcessing,
  lang,
  scriptVariant
}: Omit<ChatInterfaceProps, 'hsDescLang'>) {
  const [input, setInput] = useState('')
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation?.messages])

  const toggleExpanded = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const handleSubmit = () => {
    if (!input.trim() || isProcessing) return
    const convertedInput = applyScriptVariant(input, lang, scriptVariant)
    onSendMessage(convertedInput)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const MessageContent = ({ content }: { content: string }) => {
    const convertedContent = useScriptConverter(content, lang, scriptVariant)
    return <p className="whitespace-pre-wrap">{convertedContent}</p>
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6">
          {!conversation || conversation.messages.length === 0 ? (
            <div className="text-center py-12">
              <Robot size={64} className="mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">{t('appTitle', lang)}</h2>
              <p className="text-muted-foreground">{t('askQuestion', lang)}</p>
            </div>
          ) : (
            conversation.messages.map((message, index) => {
              const previousUserMessage = [...conversation.messages]
                .slice(0, index)
                .reverse()
                .find(m => m.role === 'user')

              const productDescriptionForThisTurn = previousUserMessage?.content || ''

              return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Robot size={20} className="text-primary-foreground" />
                  </div>
                )}

                <div className={cn(
                  'max-w-2xl',
                  message.role === 'user' ? 'order-1' : 'order-2'
                )}>
                  <Card className={cn(
                    'p-4',
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'
                  )}>
                    <MessageContent content={message.content} />

                    {message.classification && (
                      <div className="mt-4 space-y-3">
                        <Separator />
                        
                        <ClassificationDetailsPanel
                          result={message.classification}
                          lang={lang}
                          scriptVariant={scriptVariant}
                          expanded={expandedMessages.has(message.id)}
                          onToggleExpanded={() => toggleExpanded(message.id)}
                        />

                        <QuickActionsBar
                          result={message.classification}
                          productDescription={productDescriptionForThisTurn}
                          lang={lang}
                          scriptVariant={scriptVariant}
                          onReclassify={() => {
                            if (productDescriptionForThisTurn) setInput(productDescriptionForThisTurn)
                          }}
                          onTryFallback={() => {
                            if (!productDescriptionForThisTurn || isProcessing) return
                            onSendMessage(`FALLBACK: ${productDescriptionForThisTurn}`)
                          }}
                        />
                      </div>
                    )}
                  </Card>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 order-2">
                    <User size={20} className="text-secondary-foreground" />
                  </div>
                )}
              </div>
              )
            })
          )}

          {isProcessing && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Robot size={20} className="text-primary-foreground" />
              </div>
              <Card className="p-4">
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('analyzing', lang)}</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          {(lang === 'ba' || lang === 'sr') && input.trim() && (
            <div className="mb-2 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-help px-2 py-1 rounded-md bg-muted/50">
                    <Translate size={14} weight="duotone" />
                    <span>{t('scriptVariant', lang)}: <span className="font-medium">{scriptVariant === 'latin' ? t('latinScript', lang) : t('cyrillicScript', lang)}</span></span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{t('autoConvertNotice', lang)}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('typeMessage', lang)}
              className="flex-1 min-h-[60px] max-h-[120px]"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              size="lg"
            >
              <PaperPlaneRight size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
