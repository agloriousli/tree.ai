"use client"

import { useState, useEffect, useRef } from "react"
import { Command, commandManager } from "@/lib/commands"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Edit, Trash2, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SlashCommandPopupProps {
  isOpen: boolean
  onClose: () => void
  onSelectCommand: (command: Command) => void
  position: { x: number; y: number } | null
}

export function SlashCommandPopup({ isOpen, onClose, onSelectCommand, position }: SlashCommandPopupProps) {
  const [commands, setCommands] = useState<Command[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCommand, setEditingCommand] = useState<Command | null>(null)
  const [newCommandName, setNewCommandName] = useState("")
  const [newCommandPrompt, setNewCommandPrompt] = useState("")
  const [newCommandDescription, setNewCommandDescription] = useState("")
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setCommands(commandManager.getCommands())
      setSearchTerm("")
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const filteredCommands = commands.filter(command =>
    command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    command.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectCommand = (command: Command) => {
    onSelectCommand(command)
    onClose()
  }

  const handleAddCommand = () => {
    setEditingCommand(null)
    setNewCommandName("")
    setNewCommandPrompt("")
    setNewCommandDescription("")
    setShowEditDialog(true)
  }

  const handleEditCommand = (command: Command) => {
    setEditingCommand(command)
    setNewCommandName(command.name)
    setNewCommandPrompt(command.prompt)
    setNewCommandDescription(command.description || "")
    setShowEditDialog(true)
  }

  const handleDeleteCommand = (commandId: string) => {
    commandManager.deleteCommand(commandId)
    setCommands(commandManager.getCommands())
  }

  const handleSaveCommand = () => {
    if (!newCommandName.trim() || !newCommandPrompt.trim()) return

    if (editingCommand) {
      commandManager.updateCommand(editingCommand.id, {
        name: newCommandName.trim(),
        prompt: newCommandPrompt.trim(),
        description: newCommandDescription.trim() || undefined
      })
    } else {
      commandManager.addCommand({
        name: newCommandName.trim(),
        prompt: newCommandPrompt.trim(),
        description: newCommandDescription.trim() || undefined
      })
    }

    setCommands(commandManager.getCommands())
    setShowEditDialog(false)
  }

  const handleResetToDefaults = () => {
    commandManager.resetToDefaults()
    setCommands(commandManager.getCommands())
  }

  if (!isOpen || !position) return null

  return (
    <>
      <div
        ref={popupRef}
        className="fixed z-50 bg-background border rounded-lg shadow-lg max-w-sm w-full"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="p-3 border-b">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-8"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-64">
          <div className="p-2 space-y-1">
            {filteredCommands.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {searchTerm ? "No commands found" : "No commands available"}
              </div>
            ) : (
              filteredCommands.map((command) => (
                <div
                  key={command.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer group"
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handleSelectCommand(command)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">\{command.name}</span>
                      {command.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {command.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCommand(command)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCommand(command.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-2 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddCommand}
            className="h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Command
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefaults}
            className="h-8 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Edit/Add Command Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCommand ? "Edit Command" : "Add New Command"}
            </DialogTitle>
            <DialogDescription>
              {editingCommand 
                ? "Update the command details below."
                : "Create a new command that can be triggered with \\command"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="command-name">Command Name</Label>
              <Input
                id="command-name"
                value={newCommandName}
                onChange={(e) => setNewCommandName(e.target.value)}
                placeholder="e.g., summarize, translate, analyze"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="command-description">Description (Optional)</Label>
              <Input
                id="command-description"
                value={newCommandDescription}
                onChange={(e) => setNewCommandDescription(e.target.value)}
                placeholder="Brief description of what this command does"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="command-prompt">Prompt</Label>
              <Textarea
                id="command-prompt"
                value={newCommandPrompt}
                onChange={(e) => setNewCommandPrompt(e.target.value)}
                placeholder="Enter the prompt that will be sent to the AI..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{text}"} to reference the selected text in your prompt
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCommand} disabled={!newCommandName.trim() || !newCommandPrompt.trim()}>
                {editingCommand ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 