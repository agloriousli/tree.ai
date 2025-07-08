/**
 * Unified hook for thread creation operations.
 * 
 * This hook consolidates all thread creation logic into a single, consistent API.
 * It provides a unified createThread function that handles all creation scenarios:
 * - type: 'main' - Create a new main thread
 * - type: 'sub' - Create a subthread from a parent thread
 * - type: 'text' - Create thread from selected text
 * - type: 'message' - Create thread by forking a message
 * - type: 'command' - Create thread from command execution
 * - type: 'dialog' - Open dialog for complex thread creation
 * 
 * This eliminates the scattered createThread calls and provides a cleaner interface.
 */
import { useCallback } from "react"
import { useThreads } from "@/components/thread-provider"
import type { Command } from "@/lib/commands"

export function useThreadCreation() {
  const { createThread: createThreadBase } = useThreads()
  
  const createThread = useCallback((options: {
    type: 'main' | 'sub' | 'text' | 'message' | 'command' | 'dialog'
    name?: string
    description?: string
    content?: string
    parentThreadId?: string
    isMainThread?: boolean
    sourceMessageId?: string
    selectedText?: string
    command?: Command
  }): string | null => {
    switch (options.type) {
      case 'main':
        return createThreadBase({
          type: 'complex',
          name: options.name || 'Untitled Thread',
          description: options.description,
          isSubthread: false
        })
        
      case 'sub':
        return createThreadBase({
          type: 'complex', 
          name: options.name || 'Untitled Thread',
          description: options.description,
          parentThreadId: options.parentThreadId,
          isSubthread: true
        })
        
      case 'text':
        return createThreadBase({
          type: 'quick',
          selectedText: options.selectedText,
          parentThreadId: options.parentThreadId,
          isSubthread: !options.isMainThread
        })
        
      case 'message':
        return createThreadBase({
          type: 'quick',
          sourceMessageId: options.sourceMessageId,
          name: options.name,
          isSubthread: true
        })
        
      case 'command':
        return createThreadBase({
          type: 'quick',
          name: `[${options.command?.name}] ${options.selectedText?.slice(0, 30)}...`,
          selectedText: options.selectedText,
          parentThreadId: options.parentThreadId,
          isSubthread: true
        })
        
      case 'dialog':
        // This would need to be handled by the calling component
        // since it involves opening a UI dialog
        return null
        
      default:
        throw new Error(`Unknown thread creation type: ${(options as { type: string }).type}`)
    }
  }, [createThreadBase])
  
  return { createThread }
} 