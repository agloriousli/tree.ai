/**
 * Custom hook for managing tab state and operations in the chat interface.
 * 
 * This hook handles:
 * - Tab creation, switching, and closing
 * - Scroll position management for each tab
 * - Tab title updates when thread names change
 * - Tab state synchronization
 * 
 * Provides a clean interface for tab management without cluttering the main component.
 */
import { useState, useRef, useCallback } from "react"

export function useTabManager() {
  // Simplified structure: tabs is a list of thread IDs that are open
  const [tabs, setTabs] = useState<string[]>([])
  const [curTab, setCurTab] = useState<string>("") // Current active thread ID
  const [isClosingTab, setIsClosingTab] = useState(false)
  const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollPositions = useRef<Record<string, number>>({})

  const openThreadInNewTab = useCallback((threadId: string) => {
    // Check if thread is already open in a tab
    if (tabs.includes(threadId)) {
      setCurTab(threadId)
      return threadId
    }

    // Add thread to tabs and make it active
    setTabs(prevTabs => [...prevTabs, threadId])
    setCurTab(threadId)
    return threadId
  }, [tabs])

  const closeTab = useCallback((threadId: string) => {
    setIsClosingTab(true)

    const tabIndex = tabs.indexOf(threadId)
    if (tabIndex === -1) {
      setIsClosingTab(false)
      return
    }

    const newTabs = tabs.filter(id => id !== threadId)

    // If closing active tab and there are remaining tabs, switch to adjacent tab
    if (threadId === curTab && newTabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1)
      const newActiveTab = newTabs[newActiveIndex]
      setCurTab(newActiveTab)
    } else if (threadId === curTab && newTabs.length === 0) {
      setCurTab("")
    }

    setTabs(newTabs)
    setTimeout(() => setIsClosingTab(false), 200)
  }, [tabs, curTab])

  const switchTab = useCallback((threadId: string) => {
    if (threadId === curTab) return

    // Save current tab's scroll position
    const container = scrollContainerRefs.current[curTab]
    if (container) {
      scrollPositions.current[curTab] = container.scrollTop
    }

    setCurTab(threadId)

    // Restore scroll position after a brief delay
    setTimeout(() => {
      const newContainer = scrollContainerRefs.current[threadId]
      const savedPosition = scrollPositions.current[threadId]
      if (newContainer && savedPosition !== undefined) {
        newContainer.scrollTop = savedPosition
      }
    }, 100)
  }, [curTab])

  const clearTabs = useCallback(() => {
    setTabs([])
    setCurTab("")
  }, [])

  const getActiveTab = useCallback(() => {
    return curTab
  }, [curTab])

  return {
    tabs,
    curTab,
    isClosingTab,
    scrollContainerRefs,
    openThreadInNewTab,
    closeTab,
    switchTab,
    clearTabs,
    getActiveTab,
  }
} 