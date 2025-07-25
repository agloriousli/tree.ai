"use client"

import { X, Plus, Trash2, MessageSquare, Eye, AlertTriangle, GripVertical, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useThreads } from "@/components/thread-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useThreadHierarchy } from "@/components/hooks/use-thread-hierarchy"
import { Checkbox } from "@/components/ui/checkbox"
import { useMessageContext } from "@/components/hooks/use-message-context"
import { Input } from "@/components/ui/input"
import { ThreadExplorer } from "@/components/thread-explorer"

interface ContextPanelProps {
  threadId: string
  onClose: () => void
}

export function ContextPanel({ threadId, onClose }: ContextPanelProps) {
  const { threads, addContextThread, removeContextThread, getThreadContext, addContextMessage, removeContextMessage, excludeMessageFromThread, includeMessageInThread } = useThreads()
  const [selectedThreadToAdd, setSelectedThreadToAdd] = useState<string>("")
  const [showPreview, setShowPreview] = useState(false)
  const [width, setWidth] = useState(384) // Default width (w-96 = 384px)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const { getParentThread } = useThreadHierarchy()
  const { isMessageInContext, isMessageExcluded, isMessageExplicitlyIncluded } = useMessageContext(threadId)
  const [globalMessageSearch, setGlobalMessageSearch] = useState("")
  const [showCurrentThreadMessages, setShowCurrentThreadMessages] = useState(false)
  const [showInheritedMessages, setShowInheritedMessages] = useState(false)
  const [showOptionalMessages, setShowOptionalMessages] = useState(false)
  const [showAddContextDialog, setShowAddContextDialog] = useState(false)

  const currentThread = threads[threadId]
  const availableThreads = Object.values(threads).filter(
    (thread) => thread.id !== threadId && !currentThread?.contextThreadIds.includes(thread.id),
  )

  // Compute inherited and optional threads
  const inheritedThreads = currentThread.parentThreadId ? [threads[currentThread.parentThreadId]].filter(Boolean) : []
  const optionalThreads = currentThread.contextThreadIds
    .filter((id) => id !== currentThread.parentThreadId)
    .map((id) => threads[id])
    .filter(Boolean)

  const handleAddContext = () => {
    if (selectedThreadToAdd) {
      addContextThread(threadId, selectedThreadToAdd)
      setSelectedThreadToAdd("")
    }
  }

  const handleToggleContext = (contextThreadId: string, enabled: boolean) => {
    if (enabled) {
      addContextThread(threadId, contextThreadId)
    } else {
      removeContextThread(threadId, contextThreadId)
    }
  }

  const contextMessages = getThreadContext(threadId)
  const totalContextMessages = contextMessages.length
  const isContextHeavy = totalContextMessages > 50

  // Helper to handle message selection
  const handleMessageToggle = (message: any, selected: boolean) => {
    if (selected) {
      if (isMessageExcluded(message.id)) {
        includeMessageInThread(threadId, message.id)
      } else if (!isMessageInContext(message.id)) {
        addContextMessage(threadId, message.id)
      }
    } else {
      if (isMessageExplicitlyIncluded(message.id)) {
        removeContextMessage(threadId, message.id)
      } else if (isMessageInContext(message.id)) {
        excludeMessageFromThread(threadId, message.id)
      }
    }
  }

  // Compute all messages for global search
  const allMessages = Object.values(threads).flatMap(thread => thread.messages.map(msg => ({...msg, threadName: thread.name, threadId: thread.id})))
  const filteredMessages = globalMessageSearch.trim().length > 0
    ? allMessages.filter(msg =>
        msg.content.toLowerCase().includes(globalMessageSearch.toLowerCase()) ||
        (msg.threadName && msg.threadName.toLowerCase().includes(globalMessageSearch.toLowerCase()))
      )
    : []

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
      // Constrain width between 320px and 600px
      const constrainedWidth = Math.max(320, Math.min(600, newWidth))
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

  const handleAddContextFromExplorer = (selectedThreadId: string) => {
    if (selectedThreadId && selectedThreadId !== threadId) {
      addContextThread(threadId, selectedThreadId)
      setShowAddContextDialog(false)
    }
  }

  if (!currentThread) return null

  return (
    <div 
      className="border-l bg-background flex flex-col relative w-full h-full"
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
        <h3 className="text-lg font-semibold truncate">Context Control</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(90vh-120px)] overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Global Message Search */}
          <div>
            <Input
              placeholder="Search all messages..."
              value={globalMessageSearch}
              onChange={e => setGlobalMessageSearch(e.target.value)}
              className="mb-2"
            />
            {globalMessageSearch.trim().length > 0 && (
              <div className="max-h-64 overflow-y-auto border rounded p-2 bg-muted/30">
                {filteredMessages.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No messages found.</div>
                ) : (
                  filteredMessages.map(msg => (
                    <div key={msg.id} className="flex items-center space-x-2 py-1 border-b last:border-b-0">
                      <Checkbox
                        checked={isMessageExcluded(msg.id) ? 'indeterminate' : (isMessageInContext(msg.id) ? true : false)}
                        onCheckedChange={checked => handleMessageToggle(msg, checked === true)}
                      />
                      <span className="truncate text-xs flex-1">{msg.content.slice(0, 60)}</span>
                      <Badge variant="secondary" className="ml-2">{msg.threadName}</Badge>
                      {isMessageExcluded(msg.id) && <Badge variant="destructive" className="ml-2">Excluded</Badge>}
                      {isMessageExplicitlyIncluded(msg.id) && <Badge variant="default" className="ml-2">Explicit</Badge>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Current Thread Info & Messages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="truncate">This Thread</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="flex-shrink-0">{currentThread.messages.length}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCurrentThreadMessages(!showCurrentThreadMessages)}
                    className="h-6 w-6 p-0"
                  >
                    {showCurrentThreadMessages ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2 min-w-0">
                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate min-w-0 flex-1">{currentThread.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Always included in context (can exclude individual messages below)</p>
              
              {/* Message Summary */}
              <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Messages Included: </span>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-green-600">✓ {currentThread.messages.filter(msg => isMessageInContext(msg.id) && !isMessageExcluded(msg.id)).length} included</span>
                    <span className="text-red-600">✗ {currentThread.messages.filter(msg => isMessageExcluded(msg.id)).length} excluded</span>
                  </div>
                </div>
              </div>

              {/* Expandable Message List */}
              {showCurrentThreadMessages && (
                <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                  {currentThread.messages.map((msg: any) => (
                    <div key={msg.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={isMessageExcluded(msg.id) ? 'indeterminate' : (isMessageInContext(msg.id) ? true : false)}
                        onCheckedChange={(checked) => handleMessageToggle(msg, checked === true)}
                      />
                      <span className="truncate text-xs flex-1">{msg.content.slice(0, 60)}</span>
                      {isMessageExcluded(msg.id) && <Badge variant="destructive" className="ml-2">Excluded</Badge>}
                      {isMessageExplicitlyIncluded(msg.id) && <Badge variant="default" className="ml-2">Explicit</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inherited Threads */}
          {inheritedThreads.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Inherited from Parent</span>
                  <Badge variant="secondary" className="flex-shrink-0">{inheritedThreads.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {inheritedThreads.map((thread) => (
                  <div key={thread.id} className="space-y-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate min-w-0 flex-1">{thread.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContextThread(threadId, thread.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Inherited from parent thread (can exclude individual messages)</p>
                    
                    <div className="space-y-1">
                      {thread.messages.map((msg: any) => (
                        <div key={msg.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={isMessageExcluded(msg.id) ? 'indeterminate' : (isMessageInContext(msg.id) ? true : false)}
                            onCheckedChange={(checked) => handleMessageToggle(msg, checked === true)}
                          />
                          <span className="truncate text-xs flex-1">{msg.content.slice(0, 60)}</span>
                          {isMessageExcluded(msg.id) && <Badge variant="destructive" className="ml-2">Excluded</Badge>}
                          {isMessageExplicitlyIncluded(msg.id) && <Badge variant="default" className="ml-2">Explicit</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optional Context Threads & Messages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Optional Context</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Active Optional Contexts */}
              {currentThread.contextThreadIds
                .filter((id) => id !== currentThread.parentThreadId)
                .map((contextThreadId) => {
                  const contextThread = threads[contextThreadId]
                  if (!contextThread) return null

                  return (
                    <div key={contextThreadId} className="mb-2">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg min-w-0">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{contextThread.name}</p>
                            <p className="text-xs text-muted-foreground">{contextThread.messages.length} messages</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContextThread(threadId, contextThreadId)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="ml-6 mt-1 space-y-1">
                        {contextThread.messages.map((msg: any) => (
                          <div key={msg.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={isMessageExcluded(msg.id) ? 'indeterminate' : (isMessageInContext(msg.id) ? true : false)}
                              onCheckedChange={(checked) => handleMessageToggle(msg, checked === true)}
                            />
                            <span className="truncate text-xs flex-1">{msg.content.slice(0, 60)}</span>
                            {isMessageExcluded(msg.id) && <Badge variant="destructive" className="ml-2">Excluded</Badge>}
                            {isMessageExplicitlyIncluded(msg.id) && <Badge variant="default" className="ml-2">Explicit</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

              {/* Add New Context */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddContextDialog(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Thread Context
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Context Dialog */}
          <Dialog open={showAddContextDialog} onOpenChange={setShowAddContextDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Add Thread Context</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <ThreadExplorer 
                  onThreadSelect={handleAddContextFromExplorer}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Context Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="truncate">Context Summary</span>
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>LLM Context Preview</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {/* Subthreads Section */}
                        {(() => {
                          const subthreads = Object.values(threads).filter(
                            (thread) => thread.parentThreadId && contextMessages.some((msg) => msg.threadId === thread.id)
                          )
                          if (subthreads.length > 0) {
                            return (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Subthreads in Context:</h4>
                                <div className="space-y-1">
                                  {subthreads.map((thread) => (
                                    <div key={thread.id} className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className="text-xs">Subthread</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {thread.messages.length} messages
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium break-words">{thread.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        Parent: {getParentThread(thread.id)?.name}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}
                        
                        {/* Messages Section */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Messages in Context:</h4>
                      <div className="space-y-2">
                        {contextMessages.map((msg, index) => (
                          <div key={index} className="p-2 bg-muted rounded text-sm">
                                <div className="flex items-center justify-between mb-1 min-w-0">
                                  <Badge variant={msg.role === "user" ? "default" : "secondary"} className="flex-shrink-0">{msg.role}</Badge>
                                  <span className="text-xs text-muted-foreground truncate ml-2 min-w-0 flex-1">
                                Thread: {threads[msg.threadId]?.name}
                              </span>
                            </div>
                                <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Active threads:</span>
                  <span>{currentThread.contextThreadIds.length + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subthreads in context:</span>
                  <span>
                    {Object.values(threads).filter(
                      (thread) => thread.parentThreadId && contextMessages.some((msg) => msg.threadId === thread.id)
                    ).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total messages:</span>
                  <span>{totalContextMessages}</span>
                </div>
                {isContextHeavy && (
                  <div className="flex items-start space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-yellow-700 dark:text-yellow-300 break-words">
                      Large context may affect response time
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
