"use client"

import { useState, useRef } from "react"
import { Download, Upload, Trash2, Info, FileText, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useThreads } from "@/components/thread-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatTime } from "@/lib/utils"

export function DataManagement() {
  const { 
    exportData, 
    importData, 
    downloadBackup, 
    uploadBackup, 
    clearAllData, 
    getStorageInfo,
    threads,
    messages 
  } = useThreads()
  
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const storageInfo = getStorageInfo()
  const threadCount = Object.keys(threads).length
  const messageCount = Object.keys(messages).length

  const handleExport = () => {
    try {
      const data = exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tree-ai-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        importData(data)
        alert('Data imported successfully!')
      } catch (error) {
        console.error('Import failed:', error)
        setImportError('Invalid file format. Please use a valid TreeAI export file.')
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.readAsText(file)
  }

  const handleBackupUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)

    try {
      await uploadBackup(file)
      alert('Backup uploaded successfully!')
    } catch (error) {
      console.error('Backup upload failed:', error)
      setImportError('Invalid backup file. Please use a valid TreeAI backup file.')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAllData()
      setShowClearDialog(false)
      alert('All data has been cleared.')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Data Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Storage Info */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Storage Info</span>
            <Info className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Size: {storageInfo.size}</div>
            <div>Items: {storageInfo.itemCount}</div>
            <div>Threads: {threadCount}</div>
            <div>Messages: {messageCount}</div>
          </div>
          {storageInfo.lastSaved && (
            <div className="text-xs text-muted-foreground mt-1">
              Last saved: {formatTime(new Date(storageInfo.lastSaved))}
            </div>
          )}
        </div>

        {/* Export/Import Actions */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="flex-1"
            >
              <Download className="h-3 w-3 mr-1" />
              Export Data
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
              disabled={isImporting}
            >
              <Upload className="h-3 w-3 mr-1" />
              {isImporting ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadBackup}
              className="flex-1"
            >
              <Download className="h-3 w-3 mr-1" />
              Download Backup
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
              disabled={isImporting}
            >
              <Upload className="h-3 w-3 mr-1" />
              {isImporting ? 'Uploading...' : 'Upload Backup'}
            </Button>
          </div>
        </div>

        {/* Import Error */}
        {importError && (
          <div className="bg-destructive/10 border border-destructive/20 p-2 rounded text-xs text-destructive">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            {importError}
          </div>
        )}

        {/* Clear Data */}
        <div className="pt-2 border-t">
          <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear All Data</DialogTitle>
                <DialogDescription>
                  This will permanently delete all threads, messages, and settings. 
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleClearData}>
                  Clear All Data
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  )
} 