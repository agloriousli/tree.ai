"use client"

import { MessageSquare, Hash, Users, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useThreads, type Thread } from "@/components/thread-provider"

interface InlineThreadPreviewProps {
  thread: Thread
  isActive: boolean
  onSelect: () => void
}

export function InlineThreadPreview({ thread, isActive, onSelect }: InlineThreadPreviewProps) {
  const { threads } = useThreads()

  const lastMessage = thread.messages[thread.messages.length - 1]
  const previewText = lastMessage
    ? `${lastMessage.role === "user" ? "You" : "AI"}: ${lastMessage.content.slice(0, 60)}${lastMessage.content.length > 60 ? "..." : ""}`
    : "No messages yet"

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      className={`w-full justify-start p-3 h-auto text-left ${
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start space-x-3 w-full">
        <div className="flex-shrink-0 mt-0.5">
          {thread.id === "main" ? <MessageSquare className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm truncate max-w-[140px]" title={thread.name}>
              {thread.name}
            </h4>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {thread.contextThreadIds.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-2 w-2 mr-1" />
                  {thread.contextThreadIds.length}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {thread.messages.filter((m) => m.role === "user").length}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground truncate">{previewText}</p>

          {lastMessage && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatTime(lastMessage.timestamp)}
            </p>
          )}
        </div>

        <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
      </div>
    </Button>
  )
}
