/**
 * Reusable dialog component for editing existing threads.
 * 
 * This component provides:
 * - Form for updating thread name and description
 * - Pre-populated fields with current thread data
 * - Form validation and submission handling
 * - Consistent UI for thread editing across the app
 * 
 * Used in the main chat interface for editing thread properties.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface EditThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  threadName: string
  threadDescription: string
  onThreadNameChange: (name: string) => void
  onThreadDescriptionChange: (description: string) => void
  onSubmit: () => void
}

export function EditThreadDialog({
  open,
  onOpenChange,
  threadName,
  threadDescription,
  onThreadNameChange,
  onThreadDescriptionChange,
  onSubmit
}: EditThreadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Thread</DialogTitle>
          <DialogDescription>
            Update the name and description of this thread.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-thread-name">Thread Name</Label>
            <Input
              id="edit-thread-name"
              value={threadName}
              onChange={(e) => onThreadNameChange(e.target.value)}
              placeholder="Enter thread name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-thread-description">Description (Optional)</Label>
            <Textarea
              id="edit-thread-description"
              value={threadDescription}
              onChange={(e) => onThreadDescriptionChange(e.target.value)}
              placeholder="Describe what this thread is used for..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 