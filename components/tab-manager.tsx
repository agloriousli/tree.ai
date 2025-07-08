import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Plus } from "lucide-react"

interface TabManagerProps {
  tabs: string[] // Array of thread IDs
  curTab: string // Current active thread ID
  threads: Record<string, any> // Threads object to get names
  onTabSwitch: (threadId: string) => void
  onTabClose: (threadId: string, event?: React.MouseEvent) => void
  onCreateTab: () => void
}

export function TabManager({ 
  tabs, 
  curTab, 
  threads,
  onTabSwitch, 
  onTabClose, 
  onCreateTab 
}: TabManagerProps) {
  if (tabs.length === 0) return null

  return (
    <div className="border-b bg-background flex items-center overflow-x-auto">
      <ScrollArea className="flex-1">
        <div className="flex items-center min-w-max">
          {tabs.map((threadId) => {
            const thread = threads[threadId]
            const threadName = thread?.name || "Untitled Thread"
            
            return (
              <div key={threadId} className="flex items-center border-r">
                <Button
                  variant={threadId === curTab ? "secondary" : "ghost"}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onTabSwitch(threadId)
                  }}
                  className="rounded-none h-12 px-4 justify-start min-w-[120px] max-w-[200px]"
                >
                  <span className="truncate">{threadName}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onTabClose(threadId, e)
                  }}
                  className="h-12 w-8 p-0 rounded-none hover:bg-destructive/10 hover:text-destructive z-20"
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCreateTab()
            }}
            className="h-12 w-10 p-0 rounded-none"
            title="Create new thread"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
} 