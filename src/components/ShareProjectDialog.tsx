import React, { useState } from 'react'
import { X, Link2, Copy, Check, AlertTriangle } from 'lucide-react'

interface ShareProjectDialogProps {
  projectId: string
  projectName: string
  onClose: () => void
}

function getShareUrl(projectId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/p/${projectId}`
}

export function ShareProjectDialog({
  projectId,
  projectName,
  onClose,
}: ShareProjectDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(true)
  const [copied, setCopied] = useState(false)

  const shareUrl = getShareUrl(projectId)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Pre-share confirmation screen
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[440px] max-w-[90vw] border border-slate-200 dark:border-neutral-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Share Project?
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Anyone with this link can:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-4">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 dark:text-amber-400" />
                  View all contents
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 dark:text-amber-400" />
                  Edit contexts and relationships
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 dark:text-amber-400" />
                  Delete items
                </li>
              </ul>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              You cannot revoke access once shared. Access control coming in a future update.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-4 pb-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Share Anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Share URL screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[480px] max-w-[90vw] border border-slate-200 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-blue-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Share "{projectName}"
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* URL display */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 text-sm font-mono px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  copied
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Privacy warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={16}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Anyone with this link can view and edit all project contents.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end px-4 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
