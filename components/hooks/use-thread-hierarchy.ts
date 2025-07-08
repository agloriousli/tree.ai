import { useThreads } from "@/components/thread-provider"
import type { Thread } from "@/components/thread-provider"

/**
 * Unified hook for thread hierarchy logic.
 *
 * Provides functions to traverse and query the thread tree:
 * - getChildThreads: Get direct children of a thread
 * - getParentThread: Get parent of a thread
 * - getRootThread: Get root ancestor of a thread
 * - getAllDescendants: Get all descendants of a thread (recursive)
 * - isAncestor: Check if a thread is an ancestor of another
 * - getAncestorThreadIds: Get all ancestor IDs (root first)
 */
export function useThreadHierarchy() {
  const { threads } = useThreads()

  // Get direct children of a thread
  const getChildThreads = (parentId: string): Thread[] =>
    Object.values(threads).filter((t) => t.parentThreadId === parentId)

  // Get parent of a thread
  const getParentThread = (threadId: string): Thread | undefined => {
    const thread = threads[threadId]
    return thread?.parentThreadId ? threads[thread.parentThreadId] : undefined
  }

  // Get root ancestor of a thread
  const getRootThread = (threadId: string): Thread | undefined => {
    let thread = threads[threadId]
    while (thread?.parentThreadId) {
      thread = threads[thread.parentThreadId]
    }
    return thread
  }

  // Get all descendants of a thread (recursive)
  const getAllDescendants = (threadId: string): Thread[] => {
    const children = getChildThreads(threadId)
    return children.concat(children.flatMap((child) => getAllDescendants(child.id)))
  }

  // Check if ancestorId is an ancestor of threadId
  const isAncestor = (ancestorId: string, threadId: string): boolean => {
    let thread = threads[threadId]
    while (thread?.parentThreadId) {
      if (thread.parentThreadId === ancestorId) return true
      thread = threads[thread.parentThreadId]
    }
    return false
  }

  // Get all ancestor IDs (root first)
  const getAncestorThreadIds = (threadId: string): string[] => {
    const ancestors: string[] = []
    let currentId: string | undefined = threadId
    while (currentId) {
      const thread: Thread | undefined = threads[currentId]
      if (thread && thread.parentThreadId) {
        ancestors.unshift(thread.parentThreadId)
        currentId = thread.parentThreadId
      } else {
        break
      }
    }
    return ancestors
  }

  return {
    getChildThreads,
    getParentThread,
    getRootThread,
    getAllDescendants,
    isAncestor,
    getAncestorThreadIds,
  }
} 