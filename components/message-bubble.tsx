"use client"

import type React from "react"

import { GitBranch, User, Bot, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThreads, type Message } from "@/components/thread-provider"
import { useState, useEffect } from "react"
import { InlineThreadPreview } from "@/components/inline-thread-preview"
import { MessageActionsMenu } from "@/components/message-actions-menu"

import { Textarea } from "@/components/ui/textarea"
import { formatTime } from "@/lib/utils"
import { MathJaxRenderer } from "@/components/mathjax-renderer"

// Component to render markdown with LaTeX support using MathJax
function MathRenderer({ content }: { content: string }) {
  // Always use MathJaxRenderer for all content (handles both markdown and math)
  return <MathJaxRenderer content={content} />
}

interface MessageBubbleProps {
  message: Message
  showAvatar?: boolean
  currentThreadId: string
  onThreadSelect: (threadId: string) => void
}

export function MessageBubble({ message, showAvatar = true, currentThreadId, onThreadSelect }: MessageBubbleProps) {
  const { getMessageForks, showInlineForks, editMessage, threads } = useThreads()
  const [showForks, setShowForks] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const forks = getMessageForks(message.id)
  const hasForks = forks.length > 0
  const isUser = message.role === "user"
  const currentThread = threads[currentThreadId]

  // Check if message is excluded from current thread's context
  const isExcludedFromContext = currentThread?.excludedMessageIds.includes(message.id) || false

  const handleEdit = () => {
    setEditContent(message.content)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      editMessage(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  

  return (
    <div className="space-y-2">
      {/* Main Message */}
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
        <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
          <div className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
            {/* Avatar */}
            {showAvatar && (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isUser ? "bg-primary text-primary-foreground" : "bg-muted border"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
            )}

            <div
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} ${!showAvatar ? (isUser ? "mr-11" : "ml-11") : ""}`}
            >
              {/* Message Content */}
              <div
                className={`p-4 rounded-lg border relative ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border-border hover:bg-muted/50 transition-colors"
                } ${isExcludedFromContext ? "opacity-60 border-dashed" : ""} select-text`}
                data-message-bubble
                data-message-id={message.id}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="min-h-[60px] resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
                      <MathRenderer content={message.content} />
                    </div>
                    {message.isEdited && (
                      <span className="text-xs text-muted-foreground mt-1 block opacity-70">(edited)</span>
                    )}
                    {isExcludedFromContext && (
                      <span className="text-xs text-muted-foreground mt-1 block opacity-70 italic">
                        (excluded from this thread's context)
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Message Actions */}
              <div className="flex items-center mt-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>

                {hasForks && showInlineForks && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForks(!showForks)}
                    className="h-7 px-2 text-xs"
                  >
                    {showForks ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {showForks ? "Hide" : "Show"} Threads ({forks.length})
                  </Button>
                )}

                {/* Context indicator - show when there are other threads available */}
                {Object.values(threads).filter(t => t.id !== currentThreadId).length > 0 && (
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">
                    Context available
                  </span>
                )}

                <MessageActionsMenu
                  message={message}
                  currentThreadId={currentThreadId}
                  onEdit={handleEdit}
                  onReply={() => {
                    // Handle reply logic
                  }}
                  onFork={() => {
                    // Handle fork logic
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Fork Previews (Discord Style) */}
      {hasForks && showInlineForks && showForks && (
        <div className={`ml-11 space-y-2 ${isUser ? "mr-11" : ""}`}>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <GitBranch className="h-3 w-3" />
            <span>
              {forks.length} thread{forks.length > 1 ? "s" : ""} started from this message
            </span>
          </div>

          <div className="space-y-2 border-l-2 border-muted pl-4">
            {forks.map((fork) => (
              <InlineThreadPreview
                key={fork.id}
                thread={fork}
                isActive={currentThreadId === fork.id}
                onSelect={() => onThreadSelect(fork.id)}
              />
            ))}
          </div>
        </div>
      )}


    </div>
  )
}
