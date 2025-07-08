import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatTime } from "@/lib/utils"
import { Thread, Message } from "@/components/thread-provider"
import { ChevronRight, ChevronDown, Hash, Search } from "lucide-react"

interface ContextTabProps {
  currentThread: Thread
  availableThreads: Thread[]
  contextMessages: Message[]
  messageSearch: string
  setMessageSearch: (s: string) => void
  showSelectedOnly: boolean
  setShowSelectedOnly: (b: boolean) => void
  expandedItems: Set<string>
  setExpandedItems: React.Dispatch<React.SetStateAction<Set<string>>>
  isMessageInContext: (id: string) => boolean
  isMessageExcluded: (id: string) => boolean
  isMessageExplicitlyIncluded: (id: string) => boolean
  isThreadInContext: (id: string) => boolean
  getMessageStatus: (id: string) => { status: string, color: string }
  getThreadSelectionState: (thread: Thread) => "all" | "some" | "none"
  handleThreadSelection: (thread: Thread, selected: boolean) => void
  handleMessageSelection: (messageId: string, selected: boolean) => void
  toggleAllThreads: () => void
}

export function ContextTab(props: ContextTabProps) {
  const {
    currentThread,
    availableThreads,
    contextMessages,
    messageSearch,
    setMessageSearch,
    showSelectedOnly,
    setShowSelectedOnly,
    expandedItems,
    setExpandedItems,
    isMessageInContext,
    isMessageExcluded,
    isMessageExplicitlyIncluded,
    isThreadInContext,
    getMessageStatus,
    getThreadSelectionState,
    handleThreadSelection,
    handleMessageSelection,
    toggleAllThreads,
  } = props

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev: Set<string>) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const renderUnifiedHierarchy = (thread: Thread, level = 0) => {
    const childThreads = thread.subThreads ? thread.subThreads.map(id => availableThreads.find(t => t.id === id)).filter(Boolean) as Thread[] : []
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

  return (
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
            <Badge variant="outline">{contextMessages.length}</Badge>
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
                {/* You may want to pass areAllThreadsSelected as a prop for this label */}
                Select All
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
    </div>
  )
} 