"use client"
import { useState, useRef, useEffect } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThreads } from "@/components/thread-provider"
import { MessageBubble } from "@/components/message-bubble"
import { generateResponse } from "@/lib/ai"
import { MessageInput } from "@/components/message-input"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { GettingStartedGuide } from "@/components/getting-started-guide"
import { ThreadContextManager } from "@/components/thread-context-manager"

interface ChatInterfaceProps {
  threadId: string
  showContextPanel: boolean
  onToggleContext: () => void
  onThreadSelect: (threadId: string) => void
}

export function ChatInterface({ threadId, showContextPanel, onToggleContext, onThreadSelect }: ChatInterfaceProps) {
  const { threads, addMessage, getThreadContext } = useThreads()
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentThread = threads[threadId]
  const messages = currentThread?.messages || []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (userMessage: string) => {
    setIsLoading(true)

    // Add user message
    addMessage(threadId, userMessage, "user")

    try {
      // Get context for this thread
      const contextMessages = getThreadContext(threadId)

      // Generate AI response
      const response = await generateResponse(contextMessages)

      // Add AI response
      addMessage(threadId, response, "assistant")
    } catch (error) {
      console.error("Error generating response:", error)
      addMessage(threadId, "Sorry, I encountered an error generating a response.", "assistant")
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentThread) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Thread not found</p>
          <p className="text-sm text-muted-foreground mt-2">The selected thread may have been deleted or moved.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex min-w-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Breadcrumbs */}
        <Breadcrumbs threadId={threadId} />

        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold truncate">{currentThread.name}</h1>
              {currentThread.isMainThread && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Main</span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              <span>{messages.filter((m) => m.role === "user").length} user messages</span>
              {currentThread.contextThreadIds.length > 0 && (
                <span>• Context from {currentThread.contextThreadIds.length} thread(s)</span>
              )}
              {currentThread.parentThreadId && (
                <span
                  className="truncate max-w-[200px]"
                  title={`Forked from ${threads[currentThread.parentThreadId]?.name}`}
                >
                  • Forked from {threads[currentThread.parentThreadId]?.name}
                </span>
              )}
            </div>
          </div>
          <Button
            variant={showContextPanel ? "default" : "outline"}
            size="sm"
            onClick={onToggleContext}
            className="ml-4 flex-shrink-0"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Context</span>
          </Button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            {/* Thread Description */}
            {currentThread.description && (
              <div className="bg-muted/30 p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">{currentThread.description}</p>
              </div>
            )}

            {/* Fork Origin Indicator */}
            {currentThread.rootMessageId && (
              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                <p className="text-sm text-muted-foreground mb-1">🍴 Forked from message:</p>
                <p className="text-sm font-medium">"{currentThread.name.replace("Fork: ", "").replace("...", "")}"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This thread continues the conversation from the selected message
                </p>
              </div>
            )}

            {/* Empty State */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                {currentThread.isMainThread ? (
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
                currentThreadId={threadId}
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

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput
            onSend={handleSend}
            isLoading={isLoading}
            placeholder={`Message ${currentThread.name}...`}
            contextInfo={
              currentThread.contextThreadIds.length > 0
                ? `Using context from ${currentThread.contextThreadIds.length} additional thread(s)`
                : undefined
            }
          />
        </div>
      </div>

      {/* Right Sidebar - Thread Context Manager */}
      {showContextPanel && (
        <div className="flex-shrink-0 max-w-[28rem] min-w-[20rem]">
          <ThreadContextManager threadId={threadId} onClose={onToggleContext} />
        </div>
      )}
    </div>
  )
}
