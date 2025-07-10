import { useEffect, useRef, useState } from "react"
import { MessageBubble } from "@/components/message-bubble"
import { GettingStartedGuide } from "@/components/getting-started-guide"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Settings, Edit, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContextPanel } from "@/components/context-panel"

interface MessageContainerProps {
  messages: any[]
  thread: any
  isLoading: boolean
  activeTabId: string
  scrollContainerRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  messagesEndRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  isNearBottom: boolean
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  onThreadSelect: (threadId: string) => void
  onEditThread: (threadId: string) => void
  onToggleSettings: () => void
  showSettingsPanel: boolean
}

export function MessageContainer({
  messages,
  thread,
  isLoading,
  activeTabId,
  scrollContainerRefs,
  messagesEndRefs,
  isNearBottom,
  onScroll,
  onThreadSelect,
  onEditThread,
  onToggleSettings,
  showSettingsPanel
}: MessageContainerProps) {
  const [showContextPanel, setShowContextPanel] = useState(false)
  return (
    <>
      {/* Breadcrumbs */}
      <Breadcrumbs threadId={thread.id} />

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold truncate">{thread.name}</h1>
            {thread.isMainThread && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Main</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditThread(thread.id)}
              className="h-8 w-8 p-0 hover:bg-muted"
              title="Edit Thread"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
            <span>{messages.filter((m) => m.role === "user").length} user messages</span>
            {thread.contextThreadIds.length > 0 && (
              <span>• Context from {thread.contextThreadIds.length} thread(s)</span>
            )}
            {thread.parentThreadId && (
              <span className="truncate max-w-[200px]" title={`Forked from ${thread.parentThreadId}`}>
                • Forked from {thread.parentThreadId}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContextPanel(true)}
            className="h-8 px-3 hover:bg-muted"
            title="Thread Context"
          >
            <Layers className="h-4 w-4 mr-2" />
            Context
          </Button>
        </div>
      </div>

      {/* Context Panel Modal */}
      {showContextPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="fixed inset-0 z-40" onClick={() => setShowContextPanel(false)} />
          <div 
            className="bg-background rounded-lg shadow-lg overflow-hidden relative z-50" 
            style={{ minWidth: 400, maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ContextPanel threadId={thread.id} onClose={() => setShowContextPanel(false)} />
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto"
        ref={(el) => {
          scrollContainerRefs.current[activeTabId] = el
        }}
        onScroll={onScroll}
      >
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          {/* Thread Description */}
          {thread.description && (
            <div className="bg-muted/30 p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">{thread.description}</p>
            </div>
          )}

          {/* Fork Origin Indicator */}
          {thread.rootMessageId && (
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
              <p className="text-sm text-muted-foreground mb-1">🍴 Forked from message:</p>
              <p className="text-sm font-medium">"{thread.name.replace("Fork: ", "").replace("...", "")}"</p>
              <p className="text-xs text-muted-foreground mt-1">
                This thread continues the conversation from the selected message
              </p>
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              {thread.isMainThread ? (
                <GettingStartedGuide />
              ) : (
                <div className="space-y-4">
                  <div className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Continue the conversation</h3>
                  <p className="text-muted-foreground max-w-md mx-auto text-sm">
                    This is a forked thread. Continue the conversation from where you left off.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Messages with Discord-style Forks */}
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              showAvatar={index === 0 || messages[index - 1]?.role !== message.role}
              currentThreadId={thread.id}
              onThreadSelect={onThreadSelect}
            />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 sm:p-4 rounded-lg max-w-[80%] border">
                <div className="flex items-center space-x-3">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div
            ref={(el) => {
              messagesEndRefs.current[activeTabId] = el
            }}
          />
        </div>
      </div>
    </>
  )
} 