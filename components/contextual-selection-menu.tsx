// ContextualSelectionMenu.tsx
// Usage: Place <ContextualSelectionMenu /> inside your chat area (with className="relative")
// and wrap your message bubbles with data-message-bubble and data-message-id attributes.

import React, { useEffect, useRef, useState } from "react"
import { useThreads } from "@/components/thread-provider"
import { useThreadCreation } from "@/components/hooks/use-thread-creation"
import { Command, commandManager } from "@/lib/commands"

interface HighlightMenuState {
  visible: boolean
  x: number
  y: number
  text: string
}

interface ContextualSelectionMenuProps {
  onThreadSelect: (threadId: string, options?: { pending?: boolean }) => void
  onCommandExecute?: (command: Command, text: string) => void
}

export function ContextualSelectionMenu({ onThreadSelect, onCommandExecute }: ContextualSelectionMenuProps) {
  const [menu, setMenu] = useState<HighlightMenuState>({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  })
  const menuRef = useRef<HTMLDivElement>(null)
  const { messages } = useThreads()
  const { createThread } = useThreadCreation()
  const [messageId, setMessageId] = useState<string | null>(null)
  const [showCommands, setShowCommands] = useState(false)
  const [commands, setCommands] = useState<Command[]>([])

  // Hide menu on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu((prev) => ({ ...prev, visible: false }))
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu((prev) => ({ ...prev, visible: false }))
    }
    if (menu.visible) {
      document.addEventListener("mousedown", handleClick)
      document.addEventListener("keydown", handleEsc)
    }
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [menu.visible])

  // Listen for text selection
  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      if (selectedText && selection && selection.rangeCount > 0 && selection.anchorNode) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        // Only show if selection is inside a message bubble
        let node = selection.anchorNode as HTMLElement | null
        let found = false
        let foundMessageId: string | null = null
        while (node && node !== document.body) {
          if (node instanceof HTMLElement && node.hasAttribute("data-message-bubble")) {
            found = true
            foundMessageId = node.getAttribute("data-message-id")
            break
          }
          node = node.parentElement
        }
        if (!found) return
        setMenu({
          visible: true,
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top - 8 + window.scrollY,
          text: selectedText,
        })
        setMessageId(foundMessageId)
      } else {
        setMenu((prev) => ({ ...prev, visible: false }))
        setMessageId(null)
      }
    }
    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [])

  if (!menu.visible) return null

  const handleShowCommands = () => {
    setCommands(commandManager.getCommands())
    setShowCommands(true)
  }

  const handleCommandExecute = (command: Command) => {
    if (onCommandExecute) {
      onCommandExecute(command, menu.text)
    }
    setMenu((prev) => ({ ...prev, visible: false }))
    setShowCommands(false)
  }

  if (showCommands) {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 bg-popover border shadow-lg rounded px-3 py-2 text-sm flex flex-col gap-1 animate-fade-in"
        style={{ top: menu.y, left: menu.x, transform: "translate(-50%, -100%)" }}
        role="menu"
        aria-label="Command actions"
      >
        <div className="px-2 py-1 text-xs text-muted-foreground border-b mb-1">
          Commands
        </div>
        {commands.map((command) => (
          <button
            key={command.id}
            className="hover:underline px-2 py-1 text-left"
            onClick={() => handleCommandExecute(command)}
            aria-label={`Execute ${command.name} command`}
          >
            \{command.name}
          </button>
        ))}
        <button
          className="hover:underline px-2 py-1 text-left text-muted-foreground"
          onClick={() => setShowCommands(false)}
        >
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border shadow-lg rounded px-3 py-2 text-sm flex flex-col gap-1 animate-fade-in"
      style={{ top: menu.y, left: menu.x, transform: "translate(-50%, -100%)" }}
      role="menu"
      aria-label="Selection actions"
    >
      <button
        className="hover:underline px-2 py-1 text-left"
        onClick={() => {
          navigator.clipboard.writeText(menu.text)
          setMenu((prev) => ({ ...prev, visible: false }))
        }}
        aria-label="Copy selected text"
      >
        Copy
      </button>
      <button
        className="hover:underline px-2 py-1 text-left"
        onClick={() => {
          if (messageId) {
            const parentMessage = messages[messageId]
            const parentThreadId = parentMessage?.threadId ?? null
            const newThreadId = createThread({
              type: 'text',
              selectedText: menu.text,
              parentThreadId: parentThreadId || undefined,
              isMainThread: false
            })
            if (newThreadId) {
              onThreadSelect(newThreadId, { pending: true })
            }
            setMenu((prev) => ({ ...prev, visible: false }))
          }
        }}
        aria-label="Create subthread from selection"
        disabled={!messageId}
      >
        New Subthread
      </button>
      <button
        className="hover:underline px-2 py-1 text-left"
        onClick={() => {
          const newThreadId = createThread({
            type: 'text',
            selectedText: menu.text,
            isMainThread: true
          })
          if (newThreadId) {
            onThreadSelect(newThreadId, { pending: true })
          }
          setMenu((prev) => ({ ...prev, visible: false }))
        }}
        aria-label="Create main thread from selection"
      >
        New Main Thread
      </button>
      <button
        className="hover:underline px-2 py-1 text-left"
        onClick={handleShowCommands}
        aria-label="Show commands"
      >
        Commands
      </button>
    </div>
  )
} 