"use client"

import type React from "react"
import { useThreadCreation } from "@/components/hooks/use-thread-creation";
import { useState, useEffect, useRef } from "react"
import { useThreads } from "@/components/thread-provider"
import { MessageInput } from "@/components/message-input"
import { GettingStartedGuide } from "@/components/getting-started-guide"
import { ContextualSelectionMenu } from "@/components/contextual-selection-menu"
import { TabManager } from "@/components/tab-manager"
import { MessageContainer } from "@/components/message-container"
import { CreateThreadDialog } from "@/components/dialogs/create-thread-dialog"
import { EditThreadDialog } from "@/components/dialogs/edit-thread-dialog"
import { useTabManager } from "@/components/hooks/use-tab-manager"
import { useMessageHandler } from "@/components/hooks/use-message-handler"
import { useCommandHandler } from "@/components/hooks/use-command-handler"
import { useThreadOperations } from "@/components/hooks/use-thread-operations"
import { Button } from "./ui/button"

interface TabbedChatInterfaceProps {
  selectedThreadId: string
  showSettingsPanel: boolean
  onToggleSettings: () => void
  onActiveThreadChange?: (threadId: string) => void
}

export function TabbedChatInterface({ selectedThreadId, showSettingsPanel, onToggleSettings, onActiveThreadChange }: TabbedChatInterfaceProps) {
  const { threads, addMessage, editMessage, getThreadContext, updateThread, showThinkingMode, temperature, maxTokens } = useThreads()
  const [isNearBottom, setIsNearBottom] = useState(true)
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Custom hooks
  const tabManager = useTabManager()
  const messageHandler = useMessageHandler(addMessage, editMessage, getThreadContext, showThinkingMode, temperature, maxTokens)
  const commandHandler = useCommandHandler(addMessage, editMessage, getThreadContext, tabManager.openThreadInNewTab, showThinkingMode, temperature, maxTokens)
  const threadOperations = useThreadOperations(updateThread)

  const activeThreadId = tabManager.curTab || ""
  const currentThread = threads[activeThreadId]
  const messages = currentThread?.messages || []

  // Watch for selectedThreadId changes from sidebar
  useEffect(() => {
    if (selectedThreadId && selectedThreadId !== activeThreadId && !threadOperations.pendingNewThreadId && !tabManager.isClosingTab) {
      // Check if thread exists before trying to open it
      if (threads[selectedThreadId]) {
      console.log(`TabbedInterface: Opening thread ${selectedThreadId} in new tab`)
        tabManager.openThreadInNewTab(selectedThreadId)
      }
    }
  }, [selectedThreadId, activeThreadId, threadOperations.pendingNewThreadId, tabManager.isClosingTab, threads, tabManager])

  // Watch for pending new thread to be created
  useEffect(() => {
    if (threadOperations.pendingNewThreadId && threads[threadOperations.pendingNewThreadId]) {
      console.log(`Pending thread ${threadOperations.pendingNewThreadId} is now available, opening in new tab`)
      tabManager.openThreadInNewTab(threadOperations.pendingNewThreadId)
      threadOperations.resetPendingThread()
    }
  }, [threadOperations.pendingNewThreadId, threads, tabManager, threadOperations])

  // Clear tabs when all threads are deleted
  useEffect(() => {
    if (Object.keys(threads).length === 0 && tabManager.tabs.length > 0) {
      tabManager.clearTabs()
    }
  }, [threads, tabManager])

  // Only notify parent when user manually switches tabs (not during programmatic operations)
  const notifyParentOfActiveThreadChange = (threadId: string) => {
    if (onActiveThreadChange && threadId !== selectedThreadId) {
      onActiveThreadChange(threadId)
    }
  }

  // Force scroll to bottom
  const scrollToBottom = () => {
    const messagesEndRef = messagesEndRefs.current[activeThreadId]
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Handle message sending
  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim()) return
    
    // Force scroll to bottom when user sends a message
    scrollToBottom()
    await messageHandler.handleSend(userMessage, activeThreadId)
  }

  const handleThreadSelect = (threadId: string) => {
    console.log(`TabbedInterface: handleThreadSelect called with ${threadId}`)
    const thread = threads[threadId]
    if (thread) {
      tabManager.openThreadInNewTab(threadId)
    }
  }

  const handleTabSwitch = (threadId: string) => {
    // Notify parent of the active thread change
    notifyParentOfActiveThreadChange(threadId)
    tabManager.switchTab(threadId)
  }

  const handleTabClose = (threadId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Notify parent of the new active thread to sync sidebar
    notifyParentOfActiveThreadChange(threadId)

    tabManager.closeTab(threadId)
  }

  const handleEditThread = () => {
    if (!currentThread) return
    threadOperations.handleEditThread(activeThreadId, currentThread)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = container
    const threshold = 100 // pixels from bottom
    const isNearBottomNow = scrollHeight - scrollTop - clientHeight < threshold
    setIsNearBottom(isNearBottomNow)
  }

  const { createThread } = useThreadCreation();

  // Show "no threads" message when user has deleted all threads
  if (tabManager.tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">No threads open</p>
          <p className="text-sm text-muted-foreground mt-2">
            Select a thread from the sidebar or create a new thread to get started.
          </p>
          <Button
            onClick={() => {
              const newThreadId = createThread({ type: "main", name: "Untitled Thread" });
              if (newThreadId) {
                tabManager.openThreadInNewTab(newThreadId);
              }
            }}
            className="mt-4"
          >
            Create New Thread
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex min-w-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Tab Bar */}
        <TabManager
          tabs={tabManager.tabs}
          curTab={tabManager.curTab}
          threads={threads}
          onTabSwitch={handleTabSwitch}
          onTabClose={handleTabClose}
          onCreateTab={() => {
            const newThreadId = threadOperations.createThread({ type: "main", name: "Untitled Thread" });
            if (newThreadId) {
              tabManager.openThreadInNewTab(newThreadId);
            }
          }}
        />

        {/* Contextual Selection Menu */}
        <ContextualSelectionMenu 
          onThreadSelect={(threadId, options) => {
            if (options?.pending) {
              threadOperations.setPendingNewThreadId(threadId)
            } else {
              handleThreadSelect(threadId)
            }
          }}
          onCommandExecute={async (command, selectedText) => {
            await commandHandler.handleCommandExecute(command, selectedText, activeThreadId)
          }}
        />

        {/* Message Container */}
        <MessageContainer
          messages={messages}
          thread={currentThread}
          isLoading={messageHandler.isLoading}
          activeTabId={activeThreadId}
          scrollContainerRefs={tabManager.scrollContainerRefs}
          messagesEndRefs={messagesEndRefs}
          isNearBottom={isNearBottom}
          onScroll={handleScroll}
          onThreadSelect={handleThreadSelect}
          onEditThread={handleEditThread}
          onToggleSettings={onToggleSettings}
          showSettingsPanel={showSettingsPanel}
        />

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput
            onSend={handleSend}
            isLoading={messageHandler.isLoading}
            placeholder={`Message ${currentThread?.name || 'thread'}...`}
            contextInfo={
              currentThread?.contextThreadIds.length > 0
                ? `Using context from ${currentThread.contextThreadIds.length} additional thread(s)`
                : undefined
            }
          />
        </div>
      </div>

      {/* Dialogs */}
      <CreateThreadDialog
        open={threadOperations.showNewThreadDialog}
        onOpenChange={threadOperations.setShowNewThreadDialog}
        threadName={threadOperations.newThreadName}
        threadDescription={threadOperations.newThreadDescription}
        threadType={threadOperations.newThreadType}
        parentThreadId={threadOperations.parentThreadId}
        availableThreads={Object.values(threads)}
        onThreadNameChange={threadOperations.setNewThreadName}
        onThreadDescriptionChange={threadOperations.setNewThreadDescription}
        onThreadTypeChange={threadOperations.setNewThreadType}
        onParentThreadChange={threadOperations.setParentThreadId}
        onSubmit={threadOperations.handleSubmitCreateThreadForm}
      />

      <EditThreadDialog
        open={threadOperations.showEditThreadDialog}
        onOpenChange={threadOperations.setShowEditThreadDialog}
        threadName={threadOperations.editThreadName}
        threadDescription={threadOperations.editThreadDescription}
        onThreadNameChange={threadOperations.setEditThreadName}
        onThreadDescriptionChange={threadOperations.setEditThreadDescription}
        onSubmit={() => handleEditThread()}
      />
    </div>
  )
}
