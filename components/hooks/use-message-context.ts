/**
 * Unified hook for message context logic.
 * 
 * This hook consolidates message context checking logic that was previously
 * duplicated across multiple components. It provides consistent functions for:
 * - Checking if a message is in context
 * - Checking if a message is excluded from context
 * - Checking if a message was explicitly included in context
 * 
 * This eliminates code duplication and provides a single source of truth
 * for message context logic.
 */
import { useCallback } from "react"
import { useThreads } from "@/components/thread-provider"

export function useMessageContext(threadId: string) {
  const { threads, getThreadContext } = useThreads()
  const currentThread = threads[threadId]
  const contextMessages = getThreadContext(threadId)
  
  const isMessageInContext = useCallback((messageId: string) => {
    return contextMessages.some((msg) => msg.id === messageId)
  }, [contextMessages])
  
  const isMessageExcluded = useCallback((messageId: string) => {
    return currentThread?.excludedMessageIds.includes(messageId) || false
  }, [currentThread])
  
  const isMessageExplicitlyIncluded = useCallback((messageId: string) => {
    return currentThread?.contextMessageIds.includes(messageId) || false
  }, [currentThread])
  
  return { 
    isMessageInContext, 
    isMessageExcluded, 
    isMessageExplicitlyIncluded,
    contextMessages,
    currentThread
  }
} 