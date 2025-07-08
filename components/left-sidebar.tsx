"use client"

import { ChevronRight, ChevronDown, MessageSquare, Hash, ChevronLeft, Menu, Plus } from "lucide-react"
import { ThreadActionsMenu } from "@/components/thread-actions-menu"
import { Button } from "@/components/ui/button"
import { useThreads } from "@/components/thread-provider"
import { useThreadCreation } from "@/components/hooks/use-thread-creation"
import { useState, useEffect } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Thread } from "@/components/thread-provider"
import { useThreadHierarchy } from "@/components/hooks/use-thread-hierarchy"

interface LeftSidebarProps {
  selectedThreadId: string
  onThreadSelect: (threadId: string, openInNewTab?: boolean) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function LeftSidebar({ selectedThreadId, onThreadSelect, collapsed, onToggleCollapse }: LeftSidebarProps) {
  const { threads, getMainThreads } = useThreads()
  const { createThread } = useThreadCreation()
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(() => new Set(["main"]))
  const [isMobile, setIsMobile] = useState(false)
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false)
  const [newThreadName, setNewThreadName] = useState("Untitled Thread")
  const [newThreadDescription, setNewThreadDescription] = useState("")
  const [newThreadType, setNewThreadType] = useState<"main" | "sub">("main")
  const [parentThreadId, setParentThreadId] = useState("")
  const { getChildThreads, getAncestorThreadIds } = useThreadHierarchy()

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Ensure main thread is always expanded
  useEffect(() => {
    if (expandedThreads instanceof Set && !expandedThreads.has("main")) {
      setExpandedThreads(prev => new Set([...prev, "main"]))
    }
  }, [expandedThreads])

  const toggleExpanded = (threadId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev instanceof Set ? prev : [])
      if (newSet.has(threadId)) {
        newSet.delete(threadId)
      } else {
        newSet.add(threadId)
      }
      return newSet
    })
  }

  const handleCreateNewThread = () => {
    let newThreadId: string | null;
    if (newThreadType === "main") {
      newThreadId = createThread({
        type: 'main',
        name: newThreadName.trim(),
        description: newThreadDescription.trim() || undefined
      });
      if (newThreadId) {
        onThreadSelect(newThreadId, true);
      }
    } else if (newThreadType === "sub" && parentThreadId) {
      newThreadId = createThread({
        type: 'sub',
        name: newThreadName.trim(),
        description: newThreadDescription.trim() || undefined,
        parentThreadId: parentThreadId
      });
      if (newThreadId) {
        onThreadSelect(newThreadId, true);

        // --- Expand all ancestors so the new subthread is visible ---
        setTimeout(() => {
          const ancestorIds = getAncestorThreadIds(newThreadId!);
          setExpandedThreads(prev => new Set([...prev, ...ancestorIds, parentThreadId!]));
        }, 0);
      }
    }

    // Reset form
    setNewThreadName("Untitled Thread");
    setNewThreadDescription("");
    setNewThreadType("main");
    setParentThreadId("");
    setShowNewThreadDialog(false);
  }

  const handleThreadClick = (threadId: string) => {
    // Expand all ancestors so the selected thread is visible
    const ancestorIds = getAncestorThreadIds(threadId);
    setExpandedThreads(prev => new Set([...prev, ...ancestorIds]));
    onThreadSelect(threadId, true);
  }

  const renderThread = (thread: Thread, level = 0) => {
    const childThreads = getChildThreads(thread.id)
    const hasChildren = childThreads.length > 0
    const isExpanded = expandedThreads instanceof Set && expandedThreads.has(thread.id)
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
                {thread.messages.filter((m: any) => m.role === "user").length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {thread.messages.filter((m: any) => m.role === "user").length}
                  </span>
                )}
              </div>
            </Button>
            
            {/* Thread Actions Menu */}
            <div className="flex-shrink-0">
              <ThreadActionsMenu threadId={thread.id} />
            </div>
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
          <div className="flex-1 overflow-y-auto">
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
                onClick={() => {
                  setNewThreadName("Untitled Thread")
                  setNewThreadDescription("")
                  setNewThreadType("main")
                  setParentThreadId("")
                  setShowNewThreadDialog(true)
                }}
                className="w-8 h-8 p-0"
                title="New Thread"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
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

        {/* New Thread Dialog for Collapsed Sidebar */}
        <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Thread</DialogTitle>
              <DialogDescription>
                Create a new thread to organize your conversations. You can create main threads or subthreads that branch from existing conversations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thread-name-collapsed">Thread Name (Optional)</Label>
                <Input
                  id="thread-name-collapsed"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  placeholder="Enter thread name..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thread-type-collapsed">Thread Type</Label>
                <Select value={newThreadType} onValueChange={(value: "main" | "sub") => setNewThreadType(value)}>
                  <SelectTrigger id="thread-type-collapsed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Thread</SelectItem>
                    <SelectItem value="sub">Subthread</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newThreadType === "sub" && (
                <div className="space-y-2">
                  <Label htmlFor="parent-thread-collapsed">Parent Thread</Label>
                  <Select value={parentThreadId} onValueChange={setParentThreadId}>
                    <SelectTrigger id="parent-thread-collapsed">
                      <SelectValue placeholder="Select parent thread..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(threads)
                        .filter((thread) => thread.isMainThread)
                        .map((thread) => (
                          <SelectItem key={thread.id} value={thread.id}>
                            {thread.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="thread-description-collapsed">Description (Optional)</Label>
                <Textarea
                  id="thread-description-collapsed"
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
                <Button onClick={handleCreateNewThread} disabled={(newThreadType === "sub" && !parentThreadId)}>
                  Create Thread
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
            <p className="text-sm text-muted-foreground truncate">All Conversation Channels</p>
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
                  <DialogDescription>
                    Create a new thread to organize your conversations. You can create main threads or subthreads that branch from existing conversations.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="thread-name">Thread Name (Optional)</Label>
                    <Input
                      id="thread-name"
                      value={newThreadName}
                      onChange={(e) => setNewThreadName(e.target.value)}
                      placeholder="Enter thread name..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thread-type">Thread Type</Label>
                    <Select value={newThreadType} onValueChange={(value: "main" | "sub") => setNewThreadType(value)}>
                      <SelectTrigger id="thread-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main Thread</SelectItem>
                        <SelectItem value="sub">Subthread</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newThreadType === "sub" && (
                    <div className="space-y-2">
                      <Label htmlFor="parent-thread">Parent Thread</Label>
                      <Select value={parentThreadId} onValueChange={setParentThreadId}>
                        <SelectTrigger id="parent-thread">
                          <SelectValue placeholder="Select parent thread..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(threads)
                            .filter((thread) => thread.isMainThread)
                            .map((thread) => (
                              <SelectItem key={thread.id} value={thread.id}>
                                {thread.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                    <Button onClick={handleCreateNewThread} disabled={(newThreadType === "sub" && !parentThreadId)}>
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
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-4">
            {mainThreads.map((mainThread, index) => (
              <div key={mainThread.id}>
                {index > 0 && <Separator className="my-2" />}
                <div className="space-y-1">{renderThread(mainThread)}</div>
              </div>
            ))}
          </div>
        </div>
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
