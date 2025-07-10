"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  MessageSquare, 
  GitBranch,
  Eye,
  EyeOff,
  Filter,
  Layers
} from "lucide-react"
import { useThreads } from "@/components/thread-provider"
import { useThreadHierarchy } from "@/components/hooks/use-thread-hierarchy"

interface ThreadExplorerProps {
  onThreadSelect?: (threadId: string) => void
  onMessageSelect?: (messageId: string) => void
}

export function ThreadExplorer({ onThreadSelect, onMessageSelect }: ThreadExplorerProps) {
  const { threads, toggleThreadVisibility } = useThreads()
  const { getChildThreads, getAncestorThreadIds } = useThreadHierarchy()
  
  // State for UI controls
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [viewMode, setViewMode] = useState<"hierarchy" | "flat" | "messages">("hierarchy")
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  
  // Pagination for messages
  const [messagePage, setMessagePage] = useState(1)
  const messagesPerPage = 50

  // Track if we've initialized auto-expand
  const hasInitialized = useRef(false)

  // Auto-expand threads with manageable subthreads on first load
  useEffect(() => {
    if (hasInitialized.current || Object.keys(threads).length === 0) return
    
    const autoExpandThreads = new Set<string>()
    Object.values(threads).forEach(thread => {
      const children = getChildThreads(thread.id)
      // Auto-expand if thread has 1-5 subthreads (manageable number)
      if (children.length >= 1 && children.length <= 5) {
        autoExpandThreads.add(thread.id)
      }
    })
    setExpandedThreads(autoExpandThreads)
    hasInitialized.current = true
  }, [threads]) // Only depend on threads, not getChildThreads

  // Filter and search logic
  const filteredThreads = useMemo(() => {
    let filtered = Object.values(threads)
    
    // Filter by visibility
    if (!showHidden) {
      filtered = filtered.filter(thread => thread.isVisible !== false)
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(thread => 
        thread.name.toLowerCase().includes(term) ||
        thread.description?.toLowerCase().includes(term) ||
        thread.messages.some(msg => msg.content.toLowerCase().includes(term))
      )
    }
    
    return filtered
  }, [threads, searchTerm, showHidden])

  // Get main threads (no parent)
  const mainThreads = useMemo(() => 
    filteredThreads.filter(thread => !thread.parentThreadId), 
    [filteredThreads]
  )

  // Toggle thread expansion
  const toggleThreadExpansion = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(threadId)) {
        newSet.delete(threadId)
      } else {
        newSet.add(threadId)
      }
      return newSet
    })
  }

  // Toggle message expansion
  const toggleMessageExpansion = (threadId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(threadId)) {
        newSet.delete(threadId)
      } else {
        newSet.add(threadId)
      }
      return newSet
    })
  }

  // Render thread hierarchy recursively
  const renderThreadHierarchy = (thread: any, level: number = 0) => {
    const children = getChildThreads(thread.id)
    const isExpanded = expandedThreads.has(thread.id)
    const hasChildren = children.length > 0
    const isSelected = selectedThreadId === thread.id
    const isSubthread = !!thread.parentThreadId

    return (
      <div key={thread.id} className="space-y-1">
        <div 
          className={`
            flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors min-w-0
            ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}
            ${isSubthread ? 'border-l-4 border-l-blue-200 bg-blue-50/30' : ''}
          `}
          onClick={() => {
            setSelectedThreadId(thread.id)
            onThreadSelect?.(thread.id)
          }}
        >
          {/* Indentation */}
          <div className="flex-shrink-0" style={{ width: level * 16 }} />
          
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                toggleThreadExpansion(thread.id)
              }}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          
          {/* Thread info */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center space-x-2 min-w-0">
              <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate min-w-0 flex-1">{thread.name}</span>
              {thread.isMainThread && <Badge variant="secondary" className="text-xs flex-shrink-0">Main</Badge>}
              {isSubthread && <Badge variant="outline" className="text-xs flex-shrink-0">Subthread</Badge>}
              {thread.isVisible === false && <EyeOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              {hasChildren && (
                <Badge variant="default" className="text-xs flex-shrink-0">
                  {children.length} subthread{children.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1 min-w-0">
              <span className="flex-shrink-0">{thread.messages.length} messages</span>
              {thread.contextThreadIds.length > 0 && (
                <span className="flex-shrink-0">• {thread.contextThreadIds.length} context threads</span>
              )}
              {isSubthread && (
                <span className="flex-shrink-0">• Parent: {threads[thread.parentThreadId]?.name || 'Unknown'}</span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                toggleMessageExpansion(thread.id)
              }}
              className="h-6 w-6 p-0"
              title="Toggle messages"
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                toggleThreadVisibility(thread.id)
              }}
              className="h-6 w-6 p-0"
              title={thread.isVisible === false ? "Show thread" : "Hide thread"}
            >
              {thread.isVisible === false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Messages (collapsible) */}
        {expandedMessages.has(thread.id) && (
          <div className="ml-6 space-y-1">
            {thread.messages.slice(0, 10).map((msg: any, index: number) => (
              <div 
                key={msg.id}
                className="flex items-start space-x-2 p-2 bg-muted/30 rounded text-xs cursor-pointer hover:bg-muted/50 min-w-0"
                onClick={() => onMessageSelect?.(msg.id)}
              >
                <Badge variant={msg.role === "user" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                  {msg.role}
                </Badge>
                <span className="flex-1 truncate min-w-0">{msg.content.slice(0, 100)}</span>
              </div>
            ))}
            {thread.messages.length > 10 && (
              <div className="text-xs text-muted-foreground p-2">
                +{thread.messages.length - 10} more messages
              </div>
            )}
          </div>
        )}

        {/* Child threads */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {children.map((childThread: any) => renderThreadHierarchy(childThread, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // Render flat thread list
  const renderFlatThreadList = () => (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {filteredThreads.map(thread => (
        <div key={thread.id} className="p-3 border rounded-lg min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center space-x-2 min-w-0">
                <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium truncate min-w-0 flex-1">{thread.name}</span>
                {thread.isMainThread && <Badge variant="secondary" className="flex-shrink-0">Main</Badge>}
                {thread.parentThreadId && (
                  <Badge variant="outline" className="flex-shrink-0">Subthread</Badge>
                )}
                {getChildThreads(thread.id).length > 0 && (
                  <Badge variant="default" className="flex-shrink-0">
                    {getChildThreads(thread.id).length} subthread{getChildThreads(thread.id).length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1 truncate">
                {thread.description || "No description"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {thread.messages.length} messages • {thread.contextThreadIds.length} context threads
                {thread.parentThreadId && (
                  <span> • Parent: {threads[thread.parentThreadId]?.name || 'Unknown'}</span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onThreadSelect?.(thread.id)}
              className="flex-shrink-0 ml-2"
            >
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4 w-full">
      {/* Controls */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search threads and messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters and View Mode */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "hierarchy" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("hierarchy")}
            >
              <Layers className="h-4 w-4 mr-1" />
              Hierarchy
            </Button>
            <Button
              variant={viewMode === "flat" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("flat")}
            >
              <GitBranch className="h-4 w-4 mr-1" />
              Flat List
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={showHidden ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
            >
              <EyeOff className="h-4 w-4 mr-1" />
              Hidden
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="text-sm text-muted-foreground">
          {filteredThreads.length} threads • {filteredThreads.reduce((sum, t) => sum + t.messages.length, 0)} messages
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        {viewMode === "hierarchy" ? (
          <div className="space-y-2 w-full max-h-[500px] overflow-y-auto">
            {mainThreads.map(thread => renderThreadHierarchy(thread))}
          </div>
        ) : (
          renderFlatThreadList()
        )}
      </div>
    </div>
  )
} 