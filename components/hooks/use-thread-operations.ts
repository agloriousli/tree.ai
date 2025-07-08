/**
 * Custom hook for managing thread creation and editing operations.
 * 
 * This hook handles:
 * - Thread creation form state management (main threads and subthreads)
 * - Thread editing (name and description updates)
 * - Dialog state management for create/edit forms
 * - Form validation and submission
 * - Pending thread state for async operations
 * 
 * Centralizes thread operation logic and provides a clean interface for thread management.
 */
import { useState, useCallback } from "react"
import { useThreadCreation } from "@/components/hooks/use-thread-creation"

export function useThreadOperations(
  updateThread: (threadId: string, updates: any) => void
) {
  const { createThread } = useThreadCreation()
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false)
  const [showEditThreadDialog, setShowEditThreadDialog] = useState(false)
  const [newThreadName, setNewThreadName] = useState("Untitled Thread")
  const [newThreadDescription, setNewThreadDescription] = useState("")
  const [newThreadType, setNewThreadType] = useState<"main" | "sub">("main")
  const [parentThreadId, setParentThreadId] = useState("")
  const [editThreadName, setEditThreadName] = useState("")
  const [editThreadDescription, setEditThreadDescription] = useState("")
  const [pendingNewThreadId, setPendingNewThreadId] = useState<string | null>(null)

  const handleSubmitCreateThreadForm = useCallback(() => {
    // Use "Untitled Thread" as default name if empty
    const threadName = newThreadName.trim() || "Untitled Thread"

    let newThreadId: string | null

    if (newThreadType === "main") {
      newThreadId = createThread({
        type: 'main',
        name: threadName || 'Untitled Thread',
        description: newThreadDescription
      })
    } else {
      newThreadId = createThread({
        type: 'sub',
        name: threadName || 'Untitled Thread',
        description: newThreadDescription,
        parentThreadId: parentThreadId || undefined
      })
    }

    // Only proceed if thread was created successfully
    if (newThreadId) {
      // Reset form
      setNewThreadName("")
      setNewThreadDescription("")
      setNewThreadType("main")
      setParentThreadId("")
      setShowNewThreadDialog(false)

      // Set the pending thread ID - the parent component will handle opening it
      setPendingNewThreadId(newThreadId)
    }
  }, [newThreadName, newThreadDescription, newThreadType, parentThreadId, createThread])

  const handleEditThread = useCallback((threadId: string, currentThread: any) => {
    if (!currentThread) return

    // Update the thread
    updateThread(threadId, {
      name: editThreadName.trim() || currentThread.name,
      description: editThreadDescription.trim() || undefined,
    })

    // Reset form and close dialog
    setEditThreadName("")
    setEditThreadDescription("")
    setShowEditThreadDialog(false)
  }, [editThreadName, editThreadDescription, updateThread])

  const openCreateThreadDialog = useCallback(() => {
    setNewThreadName("Untitled Thread")
    setNewThreadDescription("")
    setNewThreadType("main")
    setParentThreadId("")
    setShowNewThreadDialog(true)
  }, [])

  const openEditThreadDialog = useCallback((thread: any) => {
    if (!thread) return
    
    setEditThreadName(thread.name)
    setEditThreadDescription(thread.description || "")
    setShowEditThreadDialog(true)
  }, [])

  const resetPendingThread = useCallback(() => {
    setPendingNewThreadId(null)
  }, [])

  return {
    // State
    showNewThreadDialog,
    showEditThreadDialog,
    newThreadName,
    newThreadDescription,
    newThreadType,
    parentThreadId,
    editThreadName,
    editThreadDescription,
    pendingNewThreadId,
    
    // Setters
    setShowNewThreadDialog,
    setShowEditThreadDialog,
    setNewThreadName,
    setNewThreadDescription,
    setNewThreadType,
    setParentThreadId,
    setEditThreadName,
    setEditThreadDescription,
    setPendingNewThreadId,
    
    // Actions
    handleSubmitCreateThreadForm,
    handleEditThread,
    openCreateThreadDialog,
    openEditThreadDialog,
    resetPendingThread,
  }
} 