"use client"

import { useState } from "react"
import { ThreadProvider } from "@/components/thread-provider"
import { ChatSidebar } from "@/components/chat-sidebar"
import { TabbedChatInterface } from "@/components/tabbed-chat-interface"

export default function Home() {
  const [selectedThreadId, setSelectedThreadId] = useState<string>("main")
  const [showContextPanel, setShowContextPanel] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleThreadSelect = (threadId: string, openInNewTab?: boolean) => {
    console.log(`App: Thread selected: ${threadId}, openInNewTab: ${openInNewTab}`)
    setSelectedThreadId(threadId)
  }

  return (
    <ThreadProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Left Sidebar */}
        <ChatSidebar
          selectedThreadId={selectedThreadId}
          onThreadSelect={handleThreadSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <TabbedChatInterface
            selectedThreadId={selectedThreadId}
            showContextPanel={showContextPanel}
            onToggleContext={() => setShowContextPanel(!showContextPanel)}
          />
        </div>
      </div>
    </ThreadProvider>
  )
}
