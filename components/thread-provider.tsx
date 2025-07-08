"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { generateId } from "@/lib/utils"
import { storageManager } from "@/lib/storage"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  threadId: string
  parentMessageId?: string
  forkIds?: string[]
  isEdited?: boolean
  editHistory?: string[]
  isSeed?: boolean
}

export interface Thread {
  id: string
  name: string
  parentThreadId?: string
  rootMessageId?: string
  messages: Message[]
  contextThreadIds: string[]
  contextMessageIds: string[]
  excludedMessageIds: string[]
  level: number
  isVisible?: boolean
  isMainThread?: boolean
  description?: string
  subThreads: string[] // Array of direct subthread IDs
}

// Thread creation types
export type ThreadCreationType = 'auto' | 'quick' | 'complex'

export interface ThreadCreationOptions {
  type: ThreadCreationType
  name?: string
  description?: string
  parentThreadId?: string
  rootMessageId?: string
  selectedText?: string
  sourceMessageId?: string
  isSubthread?: boolean
}

interface ThreadContextType {
  threads: Record<string, Thread>
  messages: Record<string, Message>
  showInlineForks: boolean
  setShowInlineForks: (show: boolean) => void
  showThinkingMode: boolean
  setShowThinkingMode: (show: boolean) => void
  maxContextMessages: number | null
  setMaxContextMessages: (max: number | null) => void
  temperature: number
  setTemperature: (temp: number) => void
  maxTokens: number
  setMaxTokens: (tokens: number) => void

  // Unified thread creation
  createThread: (options: ThreadCreationOptions) => string
  
  // Legacy functions for backward compatibility
  createMainThread: (name: string, description?: string) => string
  createThreadFromText: (text: string, parentThreadId: string | null, isSubthread: boolean) => string
  
  addMessage: (threadId: string, content: string, role: "user" | "assistant") => string
  editMessage: (messageId: string, newContent: string) => void
  deleteMessage: (messageId: string) => void
  deleteThread: (threadId: string) => void
  updateThread: (threadId: string, updates: Partial<Pick<Thread, 'name' | 'description' | 'isVisible'>>) => void
  forkMessage: (messageId: string, threadName?: string) => string
  addContextThread: (threadId: string, contextThreadId: string) => void
  removeContextThread: (threadId: string, contextThreadId: string) => void
  addContextMessage: (threadId: string, messageId: string) => void
  removeContextMessage: (threadId: string, messageId: string) => void
  excludeMessageFromThread: (threadId: string, messageId: string) => void
  includeMessageInThread: (threadId: string, messageId: string) => void
  getThreadContext: (threadId: string) => Message[]
  getMessageForks: (messageId: string) => Thread[]
  toggleThreadVisibility: (threadId: string) => void
  getMainThreads: () => Thread[]
  getThreadHierarchy: (threadId: string) => Thread[]
  getAllMessages: () => Message[]
  exportData: () => string
  importData: (jsonData: string) => void
  downloadBackup: () => void
  uploadBackup: (file: File) => Promise<void>
  clearAllData: () => void
  getStorageInfo: () => { size: string; lastSaved: string | null; itemCount: number }
}

const ThreadContext = createContext<ThreadContextType | null>(null)

// Utility to auto-name thread from text
function generateThreadName(text: string): string {
  return text.length > 40 ? text.slice(0, 40) + "…" : text
}

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<Record<string, Thread>>({})
  const [messages, setMessages] = useState<Record<string, Message>>({})
  const [showInlineForks, setShowInlineForks] = useState(true)
  const [showThinkingMode, setShowThinkingMode] = useState(false)
  const [maxContextMessages, setMaxContextMessages] = useState<number | null>(15)
  const [temperature, setTemperature] = useState(0.3)
  const [maxTokens, setMaxTokens] = useState(8000)


  // Auto-save data whenever it changes
  useEffect(() => {
    if (Object.keys(threads).length > 0) {
      storageManager.saveData(threads, messages, {
        showInlineForks,
        showThinkingMode,
        maxContextMessages,
        temperature,
        maxTokens,
      })
    }
  }, [threads, messages, showInlineForks, showThinkingMode, maxContextMessages])

  // Load data from storage on startup
  useEffect(() => {
    const savedData = storageManager.loadData()
    if (savedData) {
      setThreads(savedData.threads)
      setMessages(savedData.messages)
      setShowInlineForks(savedData.settings.showInlineForks)
      setShowThinkingMode(savedData.settings.showThinkingMode)
      setMaxContextMessages(savedData.settings.maxContextMessages)
      setTemperature(savedData.settings.temperature || 0.3)
      setMaxTokens(savedData.settings.maxTokens || 8000)
      console.log('Data loaded from storage')
    } 
  }, [])

  // Unified thread creation function - single point of entry for all thread creation
  const createThread = useCallback(
    (options: ThreadCreationOptions): string => {
      const { type, name, description, parentThreadId, rootMessageId, selectedText, sourceMessageId, isSubthread } = options
      
      const threadId = generateId('thread')
      const parentLevel = parentThreadId ? threads[parentThreadId]?.level || 0 : 0
      const isMainThread = type === 'auto' || (!parentThreadId && !isSubthread)

      let threadName: string
      let initialMessages: Message[] = []

      switch (type) {
        case 'auto':
          // Auto create: Sample thread for new users
          threadName = "Sample Thread"
          break

        case 'quick':
          // Quick create: From selected text, forking, or commands
          if (selectedText) {
            threadName = generateThreadName(selectedText)
            // Add selected text as a user message (but don't send to LLM)
            const messageId = generateId('msg')
            const seedMessage: Message = {
              id: messageId,
              content: selectedText,
              role: "user",
              timestamp: new Date(),
              threadId,
              isSeed: true, // Flag to prevent sending to LLM
            }
            initialMessages = [seedMessage]
            setMessages(prev => ({ ...prev, [messageId]: seedMessage }))
          } else if (name) {
            threadName = name
          } else {
            threadName = "Untitled Thread"
          }
          break

        case 'complex':
          // Complex create: User-defined name and description
          threadName = name || "Untitled Thread"
          break

        default:
          throw new Error(`Invalid thread creation type: ${type}`)
      }

      const newThread: Thread = {
        id: threadId,
        name: threadName,
        description,
        parentThreadId,
        rootMessageId,
        messages: initialMessages,
        contextThreadIds: parentThreadId && !isMainThread ? [parentThreadId] : [],
        contextMessageIds: [],
        excludedMessageIds: [],
        level: isMainThread ? 0 : parentLevel + 1,
        isVisible: true,
        isMainThread,
        subThreads: [],
      }

      setThreads((prev) => {
        const updatedThreads = {
        ...prev,
        [threadId]: newThread,
        }

        // Update parent thread's subThreads array
        if (parentThreadId && prev[parentThreadId]) {
          updatedThreads[parentThreadId] = {
            ...prev[parentThreadId],
            subThreads: [...prev[parentThreadId].subThreads, threadId],
          }
        }

        return updatedThreads
      })

      return threadId
    },
    [threads],
  )

  const createMainThread = useCallback(
    (name: string, description?: string): string => {
      const threadId = createThread({ type: 'auto', name, description, isSubthread: true })

      setThreads((prev) => ({
        ...prev,
        [threadId]: {
          ...prev[threadId],
          description,
        },
      }))

      return threadId
    },
    [createThread],
  )

  const addMessage = useCallback((threadId: string, content: string, role: "user" | "assistant"): string => {
    const messageId = generateId('msg')

    const newMessage: Message = {
      id: messageId,
      content,
      role,
      timestamp: new Date(),
      threadId,
      forkIds: [],
    }

    setMessages((prev) => ({
      ...prev,
      [messageId]: newMessage,
    }))

    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        messages: [...prev[threadId].messages, newMessage],
      },
    }))

    return messageId
  }, [])

  const editMessage = useCallback((messageId: string, newContent: string) => {
    setMessages((prev) => {
      const message = prev[messageId]
      if (!message) return prev

      return {
        ...prev,
        [messageId]: {
          ...message,
          content: newContent,
          isEdited: true,
          editHistory: [...(message.editHistory || [message.content])],
        },
      }
    })

    setThreads((prev) => {
      const updatedThreads = { ...prev }
      Object.keys(updatedThreads).forEach((threadId) => {
        const thread = updatedThreads[threadId]
        const messageIndex = thread.messages.findIndex((msg) => msg.id === messageId)
        if (messageIndex !== -1) {
          updatedThreads[threadId] = {
            ...thread,
            messages: thread.messages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    content: newContent,
                    isEdited: true,
                    editHistory: [...(msg.editHistory || [msg.content])],
                  }
                : msg,
            ),
          }
        }
      })
      return updatedThreads
    })
  }, [])

  const deleteMessage = useCallback(
    (messageId: string) => {
      const message = messages[messageId]
      if (!message) return

      setMessages((prev) => {
        const newMessages = { ...prev }
        delete newMessages[messageId]
        return newMessages
      })

      setThreads((prev) => ({
        ...prev,
        [message.threadId]: {
          ...prev[message.threadId],
          messages: prev[message.threadId].messages.filter((msg) => msg.id !== messageId),
        },
      }))
    },
    [messages],
  )

  const updateThread = useCallback(
    (threadId: string, updates: Partial<Pick<Thread, 'name' | 'description' | 'isVisible'>>) => {
      const thread = threads[threadId]
      if (!thread) return

      setThreads((prev) => ({
        ...prev,
        [threadId]: {
          ...prev[threadId],
          ...updates,
        },
      }))
    },
    [threads],
  )

  const deleteThread = useCallback(
    (threadId: string) => {
      const thread = threads[threadId]
      if (!thread) return

      if (threadId === "main") {
        console.warn("Cannot delete the main thread")
        return
      }

      thread.messages.forEach((message) => {
        setMessages((prev) => {
          const newMessages = { ...prev }
          delete newMessages[message.id]
          return newMessages
        })
      })

      const childThreadIds = Object.values(threads)
        .filter((t): t is Thread => t.parentThreadId === threadId)
        .map((t) => t.id)

      childThreadIds.forEach((childId) => {
        const childThread = threads[childId]
        if (childThread) {
          childThread.messages.forEach((message) => {
            setMessages((prev) => {
              const newMessages = { ...prev }
              delete newMessages[message.id]
              return newMessages
            })
          })
        }
      })

      setThreads((prev) => {
        const newThreads = { ...prev }
        delete newThreads[threadId]
        childThreadIds.forEach((childId) => {
          delete newThreads[childId]
        })
        return newThreads
      })
    },
    [threads],
  )

  const forkMessage = useCallback(
    (messageId: string, threadName?: string): string => {
      const message = messages[messageId]
      if (!message) return ""

      const defaultName = threadName || `Fork: ${message.content.slice(0, 30)}...`
      const newThreadId = createThread({ type: 'auto', name: defaultName, isSubthread: true })

      setMessages((prev) => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          forkIds: [...(prev[messageId].forkIds || []), newThreadId],
        },
      }))

      return newThreadId
    },
    [messages, createThread],
  )

  const addContextThread = useCallback((threadId: string, contextThreadId: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        contextThreadIds: [...prev[threadId].contextThreadIds.filter((id) => id !== contextThreadId), contextThreadId],
      },
    }))
  }, [])

  const removeContextThread = useCallback((threadId: string, contextThreadId: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        contextThreadIds: prev[threadId].contextThreadIds.filter((id) => id !== contextThreadId),
      },
    }))
  }, [])

  const addContextMessage = useCallback((threadId: string, messageId: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        contextMessageIds: [...prev[threadId].contextMessageIds.filter((id) => id !== messageId), messageId],
        excludedMessageIds: prev[threadId].excludedMessageIds.filter((id) => id !== messageId),
      },
    }))
  }, [])

  const removeContextMessage = useCallback((threadId: string, messageId: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        contextMessageIds: prev[threadId].contextMessageIds.filter((id) => id !== messageId),
      },
    }))
  }, [])

  const excludeMessageFromThread = useCallback((threadId: string, messageId: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        excludedMessageIds: [...prev[threadId].excludedMessageIds.filter((id) => id !== messageId), messageId],
        contextMessageIds: prev[threadId].contextMessageIds.filter((id) => id !== messageId),
      },
    }))
  }, [])

  const includeMessageInThread = useCallback((threadId: string, messageId: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        excludedMessageIds: prev[threadId].excludedMessageIds.filter((id) => id !== messageId),
      },
    }))
  }, [])

  const getThreadHierarchy = useCallback(
    (threadId: string): Thread[] => {
      const hierarchy: Thread[] = []
      let currentThread: Thread | undefined = threads[threadId]

      while (currentThread) {
        hierarchy.unshift(currentThread)
        const parentId: string | undefined = currentThread.parentThreadId
        currentThread = parentId ? threads[parentId] : undefined
      }

      return hierarchy
    },
    [threads],
  )

  const getThreadContext = useCallback(
    (threadId: string): Message[] => {
      const thread = threads[threadId]
      if (!thread) return []

      const contextMessages: Message[] = []

      // 1. Add messages from current thread
      contextMessages.push(...thread.messages)

      // 2. Add messages from parent hierarchy (automatic inheritance)
      const hierarchy = getThreadHierarchy(threadId)
      hierarchy.slice(0, -1).forEach((parentThread) => {
        contextMessages.push(...parentThread.messages)
      })

      // 3. Add messages from additional context threads (manual selection)
      thread.contextThreadIds
        .filter((id) => !hierarchy.some((h) => h.id === id)) // Avoid duplicates from hierarchy
        .forEach((contextThreadId) => {
          const contextThread = threads[contextThreadId]
          if (contextThread) {
            contextMessages.push(...contextThread.messages)
          }
        })

      // 4. Add specific context messages (from any thread)
      thread.contextMessageIds.forEach((messageId) => {
        const message = messages[messageId]
        if (message && !contextMessages.some((m) => m.id === messageId)) {
          contextMessages.push(message)
        }
      })

      // 5. Remove excluded messages (specific to this thread)
      const filteredMessages = contextMessages.filter((msg) => !thread.excludedMessageIds.includes(msg.id))

      // Sort by timestamp and remove duplicates
      const uniqueMessages = filteredMessages.filter(
        (msg, index, arr) => arr.findIndex((m) => m.id === msg.id) === index,
      )

      const sortedMessages = uniqueMessages.sort((a, b) => {
        // Ensure timestamps are Date objects and handle invalid dates
        const timestampA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp)
        const timestampB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp)
        
        // Handle invalid dates by using current time
        const timeA = isNaN(timestampA.getTime()) ? Date.now() : timestampA.getTime()
        const timeB = isNaN(timestampB.getTime()) ? Date.now() : timestampB.getTime()
        
        return timeA - timeB
      })
      
      // 6. Smart context limiting that prioritizes user selections
      if (maxContextMessages && sortedMessages.length > maxContextMessages) {
        console.log(`Context too long (${sortedMessages.length} messages), applying smart limiting`)
      
        const currentThreadMessages = thread.messages
        const explicitContextMessages = thread.contextMessageIds
          .map(id => messages[id])
          .filter(msg => msg && sortedMessages.some(m => m.id === msg.id))
        
        // Start with current thread messages
        const prioritizedMessages: Message[] = [...currentThreadMessages]
        
        // Add explicitly selected context messages
        explicitContextMessages.forEach(msg => {
          if (!prioritizedMessages.some(m => m.id === msg.id)) {
            prioritizedMessages.push(msg)
          }
        })
        
        // If we still have room, add parent hierarchy messages (most recent first)
        const parentMessages = sortedMessages.filter(msg => 
          !prioritizedMessages.some(m => m.id === msg.id) &&
          hierarchy.slice(0, -1).some(parent => parent.messages.some(pm => pm.id === msg.id))
        )
        
        prioritizedMessages.push(...parentMessages.slice(-(maxContextMessages - prioritizedMessages.length)))
        
        // If we still have room, add additional context thread messages
        let additionalContextMessages: Message[] = []
        if (prioritizedMessages.length < maxContextMessages) {
          additionalContextMessages = sortedMessages.filter(msg => 
            !prioritizedMessages.some(m => m.id === msg.id) &&
            thread.contextThreadIds.some(contextThreadId => {
              const contextThread = threads[contextThreadId]
              return contextThread && contextThread.messages.some(cm => cm.id === msg.id)
            })
          )
          
          prioritizedMessages.push(...additionalContextMessages.slice(-(maxContextMessages - prioritizedMessages.length)))
        }
        
        // Sort by timestamp to maintain conversation flow
        const finalMessages = prioritizedMessages.sort((a, b) => {
          // Ensure timestamps are Date objects and handle invalid dates
          const timestampA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp)
          const timestampB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp)
          
          // Handle invalid dates by using current time
          const timeA = isNaN(timestampA.getTime()) ? Date.now() : timestampA.getTime()
          const timeB = isNaN(timestampB.getTime()) ? Date.now() : timestampB.getTime()
          
          return timeA - timeB
        })
        
        console.log(`Smart context limiting applied: ${finalMessages.length} messages`)
        console.log(`- Current thread: ${currentThreadMessages.length} messages`)
        console.log(`- Explicit context: ${explicitContextMessages.length} messages`)
        console.log(`- Parent hierarchy: ${parentMessages.length} messages`)
        console.log(`- Additional context: ${additionalContextMessages.length} messages`)
        
        return finalMessages
      }
      
      return sortedMessages
    },
    [threads, getThreadHierarchy, messages, maxContextMessages],
  )

  const getMessageForks = useCallback(
    (messageId: string): Thread[] => {
      const message = messages[messageId]
      if (!message || !message.forkIds) return []

      return message.forkIds.map((forkId) => threads[forkId]).filter((thread): thread is Thread => thread !== undefined)
    },
    [messages, threads],
  )

  const toggleThreadVisibility = useCallback((threadId: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        isVisible: !prev[threadId].isVisible,
      },
    }))
  }, [])

  const getMainThreads = useCallback((): Thread[] => {
    return Object.values(threads).filter((thread) => thread.isMainThread)
  }, [threads])

  const getAllMessages = useCallback((): Message[] => {
    return Object.values(messages)
  }, [messages])

  const exportData = useCallback((): string => {
    return storageManager.exportData()
  }, [])

  const importData = useCallback((jsonData: string): void => {
    const importedData = storageManager.importData(jsonData)
    setThreads(importedData.threads)
    setMessages(importedData.messages)
    setShowInlineForks(importedData.settings.showInlineForks)
    setShowThinkingMode(importedData.settings.showThinkingMode)
    setMaxContextMessages(importedData.settings.maxContextMessages)
    setTemperature(importedData.settings.temperature || 0.3)
    setMaxTokens(importedData.settings.maxTokens || 8000)
  }, [])

  const downloadBackup = useCallback((): void => {
    storageManager.downloadBackup()
  }, [])

  const uploadBackup = useCallback(async (file: File): Promise<void> => {
    const importedData = await storageManager.uploadBackup(file)
    setThreads(importedData.threads)
    setMessages(importedData.messages)
    setShowInlineForks(importedData.settings.showInlineForks)
    setShowThinkingMode(importedData.settings.showThinkingMode)
    setMaxContextMessages(importedData.settings.maxContextMessages)
    setTemperature(importedData.settings.temperature || 0.3)
    setMaxTokens(importedData.settings.maxTokens || 8000)
  }, [])

  const clearAllData = useCallback((): void => {
    storageManager.clearData()
    setThreads({})
    setMessages({})
    setShowInlineForks(true)
    setShowThinkingMode(false)
    setMaxContextMessages(15)
    setTemperature(0.3)
    setMaxTokens(8000)
  }, [])

  const getStorageInfo = useCallback((): { size: string; lastSaved: string | null; itemCount: number } => {
    return storageManager.getStorageInfo()
  }, [])

  const createThreadFromText = useCallback(
    (text: string, parentThreadId: string | null, isSubthread = true): string => {
      const threadId = generateId("thread")
      const messageId = generateId("msg")
      const parentLevel = parentThreadId ? threads[parentThreadId]?.level || 0 : 0
      const thread = {
        id: threadId,
        name: generateThreadName(text),
        parentThreadId: isSubthread && parentThreadId ? parentThreadId : undefined,
        rootMessageId: messageId,
        messages: [
          {
            id: messageId,
            role: "user" as const,
            content: text,
            timestamp: new Date(),
            threadId: threadId,
            isEdited: false,
            isSeed: true,
          },
        ],
        contextThreadIds: [],
        contextMessageIds: [],
        excludedMessageIds: [],
        level: isSubthread && parentThreadId ? parentLevel + 1 : 0,
        isVisible: true,
        isMainThread: !isSubthread,
        subThreads: [],
      }
      setThreads((prev) => ({
        ...prev,
        [threadId]: thread,
      }))
      return threadId
    },
    [setThreads, threads]
  )

  return (
    <ThreadContext.Provider
      value={{
        threads,
        messages,
        showInlineForks,
        setShowInlineForks,
        showThinkingMode,
        setShowThinkingMode,
        maxContextMessages,
        setMaxContextMessages,
        temperature,
        setTemperature,
        maxTokens,
        setMaxTokens,

        createThread,
        createMainThread,
        addMessage,
        editMessage,
        deleteMessage,
        deleteThread,
        updateThread,
        forkMessage,
        addContextThread,
        removeContextThread,
        addContextMessage,
        removeContextMessage,
        excludeMessageFromThread,
        includeMessageInThread,
        getThreadContext,
        getMessageForks,
        toggleThreadVisibility,
        getMainThreads,
        getThreadHierarchy,
        getAllMessages,
        exportData,
        importData,
        downloadBackup,
        uploadBackup,
        clearAllData,
        getStorageInfo,
        createThreadFromText,
      }}
    >
      {children}
    </ThreadContext.Provider>
  )
}

export function useThreads() {
  const context = useContext(ThreadContext)
  if (!context) {
    throw new Error("useThreads must be used within ThreadProvider")
  }
  return context
}
