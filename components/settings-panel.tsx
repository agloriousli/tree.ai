"use client"

import { Settings, X, MessageSquare, Hash, Search, ChevronRight, ChevronDown, GripVertical, Sliders, Brain, Plus, Edit, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useThreads, type Message, type Thread } from "@/components/thread-provider"
import { useState, useRef, useCallback, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatTime } from "@/lib/utils"
import { DataManagement } from "@/components/data-management"
import { Command, commandManager } from "@/lib/commands"

interface SettingsPanelProps {
  threadId: string
  onClose: () => void
}

type SettingsTab = "context" | "model" | "commands"

export function SettingsPanel({ threadId, onClose }: SettingsPanelProps) {
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
  const [commands, setCommands] = useState<Command[]>([])
  const [showEditCommandDialog, setShowEditCommandDialog] = useState(false)
  const [editingCommand, setEditingCommand] = useState<Command | null>(null)
  const [newCommandName, setNewCommandName] = useState("")
  const [newCommandPrompt, setNewCommandPrompt] = useState("")
  const [newCommandDescription, setNewCommandDescription] = useState("")
  const [messageSearch, setMessageSearch] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)

  // Check if we're in global settings mode (no threads exist)
  const isGlobalSettings = !threadId || threadId === ""
  
  // Set default tab to model settings when no threads exist
  useEffect(() => {
    if (isGlobalSettings) {
      setActiveTab("model")
    }
  }, [isGlobalSettings])

  const currentThread = threads[threadId]
  const hierarchy = isGlobalSettings ? [] : getThreadHierarchy(threadId)
  const contextMessages = isGlobalSettings ? [] : getThreadContext(threadId)
  const allMessages = getAllMessages()
  const mainThreads = getMainThreads()

  // Load commands when component mounts or tab changes
  useEffect(() => {
    if (activeTab === "commands") {
      setCommands(commandManager.getCommands())
    }
  }, [activeTab])

  // Get the root thread for "All Threads" mode
  const getRootThread = (thread: any): any => {
    if (!thread) return undefined;
    if (!thread.parentThreadId) return thread;
    return getRootThread(threads[thread.parentThreadId]);
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

  const handleMessageSelection = (messageId: string, selected: boolean) => {
    if (selected) {
      addContextMessage(threadId, messageId)
    } else {
      if (isMessageExplicitlyIncluded(messageId)) {
        removeContextMessage(threadId, messageId)
      } else if (isMessageInContext(messageId)) {
        excludeMessageFromThread(threadId, messageId)
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
        removeContextThread(threadId, thread.id)
      } else {
        addContextThread(threadId, thread.id)
      }
    })
  }

  const renderUnifiedHierarchy = (thread: Thread, level = 0) => {
    const childThreads = getChildThreads(thread.id)
    const isExpanded = expandedItems.has(thread.id)
    const selectionState = getThreadSelectionState(thread)
    const isInContext = isThreadInContext(thread.id)

    return (
      <div key={thread.id} className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isInContext}
            onCheckedChange={(checked) => handleThreadSelection(thread, checked as boolean)}
            ref={(el) => {
              if (el && el.querySelector('input')) {
                const input = el.querySelector('input') as HTMLInputElement
                input.indeterminate = selectionState === "some"
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => toggleItemExpansion(thread.id)}
          >
            {childThreads.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </Button>
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">{thread.name}</span>
            <Badge variant="outline" className="text-xs">
              {thread.messages.length}
            </Badge>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-6 space-y-2">
            {thread.messages
              .filter((msg) => !messageSearch || msg.content.toLowerCase().includes(messageSearch.toLowerCase()))
              .map((message) => {
                const messageStatus = getMessageStatus(message.id)
                return (
                  <div key={message.id} className="flex items-start space-x-2">
                    <Checkbox
                      checked={isMessageInContext(message.id)}
                      onCheckedChange={(checked) => handleMessageSelection(message.id, checked as boolean)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                        <Badge variant={messageStatus.color as any} className="text-xs">
                          {messageStatus.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                )
              })}
            {childThreads.map((childThread) => renderUnifiedHierarchy(childThread, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderContextTab = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={messageSearch}
            onChange={(e) => setMessageSearch(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-selected"
              checked={showSelectedOnly}
              onCheckedChange={(checked) => setShowSelectedOnly(checked as boolean)}
            />
            <Label htmlFor="show-selected" className="text-sm">Show selected only</Label>
          </div>
        </div>
      </div>

      {/* Context Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Context Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Messages in context:</span>
            <Badge variant="secondary">{contextMessages.length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Threads in context:</span>
            <Badge variant="secondary">{currentThread?.contextThreadIds.length || 0}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Max context messages:</span>
            <Badge variant="outline">{maxContextMessages}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Available Threads */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Available Threads</CardTitle>
            {availableThreads.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllThreads}
                className="h-6 text-xs"
              >
                {areAllThreadsSelected() ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {availableThreads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other threads available
                </p>
              ) : (
                availableThreads.map((thread) => renderUnifiedHierarchy(thread))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Data Management */}
      <DataManagement />
    </div>
  )

  const renderModelTab = () => (
    <div className="space-y-6">
      {/* Thinking Mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">AI Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="thinking-mode" className="text-sm font-medium">Show Thinking Mode</Label>
              <p className="text-xs text-muted-foreground">
                AI will show step-by-step reasoning for all questions
              </p>
            </div>
            <Switch 
              id="thinking-mode"
              checked={showThinkingMode} 
              onCheckedChange={setShowThinkingMode} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Temperature */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Creativity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature" className="text-sm font-medium">Temperature</Label>
              <span className="text-sm text-muted-foreground">{temperature || 0.3}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature || 0.3]}
              onValueChange={(value) => setTemperature(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Focused</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Max Tokens */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Response Length</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-tokens" className="text-sm font-medium">Max Tokens</Label>
              <span className="text-sm text-muted-foreground">{(maxTokens || 8000).toLocaleString()}</span>
            </div>
            <Slider
              id="max-tokens"
              min={1000}
              max={16000}
              step={1000}
              value={[maxTokens || 8000]}
              onValueChange={(value) => setMaxTokens(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short</span>
              <span>Medium</span>
              <span>Long</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context Length */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Context Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="context-length" className="text-sm font-medium">Max Context Messages</Label>
              <span className="text-sm text-muted-foreground">{maxContextMessages}</span>
            </div>
            <Slider
              id="context-length"
              min={5}
              max={50}
              step={5}
              value={[maxContextMessages || 15]}
              onValueChange={(value) => setMaxContextMessages(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimal</span>
              <span>Balanced</span>
              <span>Extended</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCommandsTab = () => (
    <div className="space-y-6">
      {/* Commands Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Custom Commands</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingCommand(null)
                setNewCommandName("")
                setNewCommandPrompt("")
                setNewCommandDescription("")
                setShowEditCommandDialog(true)
              }}
              className="h-8 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Command
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Create custom commands that can be triggered with \command. Use {"{text}"} in your prompt to reference the selected text.
          </p>
          
          <div className="space-y-2">
            {commands.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No custom commands yet. Add your first command!
              </p>
            ) : (
              commands.map((command) => (
                <div
                  key={command.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">\{command.name}</span>
                      {command.description && (
                        <span className="text-xs text-muted-foreground">
                          {command.description}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {command.prompt}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCommand(command)
                        setNewCommandName(command.name)
                        setNewCommandPrompt(command.prompt)
                        setNewCommandDescription(command.description || "")
                        setShowEditCommandDialog(true)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        commandManager.deleteCommand(command.id)
                        setCommands(commandManager.getCommands())
                      }}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset to Defaults */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Reset Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Reset all commands to the default set (define, explain).
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              commandManager.resetToDefaults()
              setCommands(commandManager.getCommands())
            }}
            className="h-8 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  if (!currentThread && !isGlobalSettings) {
    return null
  }

  return (
    <div
      className="flex-shrink-0 bg-background border-l w-[448px]"
    >

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <h2 className="font-semibold">{isGlobalSettings ? "Global Settings" : "Settings"}</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose} 
          className="h-8 w-8 p-0 hover:bg-muted"
          title="Close Settings"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex">
          {!isGlobalSettings && (
            <Button
              variant={activeTab === "context" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("context")}
              className="flex-1 rounded-none text-xs"
              title="Context Management"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Context
            </Button>
          )}
          <Button
            variant={activeTab === "model" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("model")}
            className={`${isGlobalSettings ? 'flex-1' : 'flex-1'} rounded-none text-xs`}
            title="Model Settings"
          >
            <Brain className="h-3 w-3 mr-1" />
            Model
          </Button>
          <Button
            variant={activeTab === "commands" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("commands")}
            className={`${isGlobalSettings ? 'flex-1' : 'flex-1'} rounded-none text-xs`}
            title="Custom Commands"
          >
            <Sliders className="h-3 w-3 mr-1" />
            Commands
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <ScrollArea className="h-[calc(100vh-140px)]">
          {activeTab === "context" ? renderContextTab() : 
           activeTab === "model" ? renderModelTab() : 
           renderCommandsTab()}
        </ScrollArea>
      </div>

      {/* Edit Command Dialog */}
      <Dialog open={showEditCommandDialog} onOpenChange={setShowEditCommandDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCommand ? "Edit Command" : "Add New Command"}
            </DialogTitle>
            <DialogDescription>
              {editingCommand 
                ? "Update the command details below."
                : "Create a new command that can be triggered with \\command"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="command-name">Command Name</Label>
              <Input
                id="command-name"
                value={newCommandName}
                onChange={(e) => setNewCommandName(e.target.value)}
                placeholder="e.g., summarize, translate, analyze"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="command-description">Description (Optional)</Label>
              <Input
                id="command-description"
                value={newCommandDescription}
                onChange={(e) => setNewCommandDescription(e.target.value)}
                placeholder="Brief description of what this command does"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="command-prompt">Prompt</Label>
              <Textarea
                id="command-prompt"
                value={newCommandPrompt}
                onChange={(e) => setNewCommandPrompt(e.target.value)}
                placeholder="Enter the prompt that will be sent to the AI..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{text}"} to reference the selected text in your prompt
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditCommandDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!newCommandName.trim() || !newCommandPrompt.trim()) return

                  if (editingCommand) {
                    commandManager.updateCommand(editingCommand.id, {
                      name: newCommandName.trim(),
                      prompt: newCommandPrompt.trim(),
                      description: newCommandDescription.trim() || undefined
                    })
                  } else {
                    commandManager.addCommand({
                      name: newCommandName.trim(),
                      prompt: newCommandPrompt.trim(),
                      description: newCommandDescription.trim() || undefined
                    })
                  }

                  setCommands(commandManager.getCommands())
                  setShowEditCommandDialog(false)
                }} 
                disabled={!newCommandName.trim() || !newCommandPrompt.trim()}
              >
                {editingCommand ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 