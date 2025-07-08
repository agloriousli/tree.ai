/**
 * Unified hook for thread creation operations.
 * 
 * This hook consolidates all thread creation logic into a single, consistent API.
 * It provides semantic function names for different creation scenarios:
 * - createMainThread: Create a new main thread
 * - createSubthread: Create a subthread from a parent thread
 * - createFromText: Create thread from selected text
 * - createFromMessage: Create thread by forking a message
 * - createFromCommand: Create thread from command execution
 * 
 * This eliminates the scattered createThread calls and provides a cleaner interface.
 */
import { useCallback } from "react"
import { useThreads } from "@/components/thread-provider"
import type { Command } from "@/lib/commands"

export function useThreadCreation() {
  const { createThread } = useThreads()
  
  const createMainThread = useCallback((name: string, description?: string) => {
    return createThread({
      type: 'complex',
      name: name || 'Untitled Thread',
      description,
      isSubthread: false
    })
  }, [createThread])
  
  const createSubthread = useCallback((options: {
    name: string
    description?: string
    parentThreadId: string
  }) => {
    return createThread({
      type: 'complex',
      name: options.name || 'Untitled Thread',
      description: options.description,
      parentThreadId: options.parentThreadId,
      isSubthread: true
    })
  }, [createThread])
  
  const createFromText = useCallback((options: {
    text: string
    parentThreadId?: string
    isMainThread?: boolean
  }) => {
    return createThread({
      type: 'quick',
      selectedText: options.text,
      parentThreadId: options.parentThreadId,
      isSubthread: !options.isMainThread
    })
  }, [createThread])
  
  const createFromMessage = useCallback((options: {
    messageId: string
    name?: string
  }) => {
    return createThread({
      type: 'quick',
      sourceMessageId: options.messageId,
      name: options.name,
      isSubthread: true
    })
  }, [createThread])
  
  const createFromCommand = useCallback((options: {
    command: Command
    selectedText: string
    parentThreadId: string
  }) => {
    return createThread({
      type: 'quick',
      name: `[${options.command.name}] ${options.selectedText.slice(0, 30)}...`,
      selectedText: options.selectedText,
      parentThreadId: options.parentThreadId,
      isSubthread: true
    })
  }, [createThread])
  
  return {
    createMainThread,
    createSubthread,
    createFromText,
    createFromMessage,
    createFromCommand
  }
} 