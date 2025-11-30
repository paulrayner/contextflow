import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ProjectDeleteDialogProps {
  projectName: string
  onConfirm: () => void
  onCancel: () => void
}

export function ProjectDeleteDialog({ projectName, onConfirm, onCancel }: ProjectDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[400px] max-w-[90vw] border border-slate-200 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Delete Project
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{projectName}"</strong>?
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  )
}
