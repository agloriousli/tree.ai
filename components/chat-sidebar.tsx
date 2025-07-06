"use client"

import { ChevronRight, ChevronDown, MessageSquare, Hash, ChevronLeft, Menu, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThreads } from "@/components/thread-provider"
import { useState, useEffect } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface ChatSidebarProps {
  selectedThreadId: string
  onThreadSelect: (threadId: string, openInNewTab?: boolean) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function ChatSidebar({ selectedThreadId, onThreadSelect, collapsed, onToggleCollapse }: ChatSidebarProps) {
  const { threads, getMainThreads, createMainThread } = useThreads()
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set(["main"]))
  const [isMobile, setIsMobile] = useState(false)
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false)
  const [newThreadName, setNewThreadName] = useState("")
  const [newThreadDescription, setNewThreadDescription] = useState("")

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleExpanded = (threadId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(threadId)) {
        newSet.delete(threadId)
      } else {
        newSet.add(threadId)
      }
      return newSet
    })
  }

  const getChildThreads = (parentId: string) => {
    return Object.values(threads).filter((thread) => thread.parentThreadId === parentId)
  }

  const handleCreateMainThread = () => {
    if (newThreadName.trim()) {
      const newThreadId = createMainThread(newThreadName.trim(), newThreadDescription.trim() || undefined)
      onThreadSelect(newThreadId, true)
      setNewThreadName("")
      setNewThreadDescription("")
      setShowNewThreadDialog(false)
    }
  }

  const handleThreadClick = (threadId: string) => {
    console.log(`Sidebar: Thread clicked: ${threadId}`)
    onThreadSelect(threadId, true)
  }

  const renderThread = (thread: any, level = 0) => {
    const childThreads = getChildThreads(thread.id)
    const hasChildren = childThreads.length > 0
    const isExpanded = expandedThreads.has(thread.id)
    const isSelected = selectedThreadId === thread.id

    return (
      <div key={thread.id} className="w-full">
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(thread.id)}>
          <div className="flex items-center group w-full">
            {hasChildren && (
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-sidebar-accent flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpanded(thread.id)
                  }}
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
            )}
            <Button
              variant={isSelected ? "default" : "ghost"}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleThreadClick(thread.id)
              }}
              className={`flex-1 justify-start h-8 px-2 ${!hasChildren ? "ml-6" : ""} ${level > 0 ? `ml-${Math.min(level * 2, 8)}` : ""}`}
            >
              <div className="flex items-center space-x-2 w-full min-w-0">
                {thread.isMainThread ? (
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-primary" />
                ) : (
                  <Hash className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="truncate text-sm max-w-[120px]" title={thread.name}>
                  {thread.name}
                </span>
                {thread.messages.filter((m) => m.role === "user").length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {thread.messages.filter((m) => m.role === "user").length}
                  </span>
                )}
              </div>
            </Button>
          </div>
          {hasChildren && (
            <CollapsibleContent>
              <div className="ml-2 border-l border-sidebar-border pl-2 space-y-1">
                {childThreads.map((childThread) => renderThread(childThread, level + 1))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    )
  }

  const mainThreads = getMainThreads()

  // Collapsed sidebar (icon-only)
  if (collapsed) {
    return (
      <div className="relative flex-shrink-0">
        <div className="w-12 h-full border-r bg-sidebar flex flex-col">
          {/* Header */}
          <div className="p-2 border-b">
            <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="w-8 h-8 p-0" title="Expand sidebar">
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Thread Icons */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {mainThreads.slice(0, 8).map((thread) => (
                <Button
                  key={thread.id}
                  variant={selectedThreadId === thread.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleThreadClick(thread.id)}
                  className="w-8 h-8 p-0"
                  title={thread.name}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewThreadDialog(true)}
                className="w-8 h-8 p-0"
                title="New Thread"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Floating Toggle Button for Mobile */}
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleCollapse}
            className="fixed top-4 left-14 z-50 h-8 w-8 p-0 bg-background border shadow-lg hover:shadow-xl transition-shadow md:hidden"
            title="Expand sidebar"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // Expanded sidebar
  return (
    <div className="relative flex-shrink-0">
      <div className={`${isMobile ? "w-72" : "w-80"} h-full border-r bg-sidebar flex flex-col`}>
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">Threads</h2>
            <p className="text-sm text-muted-foreground truncate">Multiple conversation channels</p>
          </div>
          <div className="flex items-center space-x-1">
            <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex-shrink-0" title="New Thread">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="thread-name">Thread Name</Label>
                    <Input
                      id="thread-name"
                      value={newThreadName}
                      onChange={(e) => setNewThreadName(e.target.value)}
                      placeholder="e.g., Project Planning, Code Review..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thread-description">Description (Optional)</Label>
                    <Textarea
                      id="thread-description"
                      value={newThreadDescription}
                      onChange={(e) => setNewThreadDescription(e.target.value)}
                      placeholder="Describe what this thread will be used for..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewThreadDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMainThread} disabled={!newThreadName.trim()}>
                      Create Thread
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thread List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {mainThreads.map((mainThread, index) => (
              <div key={mainThread.id}>
                {index > 0 && <Separator className="my-2" />}
                <div className="space-y-1">{renderThread(mainThread)}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Floating Toggle Button for Mobile */}
      {isMobile && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleCollapse}
          className="fixed top-4 left-4 z-50 h-8 w-8 p-0 bg-background border shadow-lg hover:shadow-xl transition-shadow md:hidden"
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
