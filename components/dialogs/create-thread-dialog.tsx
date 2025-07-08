/**
 * Reusable dialog component for creating new threads.
 * 
 * This component provides:
 * - Form for thread name and description input
 * - Thread type selection (main thread or subthread)
 * - Parent thread selection for subthreads
 * - Form validation and submission handling
 * - Consistent UI for thread creation across the app
 * 
 * Used in both the main chat interface and sidebar for creating new threads.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface CreateThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  threadName: string
  threadDescription: string
  threadType: "main" | "sub"
  parentThreadId: string
  availableThreads: any[]
  onThreadNameChange: (name: string) => void
  onThreadDescriptionChange: (description: string) => void
  onThreadTypeChange: (type: "main" | "sub") => void
  onParentThreadChange: (threadId: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function CreateThreadDialog({
  open,
  onOpenChange,
  threadName,
  threadDescription,
  threadType,
  parentThreadId,
  availableThreads,
  onThreadNameChange,
  onThreadDescriptionChange,
  onThreadTypeChange,
  onParentThreadChange,
  onSubmit,
  disabled = false
}: CreateThreadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={threadName}
              onChange={(e) => onThreadNameChange(e.target.value)}
              placeholder="Enter thread name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thread-type">Thread Type</Label>
            <Select value={threadType} onValueChange={(value: "main" | "sub") => onThreadTypeChange(value)}>
              <SelectTrigger id="thread-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Thread</SelectItem>
                <SelectItem value="sub">Subthread</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {threadType === "sub" && (
            <div className="space-y-2">
              <Label htmlFor="parent-thread">Parent Thread</Label>
              <Select value={parentThreadId} onValueChange={onParentThreadChange}>
                <SelectTrigger id="parent-thread">
                  <SelectValue placeholder="Select parent thread..." />
                </SelectTrigger>
                <SelectContent>
                  {availableThreads
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
              value={threadDescription}
              onChange={(e) => onThreadDescriptionChange(e.target.value)}
              placeholder="Describe what this thread will be used for..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={disabled || (threadType === "sub" && !parentThreadId)}>
              Create Thread
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 