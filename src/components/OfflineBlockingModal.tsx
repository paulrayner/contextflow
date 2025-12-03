import React from 'react'
import { WifiOff, RefreshCw, Loader2 } from 'lucide-react'
import { useCollabStore } from '../model/collabStore'

export function OfflineBlockingModal() {
  const connectionState = useCollabStore((s) => s.connectionState)
  const activeProjectId = useCollabStore((s) => s.activeProjectId)
  const error = useCollabStore((s) => s.error)
  const connectToProject = useCollabStore((s) => s.connectToProject)
  const reconnectAttempts = useCollabStore((s) => s.reconnectAttempts)

  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleRetry = async () => {
    if (!activeProjectId || isRetrying) return

    setIsRetrying(true)
    try {
      await connectToProject(activeProjectId)
    } finally {
      setIsRetrying(false)
    }
  }

  const isOffline = connectionState === 'offline'
  const isError = connectionState === 'error'
  const isReconnecting = connectionState === 'reconnecting'

  if (!isOffline && !isError && !isReconnecting) {
    return null
  }

  const headerIcon = isReconnecting ? (
    <Loader2 size={20} className="text-amber-600 dark:text-amber-400 animate-spin" />
  ) : (
    <WifiOff size={20} className="text-amber-600 dark:text-amber-400" />
  )

  const headerTitle = isReconnecting ? 'Reconnecting...' : "You're Offline"

  const description = isReconnecting
    ? `Attempting to reconnect (attempt ${reconnectAttempts} of 5)...`
    : 'To access this shared project, you need to be connected to the internet.'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[400px] max-w-[90vw] border border-slate-200 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-neutral-700">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
            {headerIcon}
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {headerTitle}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {!isReconnecting && (
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Your changes will sync automatically when you reconnect.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-neutral-700">
          <button
            onClick={handleRetry}
            disabled={isRetrying || isReconnecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw
              size={16}
              className={isRetrying || isReconnecting ? 'animate-spin' : ''}
            />
            {isRetrying || isReconnecting ? 'Reconnecting...' : 'Retry Connection'}
          </button>
        </div>
      </div>
    </div>
  )
}
