import { SettingsPanel } from "@/components/settings-panel"

interface RightSidebarProps {
  showSettingsPanel: boolean
  selectedThreadId: string
  onToggleSettings: () => void
}

export function RightSidebar({ showSettingsPanel, selectedThreadId, onToggleSettings }: RightSidebarProps) {
  return (
    <>
      {/* Right Sidebar - Settings Panel */}
      <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${showSettingsPanel ? 'w-[448px]' : 'w-0'}`}>
        {showSettingsPanel && (
          <SettingsPanel threadId={selectedThreadId} onClose={onToggleSettings} />
        )}
      </div>
      
      {/* Settings Toggle Button (when panel is closed) */}
      {!showSettingsPanel && (
        <div className="flex-shrink-0 w-12 bg-background border-l flex items-center justify-center">
          <button
            onClick={onToggleSettings}
            className="h-12 w-12 p-0 rotate-90 flex items-center justify-center hover:bg-muted rounded"
            title="Open Settings"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
} 