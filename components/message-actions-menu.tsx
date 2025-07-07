"use client"

import { MoreHorizontal, Edit, Trash2, Copy, Reply, GitBranch, Pin, Flag, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useThreads, type Message } from "@/components/thread-provider"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MessageActionsMenuProps {
  message: Message
  currentThreadId: string
  onEdit?: () => void
  onReply?: () => void
  onFork?: () => void
}

export function MessageActionsMenu({ message, currentThreadId, onEdit, onReply, onFork }: MessageActionsMenuProps) {
  const {
    deleteMessage,
    forkMessage,
    addContextMessage,
    removeContextMessage,
    excludeMessageFromThread,
    includeMessageInThread,
    threads,
    getMainThreads,
  } = useThreads()
  const [showForkDialog, setShowForkDialog] = useState(false)
  const [forkName, setForkName] = useState("")

  const currentThread = threads[currentThreadId]
  const mainThreads = getMainThreads()
  const otherThreads = Object.values(threads).filter((t) => t.id !== currentThreadId)
  
  // Debug: Log available threads for context
  console.log(`MessageActionsMenu for thread ${currentThreadId}:`)
  console.log(`- Current thread: ${currentThread?.name}`)
  console.log(`- Available threads for context:`, otherThreads.map(t => ({ id: t.id, name: t.name })))

  const isMessageInCurrentThreadContext = () => {
    return !currentThread?.excludedMessageIds.includes(message.id)
  }

  const isMessageExplicitlyIncluded = (threadId: string) => {
    return threads[threadId]?.contextMessageIds.includes(message.id) || false
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessage(message.id)
    }
  }

  const handleFork = () => {
    const defaultName = `Fork: ${message.content.slice(0, 30)}${message.content.length > 30 ? "..." : ""}`
    setForkName(defaultName)
    setShowForkDialog(true)
  }

  const confirmFork = () => {
    if (forkName.trim()) {
      forkMessage(message.id, forkName.trim())
      setShowForkDialog(false)
      onFork?.()
    }
  }

  const handleAddToThread = (threadId: string) => {
    addContextMessage(threadId, message.id)
  }

  const handleRemoveFromThread = (threadId: string) => {
    if (message.threadId === threadId) {
      // If it's the message's own thread, exclude it
      excludeMessageFromThread(threadId, message.id)
    } else {
      // If it's another thread, remove from explicit inclusion
      removeContextMessage(threadId, message.id)
    }
  }

  const isUserMessage = message.role === "user"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Edit - Only for user messages */}
          {isUserMessage && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Message
            </DropdownMenuItem>
          )}

          {/* Reply */}
          <DropdownMenuItem onClick={onReply}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </DropdownMenuItem>

          {/* Fork */}
          <DropdownMenuItem onClick={handleFork}>
            <GitBranch className="h-4 w-4 mr-2" />
            Create Thread
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Context Management */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Plus className="h-4 w-4 mr-2" />
              Add to Thread Context
              {otherThreads.length === 0 && " (No other threads)"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {otherThreads.length === 0 ? (
                <DropdownMenuItem disabled>
                  No other threads available
                </DropdownMenuItem>
              ) : (
                otherThreads.map((thread) => (
                  <DropdownMenuItem
                    key={thread.id}
                    onClick={() => handleAddToThread(thread.id)}
                    disabled={isMessageExplicitlyIncluded(thread.id)}
                  >
                    {thread.name}
                    {isMessageExplicitlyIncluded(thread.id) && " ✓"}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Minus className="h-4 w-4 mr-2" />
              Remove from Thread Context
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {otherThreads
                .filter((thread) => isMessageExplicitlyIncluded(thread.id))
                .map((thread) => (
                  <DropdownMenuItem key={thread.id} onClick={() => handleRemoveFromThread(thread.id)}>
                    {thread.name}
                  </DropdownMenuItem>
                ))}
              {message.threadId === currentThreadId && isMessageInCurrentThreadContext() && (
                <DropdownMenuItem onClick={() => handleRemoveFromThread(currentThreadId)}>
                  Exclude from {currentThread?.name}
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Copy */}
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Text
          </DropdownMenuItem>

          {/* Pin */}
          <DropdownMenuItem>
            <Pin className="h-4 w-4 mr-2" />
            Pin Message
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Report */}
          <DropdownMenuItem>
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>

          {/* Delete - Allow deletion of all messages */}
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Message
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Fork Dialog */}
      <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Thread</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Starting from message:</p>
              <p className="text-sm">{message.content}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fork-name">Thread Name</Label>
              <Input
                id="fork-name"
                value={forkName}
                onChange={(e) => setForkName(e.target.value)}
                placeholder="Enter thread name..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowForkDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmFork} disabled={!forkName.trim()}>
                Create Thread
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
