export interface Command {
  id: string
  name: string
  prompt: string
  description?: string
}

export const DEFAULT_COMMANDS: Command[] = [
  {
    id: 'define',
    name: 'define',
    prompt: 'Define the following term in a formal, academic context. Provide a clear, concise definition that would be suitable for educational or professional use.',
    description: 'Define terms in formal context'
  },
  {
    id: 'explain',
    name: 'explain',
    prompt: 'Explain the following concept or topic in depth. Provide a comprehensive explanation that covers the key aspects, background context, and practical implications.',
    description: 'Explain concepts in depth'
  }
]

export class CommandManager {
  private static instance: CommandManager
  private commands: Command[] = []
  private storageKey = 'tree-ai-commands'

  static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager()
    }
    return CommandManager.instance
  }

  private constructor() {
    this.loadCommands()
  }

  private loadCommands(): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        this.commands = [...DEFAULT_COMMANDS]
        return
      }

      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Command[]
        this.commands = parsed
      } else {
        // Initialize with default commands
        this.commands = [...DEFAULT_COMMANDS]
        this.saveCommands()
      }
    } catch (error) {
      console.error('Error loading commands:', error)
      this.commands = [...DEFAULT_COMMANDS]
    }
  }

  private saveCommands(): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.commands))
    } catch (error) {
      console.error('Error saving commands:', error)
    }
  }

  getCommands(): Command[] {
    return [...this.commands]
  }

  addCommand(command: Omit<Command, 'id'>): void {
    const newCommand: Command = {
      ...command,
      id: this.generateId()
    }
    this.commands.push(newCommand)
    this.saveCommands()
  }

  updateCommand(id: string, updates: Partial<Omit<Command, 'id'>>): void {
    const index = this.commands.findIndex(cmd => cmd.id === id)
    if (index !== -1) {
      this.commands[index] = { ...this.commands[index], ...updates }
      this.saveCommands()
    }
  }

  deleteCommand(id: string): void {
    this.commands = this.commands.filter(cmd => cmd.id !== id)
    this.saveCommands()
  }

  getCommand(name: string): Command | undefined {
    return this.commands.find(cmd => cmd.name === name)
  }

  resetToDefaults(): void {
    this.commands = [...DEFAULT_COMMANDS]
    this.saveCommands()
  }

  private generateId(): string {
    return 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

export const commandManager = CommandManager.getInstance() 