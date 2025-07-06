"use client"

import { MessageSquare, GitBranch, Settings, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function GettingStartedGuide() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Welcome to Threaded Chat! 🎉</h2>
        <p className="text-muted-foreground">Here's how to use the threaded conversation system:</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
              1. Start Chatting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Begin by typing a message in the input box below. The AI will respond, and you'll see your conversation in
              the main thread.
            </p>
            <Badge variant="outline">💡 Tip: Try asking "What can you help me with?"</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <GitBranch className="h-5 w-5 mr-2 text-green-500" />
              2. Fork Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Hover over any message and click the <strong>"Fork"</strong> button to create a new thread from that
              point. Perfect for exploring different topics!
            </p>
            <Badge variant="outline">🍴 Creates focused sub-conversations</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Plus className="h-5 w-5 mr-2 text-purple-500" />
              3. Navigate Threads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Use the sidebar on the left to switch between threads. Forked threads appear nested under their parent.
            </p>
            <Badge variant="outline">📁 Organized like a file tree</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Settings className="h-5 w-5 mr-2 text-orange-500" />
              4. Manage Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Click the <strong>"Context"</strong> button to control which threads the AI can see. Add context from
              other conversations!
            </p>
            <Badge variant="outline">🧠 Smart context control</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">Ready to start? Type your first message below! 👇</p>
      </div>
    </div>
  )
}
