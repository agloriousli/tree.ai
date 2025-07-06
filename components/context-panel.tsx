"use client"

import { X, Plus, Trash2, MessageSquare, Eye, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useThreads } from "@/components/thread-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ContextPanelProps {
  threadId: string
  onClose: () => void
}

export function ContextPanel({ threadId, onClose }: ContextPanelProps) {
  const { threads, addContextThread, removeContextThread, getThreadContext } = useThreads()
  const [selectedThreadToAdd, setSelectedThreadToAdd] = useState<string>("")
  const [showPreview, setShowPreview] = useState(false)

  const currentThread = threads[threadId]
  const availableThreads = Object.values(threads).filter(
    (thread) => thread.id !== threadId && !currentThread?.contextThreadIds.includes(thread.id),
  )

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

  if (!currentThread) return null

  return (
    <div className="w-96 border-l bg-background flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Context Control</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Current Thread Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Current Thread
                <Badge variant="secondary">{currentThread.messages.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{currentThread.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Always included in context</p>
            </CardContent>
          </Card>

          {/* Inherited Context */}
          {currentThread.parentThreadId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Inherited Context
                  <Badge variant="outline">Auto</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{threads[currentThread.parentThreadId]?.name}</span>
                  <Badge variant="secondary">{threads[currentThread.parentThreadId]?.messages.length || 0}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Inherited from parent thread</p>
              </CardContent>
            </Card>
          )}

          {/* Optional Context Threads */}
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
                    <div key={contextThreadId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{contextThread.name}</p>
                          <p className="text-xs text-muted-foreground">{contextThread.messages.length} messages</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={true}
                          onCheckedChange={(checked) => handleToggleContext(contextThreadId, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContextThread(threadId, contextThreadId)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}

              {/* Add New Context */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Select value={selectedThreadToAdd} onValueChange={setSelectedThreadToAdd}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add thread context..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableThreads.map((thread) => (
                        <SelectItem key={thread.id} value={thread.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{thread.name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {thread.messages.length}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddContext} disabled={!selectedThreadToAdd}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
                                      <p className="text-sm font-medium">{thread.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Parent: {threads[thread.parentThreadId!]?.name}
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
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant={msg.role === "user" ? "default" : "secondary"}>{msg.role}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Thread: {threads[msg.threadId]?.name}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
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
                  <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs text-yellow-700 dark:text-yellow-300">
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
