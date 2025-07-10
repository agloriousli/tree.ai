/**
 * Custom hook for handling message sending and AI response generation.
 * 
 * This hook manages:
 * - User message processing (regular messages and commands)
 * - AI response generation with streaming
 * - Loading states during message processing
 * - Error handling for failed AI requests
 * - Context management for thread conversations
 * 
 * Separates message handling logic from UI components for better maintainability.
 */
import { useState, useCallback } from "react"
import { generateResponse } from "@/lib/ai"

export function useMessageHandler(
  addMessage: (threadId: string, content: string, role: "user" | "assistant") => string,
  editMessage: (messageId: string, content: string) => void,
  getThreadContext: (threadId: string) => any[],
  showThinkingMode: boolean,
  temperature: number,
  maxTokens: number
) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = useCallback(async (userMessage: string, activeThreadId: string) => {
    if (!userMessage.trim()) return
    
    setIsLoading(true)
    try {
      // Regular message
      // Add user message first
      addMessage(activeThreadId, userMessage, "user")

      // Get existing context for this thread
      const existingContextMessages = getThreadContext(activeThreadId)
      
      // Create the user message object to include in context
      const userMessageObj = {
        role: "user" as const,
        content: userMessage,
      }
      
      // Convert existing context to simple format and combine with new user message
      const contextMessages = [
        ...existingContextMessages.map(msg => ({ role: msg.role, content: msg.content })),
        userMessageObj
      ]

      // Create a temporary message for streaming
      const tempMessageId = addMessage(activeThreadId, "", "assistant")
      let accumulatedContent = ""

      // Generate AI response with streaming
      await generateResponse(contextMessages, (chunk) => {
        accumulatedContent += chunk
        editMessage(tempMessageId, accumulatedContent)
      }, showThinkingMode, temperature || 0.3, maxTokens || 8000)
    } catch (error) {
      console.error("Error generating response:", error)
      addMessage(activeThreadId, "Sorry, I encountered an error generating a response.", "assistant")
    } finally {
      setIsLoading(false)
    }
  }, [addMessage, editMessage, getThreadContext, showThinkingMode, temperature, maxTokens])

  return {
    handleSend,
    isLoading,
  }
} 