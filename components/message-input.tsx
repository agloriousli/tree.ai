"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Send, X, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder?: string
  contextInfo?: string
}

export function MessageInput({
  onSend,
  isLoading,
  placeholder = "Type your message...",
  contextInfo,
}: MessageInputProps) {
  const [input, setInput] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput("")
    setIsExpanded(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
  }

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 sm:p-4 space-y-3">
      {/* Context Info */}
      {contextInfo && (
        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border">ℹ️ {contextInfo}</div>
      )}

      {/* Input Area */}
      <div className="flex space-x-2 sm:space-x-3">
        <div className="flex-1 relative">
          {isExpanded ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="min-h-[100px] resize-none pr-12"
              rows={4}
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="pr-12"
            />
          )}

          {/* Input Controls */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {input.trim() && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setInput("")}>
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="px-4 sm:px-6 min-w-[60px] sm:min-w-[80px] flex-shrink-0"
          size={isExpanded ? "default" : "default"}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </Button>
      </div>

      {/* Keyboard Hint */}
      <div className="text-xs text-muted-foreground text-center">
        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send,
        <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Shift + Enter</kbd> for new line,
        <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">\</kbd> for commands
      </div>
    </div>
  )
}
