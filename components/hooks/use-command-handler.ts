/**
 * Custom hook for handling command execution from contextual selection menu.
 * 
 * This hook manages:
 * - Command execution with selected text
 * - Automatic subthread creation for command results
 * - AI response generation for command processing
 * - Thread naming based on command and selected content
 * - Tab opening for new command threads
 * 
 * Provides a clean interface for command operations without cluttering the main component.
 */
import { useCallback } from "react"
import { generateResponse } from "@/lib/ai"
import { useThreadCreation } from "@/components/hooks/use-thread-creation"

export function useCommandHandler(
  addMessage: (threadId: string, content: string, role: "user" | "assistant") => string,
  editMessage: (messageId: string, content: string) => void,
  getThreadContext: (threadId: string) => any[],
  openThreadInNewTab: (threadId: string) => string,
  showThinkingMode: boolean,
  temperature: number,
  maxTokens: number
) {
  const { createThread } = useThreadCreation()

  const handleCommandExecute = useCallback(async (command: any, selectedText: string, activeThreadId: string) => {
    // Create a new subthread with the command name and selected content
    const newThreadId = createThread({
      type: 'command',
      command,
      selectedText,
      parentThreadId: activeThreadId
    })
    
    // Only proceed if thread was created successfully
    if (!newThreadId) {
      console.error('Failed to create command thread')
      return
    }
    
    // Execute command with selected text
    const commandPrompt = command.prompt.replace('{text}', selectedText)
    
    // Add user message showing the command
    const userMessage = `\\${command.name} ${selectedText}`
    addMessage(newThreadId, userMessage, "user")

    // Get existing context for this thread (include parent thread context)
    const existingContextMessages = getThreadContext(newThreadId)
    
    // Create the command message object to include in context
    const commandMessageObj = {
      role: "user" as const,
      content: commandPrompt,
    }
    
    // Convert existing context to simple format and combine with command message
    const contextMessages = [
      ...existingContextMessages.map(msg => ({ role: msg.role, content: msg.content })),
      commandMessageObj
    ]

    // Create a temporary message for streaming
    const tempMessageId = addMessage(newThreadId, "", "assistant")
    let accumulatedContent = ""

    // Generate AI response with streaming
    await generateResponse(contextMessages, (chunk) => {
      // Accumulate chunks and update the message
      accumulatedContent += chunk
      editMessage(tempMessageId, accumulatedContent)
    }, showThinkingMode, temperature || 0.3, maxTokens || 8000)

    // Open the new subthread in a new tab
    openThreadInNewTab(newThreadId)
  }, [addMessage, editMessage, getThreadContext, openThreadInNewTab, showThinkingMode, temperature, maxTokens, createThread])

  return {
    handleCommandExecute,
  }
} 