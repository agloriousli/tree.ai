"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { generateId } from "@/lib/utils"
import { X, Plus, Settings, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThreads } from "@/components/thread-provider"
import { MessageBubble } from "@/components/message-bubble"
import { generateResponse } from "@/lib/ai"
import { MessageInput } from "@/components/message-input"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { GettingStartedGuide } from "@/components/getting-started-guide"
import { ThreadContextManager } from "@/components/thread-context-manager"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  onActiveThreadChange?: (threadId: string) => void
}

export function TabbedChatInterface({ selectedThreadId, showContextPanel, onToggleContext, onActiveThreadChange }: TabbedChatInterfaceProps) {
  const { threads, addMessage, editMessage, getThreadContext, createThread, createMainThread, updateThread, showThinkingMode } = useThreads()
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false)
  const [newThreadName, setNewThreadName] = useState("Untitled Thread")
  const [newThreadDescription, setNewThreadDescription] = useState("")
  const [newThreadType, setNewThreadType] = useState<"main" | "sub">("main")
  const [parentThreadId, setParentThreadId] = useState("")
  const [pendingNewThreadId, setPendingNewThreadId] = useState<string | null>(null)
  const [isClosingTab, setIsClosingTab] = useState(false)
  const [showEditThreadDialog, setShowEditThreadDialog] = useState(false)
  const [editThreadName, setEditThreadName] = useState("")
  const [editThreadDescription, setEditThreadDescription] = useState("")
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const activeThreadId = activeTab?.threadId || "main"
  const currentThread = threads[activeThreadId]
  const messages = currentThread?.messages || []

  // Watch for selectedThreadId changes from sidebar
  useEffect(() => {
    if (selectedThreadId && selectedThreadId !== activeThreadId && !pendingNewThreadId && !isClosingTab) {
      // Check if thread exists before trying to open it
      if (threads[selectedThreadId]) {
        console.log(`TabbedInterface: Opening thread ${selectedThreadId} in new tab`)
        openThreadInNewTab(selectedThreadId)
      }
    }
  }, [selectedThreadId, activeThreadId, pendingNewThreadId, isClosingTab]) // Remove threads from here

  // Auto-open the first available thread when no tabs are open
  useEffect(() => {
    if (tabs.length === 0 && Object.keys(threads).length > 0) {
      const firstThreadId = Object.keys(threads)[0]
      if (firstThreadId) {
        console.log(`Auto-opening first thread: ${firstThreadId}`)
        openThreadInNewTab(firstThreadId)
      }
    }
  }, [tabs.length, threads])

  // Watch for pending new thread to be created
  useEffect(() => {
    if (pendingNewThreadId && threads[pendingNewThreadId]) {
      console.log(`Pending thread ${pendingNewThreadId} is now available, opening in new tab`)
      openThreadInNewTab(pendingNewThreadId)
      setPendingNewThreadId(null)
    }
  }, [pendingNewThreadId, threads])

  // Only notify parent when user manually switches tabs (not during programmatic operations)
  const notifyParentOfActiveThreadChange = (threadId: string) => {
    if (onActiveThreadChange && threadId !== selectedThreadId) {
      onActiveThreadChange(threadId)
    }
  }

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
    const newTabId = generateId('tab')
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
    console.log(`Tabs before closing:`, tabs.map(t => ({ id: t.id, title: t.title, isActive: t.id === activeTabId })))

    // Set flag to prevent sidebar interference
    setIsClosingTab(true)

    const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
    if (tabIndex === -1) {
      console.log(`Tab ${tabId} not found`)
      setIsClosingTab(false)
      return
    }

    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    console.log(`Closing tab at index ${tabIndex}, remaining tabs:`, newTabs.length)
    console.log(`New tabs after closing:`, newTabs.map(t => ({ id: t.id, title: t.title })))

    // If closing active tab and there are remaining tabs, switch to adjacent tab
    if (tabId === activeTabId && newTabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1)
      const newActiveTab = newTabs[newActiveIndex]
      console.log(`Switching to tab ${newActiveTab.id} at index ${newActiveIndex}`)
      setActiveTabId(newActiveTab.id)
      // Notify parent of the new active thread to sync sidebar
      notifyParentOfActiveThreadChange(newActiveTab.threadId)
    } else if (tabId === activeTabId && newTabs.length === 0) {
      // No tabs left, clear active tab
      setActiveTabId("")
    }

    console.log(`Setting new tabs state...`)
    setTabs(newTabs)
    console.log(`Tab close operation completed`)
    
    // Reset flag after a longer delay to ensure all state updates complete
    setTimeout(() => setIsClosingTab(false), 200)
  }

  const switchTab = (tabId: string) => {
    if (tabId === activeTabId) return

    console.log(`Switching to tab ${tabId}`)

    // Save current tab's scroll position
    saveScrollPosition(activeTabId)

    // Get the thread ID for the new tab
    const newTab = tabs.find(tab => tab.id === tabId)
    if (newTab) {
      // Notify parent of the active thread change
      notifyParentOfActiveThreadChange(newTab.threadId)
    }

    // Switch to new tab
    setActiveTabId(tabId)

    // Restore scroll position after a brief delay
    setTimeout(() => restoreScrollPosition(tabId), 100)
  }

  const handleSend = async (userMessage: string) => {
    setIsLoading(true)

    try {
      // Add user message first
      const userMessageId = addMessage(activeThreadId, userMessage, "user")

      // Get existing context for this thread
      const existingContextMessages = getThreadContext(activeThreadId)
      
      // Create the user message object to include in context
      const userMessageObj = {
        role: "user" as const,
        content: userMessage,
      }
      
      // Convert existing context to simple format and combine with new user message
      const contextMessages = [
        ...existingContextMessages.map(msg => ({ role: msg.role, content: msg.content })),
        userMessageObj
      ]
      
      // Debug: Log context information
      console.log(`Sending message to thread ${activeThreadId}`)
      console.log(`Context contains ${contextMessages.length} messages`)
      console.log("User message being sent:", userMessage)
      if (contextMessages.length > 0) {
        console.log("Context message roles:", contextMessages.map(m => m.role))
        console.log("Last message content:", contextMessages[contextMessages.length - 1]?.content)
      }

      // Create a temporary message for streaming
      const tempMessageId = addMessage(activeThreadId, "", "assistant")
      let accumulatedContent = ""

      // Generate AI response with streaming
      const response = await generateResponse(contextMessages, (chunk) => {
        // Accumulate chunks and update the message
        accumulatedContent += chunk
        editMessage(tempMessageId, accumulatedContent)
      }, showThinkingMode)

      // The message is already updated via streaming, so we don't need to add it again
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

  const handleCreateNewThread = () => {
    // Use "Untitled Thread" as default name if empty
    const threadName = newThreadName.trim() || "Untitled Thread"

    console.log(`Creating new thread: ${threadName}, type: ${newThreadType}`)

    let newThreadId: string

    if (newThreadType === "main") {
      newThreadId = createMainThread(threadName, newThreadDescription)
    } else {
      newThreadId = createThread(threadName, parentThreadId, undefined, false)
    }

    console.log(`Created thread with ID: ${newThreadId}`)
    console.log(`Available threads:`, Object.keys(threads))

    // Reset form
    setNewThreadName("")
    setNewThreadDescription("")
    setNewThreadType("main")
    setParentThreadId("")
    setShowNewThreadDialog(false)

    // Set the pending thread ID - the useEffect will handle opening it when available
    setPendingNewThreadId(newThreadId)
  }

  const handleEditThread = () => {
    if (!currentThread) return

    // Update the thread
    updateThread(activeThreadId, {
      name: editThreadName.trim() || currentThread.name,
      description: editThreadDescription.trim() || undefined,
    })

    // Reset form and close dialog
    setEditThreadName("")
    setEditThreadDescription("")
    setShowEditThreadDialog(false)
  }

  const openEditThreadDialog = () => {
    if (!currentThread) return
    
    setEditThreadName(currentThread.name)
    setEditThreadDescription(currentThread.description || "")
    setShowEditThreadDialog(true)
  }

  // Show "no threads" message when user has deleted all threads
  if (Object.keys(threads).length === 0) {
    return (
      <>
        <div className="flex-1 flex min-w-0">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* No Threads Message */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold mb-4">You have no threads</h2>
                <p className="text-muted-foreground mb-6">
                  Create a new thread to start organizing your conversations. You can create main threads for different topics and subthreads for specific discussions.
                </p>
                <Button 
                  onClick={() => {
                    console.log("Create Thread button clicked!")
                    setNewThreadName("Untitled Thread")
                    setNewThreadDescription("")
                    setNewThreadType("main")
                    setParentThreadId("")
                    setShowNewThreadDialog(true)
                  }}
                  size="lg"
                  className="px-8"
                >
                  Create Thread
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dialog for creating new thread */}
        <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Thread</DialogTitle>
              <DialogDescription>
                Create a new thread to organize your conversations. You can create main threads or subthreads that branch from existing conversations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thread-name">Thread Name (Optional)</Label>
                <Input
                  id="thread-name"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  placeholder="Enter thread name..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thread-type">Thread Type</Label>
                <Select value={newThreadType} onValueChange={(value: "main" | "sub") => setNewThreadType(value)}>
                  <SelectTrigger id="thread-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Thread</SelectItem>
                    <SelectItem value="sub">Subthread</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newThreadType === "sub" && (
                <div className="space-y-2">
                  <Label htmlFor="parent-thread">Parent Thread</Label>
                  <Select value={parentThreadId} onValueChange={setParentThreadId}>
                    <SelectTrigger id="parent-thread">
                      <SelectValue placeholder="Select parent thread..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(threads)
                        .filter((thread) => thread.isMainThread)
                        .map((thread) => (
                          <SelectItem key={thread.id} value={thread.id}>
                            {thread.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="thread-description">Description (Optional)</Label>
                <Textarea
                  id="thread-description"
                  value={newThreadDescription}
                  onChange={(e) => setNewThreadDescription(e.target.value)}
                  placeholder="Describe what this thread will be used for..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewThreadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNewThread} disabled={(newThreadType === "sub" && !parentThreadId)}>
                  Create Thread
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Fallback: if there are threads but no tabs, show a loading state
  if (tabs.length === 0 && Object.keys(threads).length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Loading threads...</p>
          <p className="text-sm text-muted-foreground mt-2">Opening your conversations.</p>
        </div>
      </div>
    )
  }

  if (!currentThread) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Thread not found</p>
          <p className="text-sm text-muted-foreground mt-2">The selected thread may have been deleted or moved.</p>
          <Button 
            onClick={() => {
              setNewThreadName("Untitled Thread")
              setNewThreadDescription("")
              setNewThreadType("main")
              setParentThreadId("")
              setShowNewThreadDialog(true)
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar - Only show when there are tabs */}
        {tabs.length > 0 && (
          <div className="border-b bg-background flex items-center overflow-x-auto">
            <ScrollArea className="flex-1">
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
                        console.log(`Current tabs:`, tabs.map(t => ({ id: t.id, title: t.title })))
                        console.log(`Active tab: ${activeTabId}`)
                        closeTab(tab.id, e)
                      }}
                      className="h-12 w-8 p-0 rounded-none hover:bg-destructive/10 hover:text-destructive z-20"
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
                    setNewThreadName("Untitled Thread")
                    setNewThreadDescription("")
                    setNewThreadType("main")
                    setParentThreadId("")
                    setShowNewThreadDialog(true)
                  }}
                  className="h-12 w-10 p-0 rounded-none"
                  title="Create new thread"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              
              <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Thread</DialogTitle>
                    <DialogDescription>
                      Create a new thread to organize your conversations. You can create main threads or subthreads that branch from existing conversations.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="thread-name">Thread Name (Optional)</Label>
                      <Input
                        id="thread-name"
                        value={newThreadName}
                        onChange={(e) => setNewThreadName(e.target.value)}
                        placeholder="Enter thread name..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="thread-type">Thread Type</Label>
                      <Select value={newThreadType} onValueChange={(value: "main" | "sub") => setNewThreadType(value)}>
                        <SelectTrigger id="thread-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">Main Thread</SelectItem>
                          <SelectItem value="sub">Subthread</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newThreadType === "sub" && (
                      <div className="space-y-2">
                        <Label htmlFor="parent-thread">Parent Thread</Label>
                        <Select value={parentThreadId} onValueChange={setParentThreadId}>
                          <SelectTrigger id="parent-thread">
                            <SelectValue placeholder="Select parent thread..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(threads)
                              .filter((thread) => thread.isMainThread)
                              .map((thread) => (
                                <SelectItem key={thread.id} value={thread.id}>
                                  {thread.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="thread-description">Description (Optional)</Label>
                      <Textarea
                        id="thread-description"
                        value={newThreadDescription}
                        onChange={(e) => setNewThreadDescription(e.target.value)}
                        placeholder="Describe what this thread will be used for..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowNewThreadDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateNewThread} disabled={(newThreadType === "sub" && !parentThreadId)}>
                        Create Thread
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </ScrollArea>
        </div>
        )}

        {/* Edit Thread Dialog */}
        <Dialog open={showEditThreadDialog} onOpenChange={setShowEditThreadDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Thread</DialogTitle>
              <DialogDescription>
                Update the name and description of this thread.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-thread-name">Thread Name</Label>
                <Input
                  id="edit-thread-name"
                  value={editThreadName}
                  onChange={(e) => setEditThreadName(e.target.value)}
                  placeholder="Enter thread name..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-thread-description">Description (Optional)</Label>
                <Textarea
                  id="edit-thread-description"
                  value={editThreadDescription}
                  onChange={(e) => setEditThreadDescription(e.target.value)}
                  placeholder="Describe what this thread is used for..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditThreadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditThread}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Content Area - Only show when there are tabs */}
        {tabs.length > 0 && (
          <>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openEditThreadDialog}
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    title="Edit thread"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
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
          </>
        )}
      </div>

      {/* Right Sidebar - Thread Context Manager */}
      {showContextPanel && (
        <div className="flex-shrink-0">
          <ThreadContextManager threadId={activeThreadId} onClose={onToggleContext} />
        </div>
      )}
    </div>
  )
}
