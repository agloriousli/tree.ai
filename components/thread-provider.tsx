"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

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
}

export interface Thread {
  id: string
  name: string
  parentThreadId?: string
  rootMessageId?: string
  messages: Message[]
  contextThreadIds: string[] // Other threads to include
  contextMessageIds: string[] // Specific messages to include (from any thread)
  excludedMessageIds: string[] // Messages to exclude from this thread's context
  level: number
  isVisible?: boolean
  isMainThread?: boolean
  description?: string
}

interface ThreadContextType {
  threads: Record<string, Thread>
  messages: Record<string, Message>
  showInlineForks: boolean
  setShowInlineForks: (show: boolean) => void
  createThread: (name: string, parentThreadId?: string, rootMessageId?: string, isMainThread?: boolean) => string
  createMainThread: (name: string, description?: string) => string
  addMessage: (threadId: string, content: string, role: "user" | "assistant") => string
  editMessage: (messageId: string, newContent: string) => void
  deleteMessage: (messageId: string) => void
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
}

const ThreadContext = createContext<ThreadContextType | null>(null)

// Default data for testing
const createDefaultData = () => {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const defaultMessages: Record<string, Message> = {
    "msg-1": {
      id: "msg-1",
      content:
        "Hello! I'm working on a React project and need help with state management. What are the best practices?",
      role: "user",
      timestamp: threeDaysAgo,
      threadId: "main",
      forkIds: ["thread-react-advanced"],
    },
    "msg-2": {
      id: "msg-2",
      content:
        "Great question! For React state management, here are the key best practices:\n\n1. **Start with built-in state** - Use useState and useReducer for local component state\n2. **Lift state up** when multiple components need the same data\n3. **Consider Context API** for app-wide state that doesn't change often\n4. **Use external libraries** like Redux, Zustand, or Jotai for complex state\n\nWhat specific challenges are you facing with your current setup?",
      role: "assistant",
      timestamp: threeDaysAgo,
      threadId: "main",
    },
    "msg-3": {
      id: "msg-3",
      content:
        "I'm building a dashboard with multiple components that need to share user data and preferences. Should I use Context or Redux?",
      role: "user",
      timestamp: threeDaysAgo,
      threadId: "main",
      forkIds: ["thread-dashboard"],
    },
    "msg-4": {
      id: "msg-4",
      content:
        "For a dashboard with user data and preferences, I'd recommend starting with **Context API** since it's built into React and perfect for this use case:\n\n```jsx\nconst UserContext = createContext()\n\nfunction UserProvider({ children }) {\n  const [user, setUser] = useState(null)\n  const [preferences, setPreferences] = useState({})\n  \n  return (\n    <UserContext.Provider value={{ user, setUser, preferences, setPreferences }}>\n      {children}\n    </UserContext.Provider>\n  )\n}\n```\n\nOnly consider Redux if you need time-travel debugging, complex async logic, or have a very large team.",
      role: "assistant",
      timestamp: threeDaysAgo,
      threadId: "main",
    },
    "msg-5": {
      id: "msg-5",
      content: "What about performance? I've heard Context can cause unnecessary re-renders.",
      role: "user",
      timestamp: twoHoursAgo,
      threadId: "main",
    },
    "msg-6": {
      id: "msg-6",
      content:
        "You're absolutely right to be concerned about performance! Here are strategies to optimize Context:\n\n1. **Split contexts** - Separate frequently changing data from static data\n2. **Use useMemo** for context values\n3. **Implement custom hooks** to access only needed parts\n4. **Consider state colocation** - keep state close to where it's used\n\nFor your dashboard, you might have:\n- `UserContext` (rarely changes)\n- `PreferencesContext` (changes occasionally)\n- `DashboardDataContext` (changes frequently)",
      role: "assistant",
      timestamp: twoHoursAgo,
      threadId: "main",
    },

    // React Advanced Thread
    "msg-7": {
      id: "msg-7",
      content: "Let's dive deeper into advanced React patterns. What about custom hooks for complex state logic?",
      role: "user",
      timestamp: twoHoursAgo,
      threadId: "thread-react-advanced",
    },
    "msg-8": {
      id: "msg-8",
      content:
        "Excellent question! Custom hooks are perfect for encapsulating complex state logic. Here's a powerful pattern:\n\n```jsx\nfunction useAsyncState(initialState) {\n  const [state, setState] = useState({\n    data: initialState,\n    loading: false,\n    error: null\n  })\n\n  const execute = useCallback(async (asyncFunction) => {\n    setState(prev => ({ ...prev, loading: true, error: null }))\n    try {\n      const data = await asyncFunction()\n      setState({ data, loading: false, error: null })\n    } catch (error) {\n      setState(prev => ({ ...prev, loading: false, error }))\n    }\n  }, [])\n\n  return [state, execute]\n}\n```\n\nThis pattern handles loading states, errors, and data in a reusable way!",
      role: "assistant",
      timestamp: twoHoursAgo,
      threadId: "thread-react-advanced",
    },

    // Dashboard Thread
    "msg-9": {
      id: "msg-9",
      content: "For the dashboard specifically, how should I structure the component hierarchy?",
      role: "user",
      timestamp: oneHourAgo,
      threadId: "thread-dashboard",
    },
    "msg-10": {
      id: "msg-10",
      content:
        "Great question! Here's a solid dashboard structure:\n\n```\nDashboard/\n├── Layout/\n│   ├── Header (user info, notifications)\n│   ├── Sidebar (navigation)\n│   └── Main (content area)\n├── Widgets/\n│   ├── Chart\n│   ├── Table\n│   ├── KPI\n│   └── Activity\n└── Providers/\n    ├── UserProvider\n    ├── ThemeProvider\n    └── DataProvider\n```\n\nKey principles:\n- **Container/Presentational** pattern\n- **Compound components** for complex widgets\n- **Render props** for data fetching\n- **Error boundaries** for resilience",
      role: "assistant",
      timestamp: oneHourAgo,
      threadId: "thread-dashboard",
    },

    // Python Thread
    "msg-11": {
      id: "msg-11",
      content:
        "I'm also working on a Python backend for this dashboard. What's the best way to structure a FastAPI project?",
      role: "user",
      timestamp: oneHourAgo,
      threadId: "thread-python",
    },
    "msg-12": {
      id: "msg-12",
      content:
        "FastAPI is an excellent choice! Here's a production-ready structure:\n\n```\napp/\n├── main.py              # FastAPI app instance\n├── config.py            # Settings and configuration\n├── dependencies.py      # Dependency injection\n├── database.py          # Database connection\n├── models/              # SQLAlchemy models\n├── schemas/             # Pydantic schemas\n├── crud/                # Database operations\n├── api/\n│   ├── __init__.py\n│   ├── deps.py          # API dependencies\n│   └── v1/\n│       ├── __init__.py\n│       ├── endpoints/\n│       └── api.py\n└── core/\n    ├── security.py      # Authentication\n    └── utils.py\n```\n\nKey benefits:\n- **Clear separation** of concerns\n- **Easy testing** with dependency injection\n- **Scalable** API versioning\n- **Type safety** with Pydantic",
      role: "assistant",
      timestamp: oneHourAgo,
      threadId: "thread-python",
    },

    // Design Thread
    "msg-13": {
      id: "msg-13",
      content: "What about the UI/UX design principles for dashboards? Any recommendations?",
      role: "user",
      timestamp: now,
      threadId: "thread-design",
    },
    "msg-14": {
      id: "msg-14",
      content:
        "Here are key dashboard design principles:\n\n**Visual Hierarchy:**\n- Most important metrics at the top-left\n- Use size, color, and spacing to guide attention\n- Group related information together\n\n**Data Visualization:**\n- Choose the right chart type for your data\n- Use consistent color schemes\n- Avoid chart junk and unnecessary decorations\n\n**User Experience:**\n- Progressive disclosure (show details on demand)\n- Responsive design for all screen sizes\n- Fast loading with skeleton screens\n- Clear error states and empty states\n\n**Accessibility:**\n- High contrast ratios\n- Keyboard navigation\n- Screen reader support\n- Alternative text for charts",
      role: "assistant",
      timestamp: now,
      threadId: "thread-design",
    },
  }

  const defaultThreads: Record<string, Thread> = {
    main: {
      id: "main",
      name: "React Development Help",
      messages: [
        defaultMessages["msg-1"],
        defaultMessages["msg-2"],
        defaultMessages["msg-3"],
        defaultMessages["msg-4"],
        defaultMessages["msg-5"],
        defaultMessages["msg-6"],
      ],
      contextThreadIds: [],
      contextMessageIds: [],
      excludedMessageIds: [],
      level: 0,
      isVisible: true,
      isMainThread: true,
      description: "Getting help with React state management and best practices",
    },
    "thread-react-advanced": {
      id: "thread-react-advanced",
      name: "Advanced React Patterns",
      parentThreadId: "main",
      rootMessageId: "msg-1",
      messages: [defaultMessages["msg-7"], defaultMessages["msg-8"]],
      contextThreadIds: ["main"],
      contextMessageIds: [],
      excludedMessageIds: [],
      level: 1,
      isVisible: true,
      isMainThread: false,
    },
    "thread-dashboard": {
      id: "thread-dashboard",
      name: "Dashboard Architecture",
      parentThreadId: "main",
      rootMessageId: "msg-3",
      messages: [defaultMessages["msg-9"], defaultMessages["msg-10"]],
      contextThreadIds: ["main"],
      contextMessageIds: [],
      excludedMessageIds: [],
      level: 1,
      isVisible: true,
      isMainThread: false,
    },
    "thread-python": {
      id: "thread-python",
      name: "Python Backend Development",
      messages: [defaultMessages["msg-11"], defaultMessages["msg-12"]],
      contextThreadIds: [],
      contextMessageIds: ["msg-3", "msg-4"], // Include some context from React thread
      excludedMessageIds: [],
      level: 0,
      isVisible: true,
      isMainThread: true,
      description: "FastAPI backend development for the dashboard project",
    },
    "thread-design": {
      id: "thread-design",
      name: "UI/UX Design Principles",
      messages: [defaultMessages["msg-13"], defaultMessages["msg-14"]],
      contextThreadIds: ["thread-dashboard"], // Include dashboard context
      contextMessageIds: [],
      excludedMessageIds: [],
      level: 0,
      isVisible: true,
      isMainThread: true,
      description: "Design principles and best practices for dashboard interfaces",
    },
  }

  return { defaultThreads, defaultMessages }
}

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const { defaultThreads, defaultMessages } = createDefaultData()
  const [threads, setThreads] = useState<Record<string, Thread>>(defaultThreads)
  const [messages, setMessages] = useState<Record<string, Message>>(defaultMessages)
  const [showInlineForks, setShowInlineForks] = useState(true)

  const createThread = useCallback(
    (name: string, parentThreadId?: string, rootMessageId?: string, isMainThread = false): string => {
      const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const parentLevel = parentThreadId ? threads[parentThreadId]?.level || 0 : 0

      const newThread: Thread = {
        id: threadId,
        name,
        parentThreadId,
        rootMessageId,
        messages: [],
        contextThreadIds: parentThreadId && !isMainThread ? [parentThreadId] : [],
        contextMessageIds: [],
        excludedMessageIds: [],
        level: isMainThread ? 0 : parentLevel + 1,
        isVisible: true,
        isMainThread,
      }

      setThreads((prev) => ({
        ...prev,
        [threadId]: newThread,
      }))

      return threadId
    },
    [threads],
  )

  const createMainThread = useCallback(
    (name: string, description?: string): string => {
      const threadId = createThread(name, undefined, undefined, true)

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
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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

    // Update in thread messages array
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

      // Remove from messages
      setMessages((prev) => {
        const newMessages = { ...prev }
        delete newMessages[messageId]
        return newMessages
      })

      // Remove from thread
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

  const forkMessage = useCallback(
    (messageId: string, threadName?: string): string => {
      const message = messages[messageId]
      if (!message) return ""

      const defaultName = threadName || `Fork: ${message.content.slice(0, 30)}...`
      const newThreadId = createThread(defaultName, message.threadId, messageId)

      // Update the original message to track this fork
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
        excludedMessageIds: prev[threadId].excludedMessageIds.filter((id) => id !== messageId), // Remove from excluded if adding
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
        contextMessageIds: prev[threadId].contextMessageIds.filter((id) => id !== messageId), // Remove from included if excluding
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
      let currentThread = threads[threadId]

      while (currentThread) {
        hierarchy.unshift(currentThread)
        currentThread = currentThread.parentThreadId ? threads[currentThread.parentThreadId] : undefined
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

      return uniqueMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    },
    [threads, getThreadHierarchy, messages],
  )

  const getMessageForks = useCallback(
    (messageId: string): Thread[] => {
      const message = messages[messageId]
      if (!message || !message.forkIds) return []

      return message.forkIds.map((forkId) => threads[forkId]).filter(Boolean)
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

  return (
    <ThreadContext.Provider
      value={{
        threads,
        messages,
        showInlineForks,
        setShowInlineForks,
        createThread,
        createMainThread,
        addMessage,
        editMessage,
        deleteMessage,
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
