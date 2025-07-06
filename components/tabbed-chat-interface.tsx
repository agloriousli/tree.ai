"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThreads } from "@/components/thread-provider"
import { MessageBubble } from "@/components/message-bubble"
import { generateResponse } from "@/lib/ai"
import { MessageInput } from "@/components/message-input"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { GettingStartedGuide } from "@/components/getting-started-guide"
import { ThreadContextManager } from "@/components/thread-context-manager"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Tab {
  id: string
  threadId: string
  title: string
  scrollPosition: number
}

interface TabbedChatInterfaceProps {
  selectedThreadId: string
  showContextPanel: boolean
  onToggleContext: () => void
}

export function TabbedChatInterface({ selectedThreadId, showContextPanel, onToggleContext }: TabbedChatInterfaceProps) {
  const { threads, addMessage, getThreadContext } = useThreads()
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "tab-1",
      threadId: "main",
      title: threads["main"]?.name || "Main Thread",
      scrollPosition: 0,
    },
  ])
  const [activeTabId, setActiveTabId] = useState("tab-1")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const activeThreadId = activeTab?.threadId || "main"
  const currentThread = threads[activeThreadId]
  const messages = currentThread?.messages || []

  // Watch for selectedThreadId changes from sidebar
  useEffect(() => {
    if (selectedThreadId && selectedThreadId !== activeThreadId) {
      console.log(`TabbedInterface: Opening thread ${selectedThreadId} in new tab`)
      openThreadInNewTab(selectedThreadId)
    }
  }, [selectedThreadId, activeThreadId])

  // Update tab title when thread name changes
  useEffect(() => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        title: threads[tab.threadId]?.name || tab.title,
      })),
    )
  }, [threads])

  // Scroll to bottom when messages change
  useEffect(() => {
    const messagesEndRef = messagesEndRefs.current[activeTabId]
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeTabId])

  // Save scroll position when switching tabs
  const saveScrollPosition = (tabId: string) => {
    const container = scrollContainerRefs.current[tabId]
    if (container) {
      setTabs((prevTabs) =>
        prevTabs.map((tab) => (tab.id === tabId ? { ...tab, scrollPosition: container.scrollTop } : tab)),
      )
    }
  }

  // Restore scroll position when switching to a tab
  const restoreScrollPosition = (tabId: string) => {
    const container = scrollContainerRefs.current[tabId]
    const tab = tabs.find((t) => t.id === tabId)
    if (container && tab) {
      setTimeout(() => {
        container.scrollTop = tab.scrollPosition
      }, 0)
    }
  }

  const openThreadInNewTab = (threadId: string) => {
    const thread = threads[threadId]
    if (!thread) {
      console.error(`Thread ${threadId} not found`)
      return
    }

    console.log(`Opening thread ${threadId} in new tab, current tabs:`, tabs.length)

    // Check if thread is already open in a tab
    const existingTab = tabs.find((tab) => tab.threadId === threadId)
    if (existingTab) {
      console.log(`Switching to existing tab for thread ${threadId}`)
      setActiveTabId(existingTab.id)
      return
    }

    // Create new tab
    const newTabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTab: Tab = {
      id: newTabId,
      threadId,
      title: thread.name,
      scrollPosition: 0,
    }

    console.log(`Creating new tab ${newTabId} for thread ${threadId}`)
    setTabs((prevTabs) => {
      const newTabs = [...prevTabs, newTab]
      console.log(`Total tabs after creation:`, newTabs.length)
      return newTabs
    })
    setActiveTabId(newTabId)
  }

  const closeTab = (tabId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    console.log(`Attempting to close tab ${tabId}, total tabs: ${tabs.length}`)

    if (tabs.length === 1) {
      console.log("Cannot close last tab")
      return // Don't close the last tab
    }

    const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
    const newTabs = tabs.filter((tab) => tab.id !== tabId)

    console.log(`Closing tab at index ${tabIndex}, remaining tabs:`, newTabs.length)

    // If closing active tab, switch to adjacent tab
    if (tabId === activeTabId) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1)
      const newActiveTab = newTabs[newActiveIndex]
      console.log(`Switching to tab ${newActiveTab.id} at index ${newActiveIndex}`)
      setActiveTabId(newActiveTab.id)
    }

    setTabs(newTabs)
  }

  const switchTab = (tabId: string) => {
    if (tabId === activeTabId) return

    console.log(`Switching to tab ${tabId}`)

    // Save current tab's scroll position
    saveScrollPosition(activeTabId)

    // Switch to new tab
    setActiveTabId(tabId)

    // Restore scroll position after a brief delay
    setTimeout(() => restoreScrollPosition(tabId), 100)
  }

  const handleSend = async (userMessage: string) => {
    setIsLoading(true)

    // Add user message
    addMessage(activeThreadId, userMessage, "user")

    try {
      // Get context for this thread
      const contextMessages = getThreadContext(activeThreadId)

      // Generate AI response
      const response = await generateResponse(contextMessages)

      // Add AI response
      addMessage(activeThreadId, response, "assistant")
    } catch (error) {
      console.error("Error generating response:", error)
      addMessage(activeThreadId, "Sorry, I encountered an error generating a response.", "assistant")
    } finally {
      setIsLoading(false)
    }
  }

  const handleThreadSelect = (threadId: string) => {
    console.log(`TabbedInterface: handleThreadSelect called with ${threadId}`)
    openThreadInNewTab(threadId)
  }

  if (!currentThread) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Thread not found</p>
          <p className="text-sm text-muted-foreground mt-2">The selected thread may have been deleted or moved.</p>
          <Button onClick={() => openThreadInNewTab("main")} className="mt-4">
            Go to Main Thread
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex min-w-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar */}
        <div className="border-b bg-background flex items-center overflow-x-auto">
          <ScrollArea orientation="horizontal" className="flex-1">
            <div className="flex items-center min-w-max">
              {tabs.map((tab) => (
                <div key={tab.id} className="flex items-center border-r">
                  <Button
                    variant={tab.id === activeTabId ? "secondary" : "ghost"}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      switchTab(tab.id)
                    }}
                    className="rounded-none h-12 px-4 justify-start min-w-[120px] max-w-[200px]"
                  >
                    <span className="truncate">{tab.title}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log(`Close button clicked for tab ${tab.id}`)
                      closeTab(tab.id, e)
                    }}
                    className="h-12 w-8 p-0 rounded-none border-l hover:bg-destructive/10 hover:text-destructive"
                    title="Close tab"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("Creating new tab for main thread")
                  openThreadInNewTab("main")
                }}
                className="h-12 w-10 p-0 rounded-none"
                title="Open new tab"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Breadcrumbs */}
        <Breadcrumbs threadId={activeThreadId} />

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
        <div
          className="flex-1 overflow-y-auto"
          ref={(el) => {
            scrollContainerRefs.current[activeTabId] = el
          }}
        >
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
                currentThreadId={activeThreadId}
                onThreadSelect={handleThreadSelect}
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
          <ThreadContextManager threadId={activeThreadId} onClose={onToggleContext} />
        </div>
      )}
    </div>
  )
}
