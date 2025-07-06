"use client"

import { Settings, X, MessageSquare, Hash, Eye, Search, ChevronRight, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useThreads, type Message, type Thread } from "@/components/thread-provider"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ThreadContextManagerProps {
  threadId: string
  onClose: () => void
}



export function ThreadContextManager({ threadId, onClose }: ThreadContextManagerProps) {
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
  } = useThreads()


  const [showPreview, setShowPreview] = useState(false)
  const [messageSearch, setMessageSearch] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)

  const currentThread = threads[threadId]
  const hierarchy = getThreadHierarchy(threadId)
  const contextMessages = getThreadContext(threadId)
  const allMessages = getAllMessages()
  const mainThreads = getMainThreads()

  // Get the root thread for "All Threads" mode
  const getRootThread = (thread: any): any => {
    if (!thread.parentThreadId) return thread
    return getRootThread(threads[thread.parentThreadId])
  }

  const rootThread = getRootThread(currentThread)

  // Get all threads under the same root
  const getAllThreadsUnderRoot = (rootId: string): string[] => {
    const result: string[] = [rootId]
    const addChildren = (parentId: string) => {
      Object.values(threads).forEach((thread) => {
        if (thread.parentThreadId === parentId) {
          result.push(thread.id)
          addChildren(thread.id)
        }
      })
    }
    addChildren(rootId)
    return result.filter((id) => id !== threadId) // Exclude current thread
  }

  // Get available threads (excluding current thread and its hierarchy)
  const availableThreads = Object.values(threads).filter(
    (thread) => thread.id !== threadId && !hierarchy.some((h) => h.id === thread.id),
  )

  // Get child threads for hierarchy display
  const getChildThreads = (parentId: string) => {
    return Object.values(threads).filter((thread) => thread.parentThreadId === parentId)
  }

  // Toggle item expansion (threads or messages)
  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Helper functions for message/thread state
  const isMessageInContext = (messageId: string) => contextMessages.some((msg) => msg.id === messageId)
  const isMessageExcluded = (messageId: string) => currentThread?.excludedMessageIds.includes(messageId) || false
  const isMessageExplicitlyIncluded = (messageId: string) =>
    currentThread?.contextMessageIds.includes(messageId) || false
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

  // Get selection state for a thread (all, some, none)
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

  // Handle thread-level selection (select/deselect all messages in thread)
  const handleThreadSelection = (thread: Thread, selected: boolean) => {
    const threadMessages = thread.messages.filter(
      (msg: Message) => !messageSearch || msg.content.toLowerCase().includes(messageSearch.toLowerCase()),
    )

    if (selected) {
      // Add thread to context
      if (availableThreads.some((t) => t.id === thread.id)) {
        addContextThread(threadId, thread.id)
      }

      // Add all messages in thread
      threadMessages.forEach((msg: Message) => {
        if (!isMessageInContext(msg.id)) {
          addContextMessage(threadId, msg.id)
        }
      })
    } else {
      // Remove thread from context
      removeContextThread(threadId, thread.id)

      // Remove all messages in thread
      threadMessages.forEach((msg: Message) => {
        if (isMessageExplicitlyIncluded(msg.id)) {
          removeContextMessage(threadId, msg.id)
        } else if (isMessageInContext(msg.id)) {
          excludeMessageFromThread(threadId, msg.id)
        }
      })
    }
  }

  // Handle individual message selection
  const handleMessageSelection = (messageId: string, selected: boolean) => {
    if (selected) {
      if (isMessageExcluded(messageId)) {
        includeMessageInThread(threadId, messageId)
      } else if (!isMessageInContext(messageId)) {
        addContextMessage(threadId, messageId)
      }
    } else {
      if (isMessageExplicitlyIncluded(messageId)) {
        removeContextMessage(threadId, messageId)
      } else if (isMessageInContext(messageId)) {
        excludeMessageFromThread(threadId, messageId)
      }
    }
  }

  // Check if all available threads are selected
  const areAllThreadsSelected = () => {
    return availableThreads.every((thread) => 
      currentThread.contextThreadIds.includes(thread.id) &&
      thread.messages.every((msg) => isMessageInContext(msg.id))
    )
  }

  // Toggle all threads selection
  const toggleAllThreads = () => {
    const allSelected = areAllThreadsSelected()
    
    if (allSelected) {
      // Unselect all threads and their messages
      availableThreads.forEach((thread) => {
        removeContextThread(threadId, thread.id)
        thread.messages.forEach((msg) => {
          if (isMessageExplicitlyIncluded(msg.id)) {
            removeContextMessage(threadId, msg.id)
          } else if (isMessageInContext(msg.id)) {
            excludeMessageFromThread(threadId, msg.id)
          }
        })
      })
    } else {
      // Select all available threads and their messages
      availableThreads.forEach((thread) => {
        addContextThread(threadId, thread.id)
        thread.messages.forEach((msg) => {
          if (!isMessageInContext(msg.id)) {
            addContextMessage(threadId, msg.id)
          }
        })
      })
    }
  }

  // Render unified thread and message hierarchy
  const renderUnifiedHierarchy = (thread: Thread, level = 0) => {
    const childThreads = getChildThreads(thread.id)
    const isExpanded = expandedItems.has(thread.id)
    const isAvailable = availableThreads.some((t) => t.id === thread.id)
    const threadSelectionState = getThreadSelectionState(thread)

    // Filter messages based on search
    const threadMessages = thread.messages.filter(
      (msg: Message) => !messageSearch || msg.content.toLowerCase().includes(messageSearch.toLowerCase()),
    )

    // Filter for selected only view
    if (showSelectedOnly) {
      const hasSelectedMessages = threadMessages.some((msg: Message) => isMessageInContext(msg.id))
      const hasSelectedChildren = childThreads.some((child: Thread) => child.messages.some((msg: Message) => isMessageInContext(msg.id)))
      if (!hasSelectedMessages && !hasSelectedChildren && threadSelectionState === "none") {
        return null
      }
    }

    return (
      <div key={thread.id} className="w-full">
        {/* Thread Header */}
        <div className="flex items-center space-x-2 py-1">
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => toggleItemExpansion(thread.id)}>
            <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          </Button>

          {isAvailable && (
            <div className="flex items-center">
              {threadSelectionState === "all" && (
                <Checkbox
                  checked={true}
                  onCheckedChange={(checked) => handleThreadSelection(thread, !!checked)}
                  className="flex-shrink-0"
                />
              )}
              {threadSelectionState === "some" && (
                <div className="w-4 h-4 border border-primary bg-primary/20 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Minus className="h-2 w-2 text-primary" />
                </div>
              )}
              {threadSelectionState === "none" && (
                <Checkbox
                  checked={false}
                  onCheckedChange={(checked) => handleThreadSelection(thread, !!checked)}
                  className="flex-shrink-0"
                />
              )}
            </div>
          )}

          <div
            className={`flex items-center space-x-2 flex-1 min-w-0 ${level > 0 ? `ml-${Math.min(level * 2, 8)}` : ""} ${!isAvailable ? "opacity-50" : ""}`}
          >
            {thread.isMainThread ? (
              <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" title={thread.name}>
                {thread.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {threadMessages.length} messages
                {!isAvailable && " • Not available"}
                {threadSelectionState === "all" && " • All selected"}
                {threadSelectionState === "some" && " • Partially selected"}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {threadSelectionState !== "none" && (
                <Badge variant={threadSelectionState === "all" ? "default" : "secondary"} className="text-xs">
                  {threadSelectionState === "all" ? "All" : "Some"}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {threadMessages.length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Expanded Content: Child Threads and Messages */}
        {isExpanded && (
          <div className="ml-6 border-l border-border pl-2 space-y-1">
            {/* Child threads (subthreads) - displayed first */}
            {childThreads.length > 0 && (
              <div className="space-y-1">
                {childThreads.map((childThread) => renderUnifiedHierarchy(childThread, level + 1))}
              </div>
            )}

            {/* Messages in this thread - displayed after subthreads */}
            {threadMessages.length > 0 && (
              <div className="space-y-1">
                {threadMessages.map((msg) => {
                  const { status, color } = getMessageStatus(msg.id)
                  const isSelected = isMessageInContext(msg.id)

                  if (showSelectedOnly && !isSelected) return null

                  return (
                    <div key={msg.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleMessageSelection(msg.id, !!checked)}
                        className="flex-shrink-0"
                      />
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Badge variant={msg.role === "user" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                          {msg.role}
                        </Badge>
                        <Badge variant={color as any} className="text-xs flex-shrink-0">
                          {status}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate" title={msg.content}>
                            {msg.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }



  if (!currentThread) return null

  return (
    <div className="w-[28rem] border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <Settings className="h-4 w-4 flex-shrink-0" />
          <h3 className="font-semibold truncate">Thread Context</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">


          {/* Current Thread */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Current Thread
                <Badge variant="default">{currentThread.messages.filter((m) => m.role === "user").length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2 min-w-0">
                {currentThread.isMainThread ? (
                  <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm font-medium truncate max-w-[200px]" title={currentThread.name}>
                  {currentThread.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Always included in context</p>
            </CardContent>
          </Card>

          {/* Inherited Context (Hierarchy) */}
          {hierarchy.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Inherited Context
                  <Badge variant="outline">Auto</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-muted-foreground">Context automatically inherited from parent threads:</p>
                {hierarchy.slice(0, -1).map((thread, index) => (
                  <div key={thread.id} className="flex items-center space-x-2 p-2 bg-muted/30 rounded min-w-0">
                    {thread.isMainThread ? (
                      <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate max-w-[180px]" title={thread.name}>
                        {thread.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level {thread.level} • {thread.messages.filter((m) => m.role === "user").length} user messages
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {thread.messages.filter((m) => m.role === "user").length}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Unified Thread & Message Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Unified Thread & Message Selection
                  <div className="flex items-center space-x-2">
                    <Switch checked={showSelectedOnly} onCheckedChange={setShowSelectedOnly} />
                    <span className="text-xs text-muted-foreground">Selected only</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <p>• Click thread checkbox to select/deselect all messages in that thread</p>
                  <p>• Click individual message checkboxes for granular control</p>
                  <p>• Partial selection (—) indicates some messages are selected</p>
                </div>

                <div className="border rounded-lg p-3 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b">
                    <span className="text-sm font-medium">Threads & Messages</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllThreads}
                    >
                      {areAllThreadsSelected() ? "Unselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="space-y-1">{mainThreads.map((mainThread) => renderUnifiedHierarchy(mainThread))}</div>
                </div>
              </CardContent>
            </Card>

          {/* Context Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Context Summary
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>LLM Context Preview for "{currentThread.name}"</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {contextMessages.map((msg, index) => (
                          <div key={index} className="p-3 bg-muted rounded text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant={msg.role === "user" ? "default" : "secondary"}>{msg.role}</Badge>
                                <span className="text-xs text-muted-foreground">{msg.timestamp.toLocaleString()}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Thread: {threads[msg.threadId]?.name}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">

                <div className="flex justify-between">
                  <span>Total messages in context:</span>
                  <span>{contextMessages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>User messages in context:</span>
                  <span>{contextMessages.filter((m) => m.role === "user").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected threads:</span>
                  <span>
                    {currentThread.contextThreadIds.filter((id) => !hierarchy.some((h) => h.id === id)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Selected messages:</span>
                  <span>{currentThread.contextMessageIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Excluded messages:</span>
                  <span>{currentThread.excludedMessageIds.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
