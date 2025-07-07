"use client"

import { useState, useEffect } from "react"
import { ThreadProvider, useThreads } from "@/components/thread-provider"
import { ChatSidebar } from "@/components/chat-sidebar"
import { TabbedChatInterface } from "@/components/tabbed-chat-interface"

function HomeContent() {
  const [selectedThreadId, setSelectedThreadId] = useState<string>("")
  const [showContextPanel, setShowContextPanel] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { threads } = useThreads()

  useEffect(() => {
    if (!selectedThreadId && Object.keys(threads).length > 0) {
      const firstThreadId = Object.keys(threads)[0]
      setSelectedThreadId(firstThreadId)
    }
  }, [selectedThreadId, threads])

  const handleThreadSelect = (threadId: string, openInNewTab?: boolean) => {
    console.log(`App: Thread selected: ${threadId}, openInNewTab: ${openInNewTab}`)
    setSelectedThreadId(threadId)
  }

  const handleActiveThreadChange = (threadId: string) => {
    console.log(`App: Active thread changed to: ${threadId}`)
    if (threadId !== selectedThreadId) {
      setSelectedThreadId(threadId)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar
        selectedThreadId={selectedThreadId}
        onThreadSelect={handleThreadSelect}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex min-w-0 overflow-hidden">
        <TabbedChatInterface
          selectedThreadId={selectedThreadId}
          showContextPanel={showContextPanel}
          onToggleContext={() => setShowContextPanel(!showContextPanel)}
          onActiveThreadChange={handleActiveThreadChange}
        />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ThreadProvider>
      <HomeContent />
    </ThreadProvider>
  )
}
