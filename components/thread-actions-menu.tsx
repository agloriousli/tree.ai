"use client"

import { useState } from "react"
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useThreads } from "@/components/thread-provider"

interface ThreadActionsMenuProps {
  threadId: string
  onThreadUpdate?: () => void
}

export function ThreadActionsMenu({ threadId, onThreadUpdate }: ThreadActionsMenuProps) {
  const { threads, updateThread, deleteThread, toggleThreadVisibility } = useThreads()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const thread = threads[threadId]
  if (!thread) return null

  const handleEdit = () => {
    setEditName(thread.name)
    setEditDescription(thread.description || "")
    setShowEditDialog(true)
  }

  const handleSaveEdit = () => {
    updateThread(threadId, {
      name: editName.trim() || "Untitled Thread",
      description: editDescription.trim() || undefined,
    })
    setShowEditDialog(false)
    onThreadUpdate?.()
  }

  const handleDelete = () => {
    deleteThread(threadId)
    setShowDeleteDialog(false)
    onThreadUpdate?.()
  }

  const handleToggleVisibility = () => {
    toggleThreadVisibility(threadId)
    onThreadUpdate?.()
  }

  const isMainThread = threadId === "main"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Thread
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleToggleVisibility}>
            {thread.isVisible !== false ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Thread
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Thread
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {!isMainThread && (
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Thread
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Thread</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-thread-name">Thread Name</Label>
              <Input
                id="edit-thread-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter thread name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-thread-description">Description (Optional)</Label>
              <Textarea
                id="edit-thread-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe what this thread is used for..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{thread.name}"? This action cannot be undone and will also delete all subthreads.
            </p>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDelete} variant="destructive">
                Delete Thread
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 