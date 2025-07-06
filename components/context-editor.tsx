"use client"

import { X, Settings, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useThreads } from "@/components/thread-provider"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ContextEditorProps {
  onClose: () => void
}

export function ContextEditor({ onClose }: ContextEditorProps) {
  const { threads, showInlineForks, setShowInlineForks } = useThreads()

  return (
    <div className="w-80 sm:w-96 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <Settings className="h-4 w-4 flex-shrink-0" />
          <h3 className="font-semibold truncate">Settings</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Display Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-medium">Show Inline Forks</p>
                  <p className="text-xs text-muted-foreground">
                    Display forked threads directly under messages (Discord style)
                  </p>
                </div>
                <Switch checked={showInlineForks} onCheckedChange={setShowInlineForks} className="flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          {/* Thread Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Thread Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {Object.values(threads).map((thread) => (
                  <div key={thread.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{thread.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{thread.messages.length} messages</span>
                          {thread.contextThreadIds.length > 0 && (
                            <span>• {thread.contextThreadIds.length} contexts</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={thread.level === 0 ? "default" : "secondary"} className="flex-shrink-0 ml-2">
                      L{thread.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Context Rules */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Context Rules</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="text-xs text-muted-foreground space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>Each thread automatically includes its own messages</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>Forked threads inherit context from their parent thread</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>Additional context can be manually added per thread</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>Context is combined chronologically for AI responses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{Object.keys(threads).length}</p>
                  <p className="text-xs text-muted-foreground">Total Threads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">
                    {Object.values(threads).reduce((sum, thread) => sum + thread.messages.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
