"use client"

import { Settings, X, MessageSquare, Hash, Search, ChevronRight, ChevronDown, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useThreads, type Message, type Thread } from "@/components/thread-provider"
import { useState, useRef, useCallback, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { formatTime } from "@/lib/utils"
import { DataManagement } from "@/components/settings/data-management"
import { useMessageContext } from "@/components/hooks/use-message-context"
import { useThreadHierarchy } from "@/components/hooks/use-thread-hierarchy"

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
    getThreadHierarchy,
    showThinkingMode,
    setShowThinkingMode,
    maxContextMessages,
    setMaxContextMessages,
  } = useThreads()

  const [messageSearch, setMessageSearch] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [width, setWidth] = useState(448) // Default width (w-[28rem] = 448px)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  const currentThread = threads[threadId]
  const hierarchy = getThreadHierarchy(threadId)
  
  // Use unified message context hook
  const { 
    isMessageInContext, 
    isMessageExcluded, 
    isMessageExplicitlyIncluded,
    contextMessages 
  } = useMessageContext(threadId)

  // Helper functions specific to this component
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

  // Handle mouse down for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = window.innerWidth - e.clientX
      // Constrain width between 360px and 600px
      const constrainedWidth = Math.max(360, Math.min(600, newWidth))
      setWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Get available threads (excluding current thread and its hierarchy)
  const availableThreads = Object.values(threads).filter(
    (thread) => thread.id !== threadId && !hierarchy.some((h) => h.id === thread.id),
  )

  // Get child threads for hierarchy display
  const { getChildThreads } = useThreadHierarchy()

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
      // Select all threads and their messages
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

  const renderUnifiedHierarchy = (thread: Thread, level = 0) => {
    const childThreads = getChildThreads(thread.id)
    const hasChildren = childThreads.length > 0
    const hasMessages = thread.messages.length > 0
    const canExpand = hasChildren || hasMessages
    const isExpanded = expandedItems.has(thread.id)
    const selectionState = getThreadSelectionState(thread)
    const threadMessages = thread.messages.filter(
      (msg: Message) => !messageSearch || msg.content.toLowerCase().includes(messageSearch.toLowerCase()),
    )

    // Skip if no messages match search and we're showing selected only
    if (showSelectedOnly && threadMessages.length === 0) return null

    // Skip if no messages are selected and we're showing selected only
    if (showSelectedOnly && selectionState === "none") return null

    return (
      <div key={thread.id} className="space-y-1">
        {/* Thread Row */}
        <div className="flex items-center space-x-2 p-1 rounded hover:bg-muted/50 min-w-0">
                <Checkbox
            checked={selectionState === "all"}
            onCheckedChange={(checked) => handleThreadSelection(thread, checked as boolean)}
                  className="flex-shrink-0"
                />
          
          {canExpand && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent flex-shrink-0"
              onClick={() => toggleItemExpansion(thread.id)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}

          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {thread.isMainThread ? (
              <MessageSquare className="h-3 w-3 text-primary flex-shrink-0" />
            ) : (
              <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-xs font-medium truncate min-w-0 flex-1" title={thread.name}>
                {thread.name}
            </span>
            <Badge variant="outline" className="text-xs flex-shrink-0">
                {threadMessages.length}
              </Badge>
          </div>
        </div>

        {/* Messages */}
        {isExpanded && (
          <div className="ml-6 space-y-1">
            {threadMessages.map((msg: Message) => {
              const messageStatus = getMessageStatus(msg.id)
              const isSelected = isMessageInContext(msg.id)

              return (
                <div key={msg.id} className="flex items-start space-x-2 p-1 rounded hover:bg-muted/30 min-w-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleMessageSelection(msg.id, checked as boolean)}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={messageStatus.color as any} className="text-xs flex-shrink-0">
                        {messageStatus.status}
                    </Badge>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs break-words line-clamp-2" title={msg.content}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Child Threads */}
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-1">
            {childThreads.map((childThread) => renderUnifiedHierarchy(childThread, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!currentThread) return null

  return (
    <div 
      className="border-l bg-background flex flex-col relative h-full"
      style={{ width: `${width}px`, minWidth: '360px', maxWidth: '600px' }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="absolute left-0 top-0 bottom-0 w-1 bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center group z-10"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <Settings className="h-4 w-4 flex-shrink-0" />
          <h3 className="font-semibold truncate min-w-0 flex-1">Thread Context</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Thinking Mode Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">AI Thinking Mode</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Show thinking process</p>
                        <p className="text-xs text-muted-foreground">
                    When enabled, the AI will show its reasoning step by step
                        </p>
                      </div>
                <Switch checked={showThinkingMode} onCheckedChange={setShowThinkingMode} />
                  </div>
            </CardContent>
          </Card>

          {/* Context Length Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Context Length</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Max context messages</p>
                        <p className="text-xs text-muted-foreground">
                      Limit how many messages are sent to the AI (null = unlimited)
                        </p>
                      </div>
                  <Switch 
                    checked={maxContextMessages !== null} 
                    onCheckedChange={(checked) => setMaxContextMessages(checked ? 15 : null)} 
                  />
                  </div>

                {maxContextMessages !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Messages: {maxContextMessages}</span>
                      <span className="text-xs text-muted-foreground">
                        {maxContextMessages * 200}~ tokens
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={maxContextMessages}
                      onChange={(e) => setMaxContextMessages(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                      </div>
                  </div>
                )}
                </div>
            </CardContent>
          </Card>

          {/* Current Thread */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="truncate">Current Thread</span>
                <Badge variant="default" className="flex-shrink-0">{currentThread.messages.filter((m) => m.role === "user").length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2 min-w-0">
                {currentThread.isMainThread ? (
                  <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm font-medium truncate min-w-0 flex-1" title={currentThread.name}>
                  {currentThread.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Always included in context</p>
            </CardContent>
          </Card>

          {/* Thread & Message Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                <span className="truncate">Edit Context</span>
                <div className="flex items-center space-x-2 flex-shrink-0">
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

              <div className="border rounded-lg p-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-3 pb-2 border-b min-w-0">
                  <span className="text-sm font-medium truncate">Threads & Messages</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAllThreads}
                    className="flex-shrink-0 ml-2"
                  >
                    {areAllThreadsSelected() ? "Unselect All" : "Select All"}
                    </Button>
                </div>
                <div className="space-y-1">{availableThreads.map((thread) => renderUnifiedHierarchy(thread))}</div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <DataManagement />
        </div>
      </ScrollArea>
    </div>
  )
}
