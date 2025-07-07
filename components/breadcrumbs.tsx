"use client"

import { ChevronRight, Home } from "lucide-react"
import { useThreads, Thread } from "@/components/thread-provider"
import { Button } from "@/components/ui/button"

interface BreadcrumbsProps {
  threadId: string
}

export function Breadcrumbs({ threadId }: BreadcrumbsProps) {
  const { threads } = useThreads()

  const getBreadcrumbPath = (threadId: string): string[] => {
    const path: string[] = []
    let currentThread: Thread | undefined = threads[threadId]

    while (currentThread) {
      path.unshift(currentThread.id)
      const parentId: string | undefined = currentThread.parentThreadId
      currentThread = parentId ? threads[parentId] : undefined
    }

    return path
  }

  const breadcrumbPath = getBreadcrumbPath(threadId)

  if (breadcrumbPath.length <= 1) {
    return null
  }

  return (
    <div className="border-b bg-muted/30 px-4 py-2">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        {breadcrumbPath.map((pathThreadId, index) => {
          const thread = threads[pathThreadId]
          const isLast = index === breadcrumbPath.length - 1

          return (
            <div key={pathThreadId} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="h-3 w-3" />}
              <Button
                variant="ghost"
                size="sm"
                className={`h-auto p-1 text-sm ${isLast ? "text-foreground font-medium cursor-default" : "hover:text-foreground"}`}
                disabled={isLast}
              >
                {thread?.name || "Unknown Thread"}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
