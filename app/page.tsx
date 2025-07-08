"use client"

import { useState, useEffect } from "react"
import { ThreadProvider, useThreads } from "@/components/thread-provider"
import { LeftSidebar } from "@/components/left-sidebar"
import { TabbedChatInterface } from "@/components/tabbed-chat-interface"
import { RightSidebar } from "@/components/right-sidebar"


function HomeContent() {
  const [selectedThreadId, setSelectedThreadId] = useState<string>("")
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { threads } = useThreads()

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

  const onToggleSettings = () => {
    setShowSettingsPanel(!showSettingsPanel)
  }

  return (
      <div className="flex h-screen bg-background overflow-hidden">
        <LeftSidebar
          selectedThreadId={selectedThreadId}
          onThreadSelect={handleThreadSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 flex min-w-0 overflow-hidden">
          <TabbedChatInterface
            selectedThreadId={selectedThreadId}
            showSettingsPanel={showSettingsPanel}
            onToggleSettings={onToggleSettings}
            onActiveThreadChange={handleActiveThreadChange}
          />

        </div>
        
        <RightSidebar
          showSettingsPanel={showSettingsPanel}
          selectedThreadId={selectedThreadId}
          onToggleSettings={onToggleSettings}
        />
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
