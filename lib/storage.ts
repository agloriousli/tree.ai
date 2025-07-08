import type { Thread, Message } from "@/components/thread-provider"

const STORAGE_KEY = 'tree-ai-data'
const STORAGE_VERSION = '1.0'

interface StorageData {
  version: string
  threads: Record<string, Thread>
  messages: Record<string, Message>
  settings: {
    showInlineForks: boolean
    showThinkingMode: boolean
    maxContextMessages: number | null
    temperature: number
    maxTokens: number
  }
  lastSaved: string
}

export class StorageManager {
  private static instance: StorageManager
  private autoSaveEnabled = true
  private saveTimeout: NodeJS.Timeout | null = null

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  private constructor() {
    // Don't load data during construction to avoid SSR issues
    // Data will be loaded when explicitly called
  }

  private getStorageData(): StorageData | null {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null
      }
      
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null
      
      const data = JSON.parse(saved) as StorageData
      
      // Handle version migration if needed
      if (data.version !== STORAGE_VERSION) {
        console.log(`Migrating storage from version ${data.version} to ${STORAGE_VERSION}`)
        return this.migrateData(data)
      }
      
      return data
    } catch (error) {
      console.error('Error loading from storage:', error)
      return null
    }
  }

  private migrateData(oldData: any): StorageData {
    // Add migration logic here when needed
    return {
      version: STORAGE_VERSION,
      threads: oldData.threads || {},
      messages: oldData.messages || {},
      settings: {
        showInlineForks: oldData.settings?.showInlineForks ?? true,
        showThinkingMode: oldData.settings?.showThinkingMode ?? false,
        maxContextMessages: oldData.settings?.maxContextMessages ?? 15,
        temperature: oldData.settings?.temperature ?? 0.3,
        maxTokens: oldData.settings?.maxTokens ?? 8000,
      },
      lastSaved: new Date().toISOString()
    }
  }

  loadData(): StorageData | null {
    const data = this.getStorageData()
    if (data) {
      // Convert date strings back to Date objects
      Object.values(data.messages).forEach(message => {
        if (message.timestamp) {
          const newTimestamp = new Date(message.timestamp)
          // Check if the date is valid
          if (isNaN(newTimestamp.getTime())) {
            message.timestamp = new Date()
          } else {
            message.timestamp = newTimestamp
          }
        } else {
          // Fallback for messages without timestamps
          message.timestamp = new Date()
        }
      })
    }
    return data
  }

  saveData(
    threads: Record<string, Thread>,
    messages: Record<string, Message>,
    settings: {
      showInlineForks: boolean
      showThinkingMode: boolean
      maxContextMessages: number | null
      temperature: number
      maxTokens: number
    }
  ): void {
    if (!this.autoSaveEnabled) return

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    // Debounce saves to avoid excessive localStorage writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = setTimeout(() => {
      try {
        const data: StorageData = {
          version: STORAGE_VERSION,
          threads,
          messages,
          settings,
          lastSaved: new Date().toISOString()
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        console.log('Data saved to localStorage')
      } catch (error) {
        console.error('Error saving to storage:', error)
      }
    }, 1000) // Debounce for 1 second
  }

  clearData(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      localStorage.removeItem(STORAGE_KEY)
      console.log('Data cleared from localStorage')
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }

  exportData(): string {
    try {
      const data = this.getStorageData()
      if (!data) {
        throw new Error('No data to export')
      }

      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        exportVersion: STORAGE_VERSION
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  importData(jsonData: string): StorageData {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available')
      }
      
      const importedData = JSON.parse(jsonData)
      
      // Validate the imported data structure
      if (!importedData.threads || !importedData.messages) {
        throw new Error('Invalid data format: missing threads or messages')
      }

      // Convert date strings back to Date objects
      Object.values(importedData.messages).forEach((message: any) => {
        if (message.timestamp) {
          const newTimestamp = new Date(message.timestamp)
          // Check if the date is valid
          if (isNaN(newTimestamp.getTime())) {
            message.timestamp = new Date()
          } else {
            message.timestamp = newTimestamp
          }
        } else {
          // Fallback for messages without timestamps
          message.timestamp = new Date()
        }
      })

      // Temporarily disable auto-save during import
      this.autoSaveEnabled = false
      
      // Save the imported data
      const data: StorageData = {
        version: STORAGE_VERSION,
        threads: importedData.threads,
        messages: importedData.messages,
        settings: importedData.settings || {
          showInlineForks: true,
          showThinkingMode: false,
          maxContextMessages: 15,
        },
        lastSaved: new Date().toISOString()
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      
      // Re-enable auto-save
      this.autoSaveEnabled = true
      
      console.log('Data imported successfully')
      return data
    } catch (error) {
      console.error('Error importing data:', error)
      this.autoSaveEnabled = true
      throw error
    }
  }

  getStorageInfo(): { size: string; lastSaved: string | null; itemCount: number } {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return { size: '0 KB', lastSaved: null, itemCount: 0 }
      }
      
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return { size: '0 KB', lastSaved: null, itemCount: 0 }
      }

      const parsed = JSON.parse(data) as StorageData
      const sizeInBytes = new Blob([data]).size
      const sizeInKB = (sizeInBytes / 1024).toFixed(1)
      const itemCount = Object.keys(parsed.threads).length + Object.keys(parsed.messages).length

      return {
        size: `${sizeInKB} KB`,
        lastSaved: parsed.lastSaved,
        itemCount
      }
    } catch (error) {
      console.error('Error getting storage info:', error)
      return { size: '0 KB', lastSaved: null, itemCount: 0 }
    }
  }

  downloadBackup(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Browser APIs not available')
      }
      
      const data = this.exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tree-ai-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading backup:', error)
      throw error
    }
  }

  async uploadBackup(file: File): Promise<StorageData> {
    try {
      const text = await file.text()
      return this.importData(text)
    } catch (error) {
      console.error('Error uploading backup:', error)
      throw error
    }
  }
}

export const storageManager = StorageManager.getInstance() 