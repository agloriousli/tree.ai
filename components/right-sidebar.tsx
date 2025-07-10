import { useState, useEffect } from "react"
import { useThreads, type Message, type Thread } from "@/components/thread-provider"
import { useMessageContext } from "@/components/hooks/use-message-context"
import { useThreadHierarchy } from "@/components/hooks/use-thread-hierarchy"
import { ContextTab } from "./settings/ContextTab"
import { ModelTab } from "./settings/ModelTab"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Settings, Sliders, Brain, MessageSquare, X } from "lucide-react"
import { DataManagement } from "@/components/settings/data-management"

interface RightSidebarProps {
  showSettingsPanel: boolean
  selectedThreadId: string
  onToggleSettings: () => void
}

type SettingsTab = "context" | "model" | "data"

export function RightSidebar({ showSettingsPanel, selectedThreadId, onToggleSettings }: RightSidebarProps) {
  const {
    threads,
    addContextThread,
    removeContextThread,
    addContextMessage,
    removeContextMessage,
    excludeMessageFromThread,
    includeMessageInThread,
    getThreadContext,
    getThreadHierarchy,
    getAllMessages,
    getMainThreads,
    showThinkingMode,
    setShowThinkingMode,
    maxContextMessages,
    setMaxContextMessages,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
  } = useThreads()

  const [activeTab, setActiveTab] = useState<SettingsTab>("context")
  const [messageSearch, setMessageSearch] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)

  // Check if we're in global settings mode (no threads exist)
  const isGlobalSettings = !selectedThreadId || selectedThreadId === ""

  // Set default tab to model settings when no threads exist
  useEffect(() => {
    if (isGlobalSettings) {
      setActiveTab("model")
    }
  }, [isGlobalSettings])

  const currentThread = threads[selectedThreadId]
  const hierarchy = isGlobalSettings ? [] : getThreadHierarchy(selectedThreadId)
  const allMessages = getAllMessages()
  const mainThreads = getMainThreads()

  // Use unified message context hook
  const {
    isMessageInContext,
    isMessageExcluded,
    isMessageExplicitlyIncluded,
    contextMessages,
  } = useMessageContext(selectedThreadId)

  const { getRootThread, getAllDescendants, getChildThreads } = useThreadHierarchy()

  const rootThread = currentThread ? getRootThread(currentThread.id) : undefined

  // Get available threads (excluding current thread and its hierarchy)
  const availableThreads = Object.values(threads).filter(
    (thread) => thread.id !== selectedThreadId && !hierarchy.some((h) => h.id === thread.id),
  )

  // Helper function for thread context state
  const isThreadInContext = (threadId: string) => currentThread?.contextThreadIds.includes(threadId) || false

  const getMessageStatus = (messageId: string) => {
    const inContext = isMessageInContext(messageId)
    const excluded = isMessageExcluded(messageId)
    const explicitly = isMessageExplicitlyIncluded(messageId)

    if (excluded) return { status: "excluded", color: "destructive" }
    if (explicitly) return { status: "explicitly included", color: "default" }
    if (inContext) return { status: "inherited", color: "secondary" }
    return { status: "not included", color: "outline" }
  }

  const getThreadSelectionState = (thread: Thread): "all" | "some" | "none" => {
    const threadMessages = thread.messages.filter(
      (msg: Message) => !messageSearch || msg.content.toLowerCase().includes(messageSearch.toLowerCase()),
    )
    if (threadMessages.length === 0) return "none"
    const selectedMessages = threadMessages.filter((msg: Message) => isMessageInContext(msg.id))
    if (selectedMessages.length === 0) return "none"
    if (selectedMessages.length === threadMessages.length) return "all"
    return "some"
  }

  const handleThreadSelection = (thread: Thread, selected: boolean) => {
    const threadMessages = thread.messages.filter(
      (msg: Message) => !messageSearch || msg.content.toLowerCase().includes(messageSearch.toLowerCase()),
    )
    if (selected) {
      if (availableThreads.some((t) => t.id === thread.id)) {
        addContextThread(selectedThreadId, thread.id)
      }
      threadMessages.forEach((msg: Message) => {
        if (!isMessageInContext(msg.id)) {
          addContextMessage(selectedThreadId, msg.id)
        }
      })
    } else {
      removeContextThread(selectedThreadId, thread.id)
      threadMessages.forEach((msg: Message) => {
        if (isMessageExplicitlyIncluded(msg.id)) {
          removeContextMessage(selectedThreadId, msg.id)
        } else if (isMessageInContext(msg.id)) {
          excludeMessageFromThread(selectedThreadId, msg.id)
        }
      })
    }
  }

  const handleMessageSelection = (messageId: string, selected: boolean) => {
    if (selected) {
      addContextMessage(selectedThreadId, messageId)
    } else {
      if (isMessageExplicitlyIncluded(messageId)) {
        removeContextMessage(selectedThreadId, messageId)
      } else if (isMessageInContext(messageId)) {
        excludeMessageFromThread(selectedThreadId, messageId)
      }
    }
  }

  const areAllThreadsSelected = () => {
    return availableThreads.length > 0 && availableThreads.every((thread) => isThreadInContext(thread.id))
  }

  const toggleAllThreads = () => {
    const allSelected = areAllThreadsSelected()
    availableThreads.forEach((thread) => {
      if (allSelected) {
        removeContextThread(selectedThreadId, thread.id)
      } else {
        addContextThread(selectedThreadId, thread.id)
      }
    })
  }

  if (!showSettingsPanel) {
    return (
      <div className="flex-shrink-0 w-12 bg-background border-l flex items-center justify-center">
        <button
          onClick={onToggleSettings}
          className="h-12 w-12 p-0 rotate-90 flex items-center justify-center hover:bg-muted rounded"
          title="Open Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (!currentThread && !isGlobalSettings) {
    return null
  }

  // Remove context tab from tab navigation and tab content
  return (
    <div className="flex-shrink-0 bg-background border-l w-[448px]">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <h2 className="font-semibold">{isGlobalSettings ? "Global Settings" : "Settings"}</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleSettings} 
          className="h-8 w-8 p-0 hover:bg-muted"
          title="Close Settings"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex">
          <Button
            variant={activeTab === "model" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("model")}
            className="flex-1 rounded-none text-xs"
            title="Model Settings"
          >
            <Brain className="h-3 w-3 mr-1" />
            Model
          </Button>
          <Button
            variant={activeTab === "data" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("data")}
            className="flex-1 rounded-none text-xs"
            title="Data Management"
          >
            <Settings className="h-3 w-3 mr-1" />
            Data
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <ScrollArea className="h-[calc(100vh-140px)]">
          {activeTab === "model" ? (
            <ModelTab
              showThinkingMode={showThinkingMode}
              setShowThinkingMode={setShowThinkingMode}
              temperature={temperature}
              setTemperature={setTemperature}
              maxTokens={maxTokens}
              setMaxTokens={setMaxTokens}
              maxContextMessages={maxContextMessages}
              setMaxContextMessages={setMaxContextMessages}
            />
          ) : (
            <DataManagement />
          )}
        </ScrollArea>
      </div>
    </div>
  )
} 