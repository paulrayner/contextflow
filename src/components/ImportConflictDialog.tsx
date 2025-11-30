import React from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ImportConflictDialogProps {
  importedProjectName: string
  existingProjectName: string
  onReplace: () => void
  onImportAsNew: () => void
  onCancel: () => void
}

export function ImportConflictDialog({
  importedProjectName,
  existingProjectName,
  onReplace,
  onImportAsNew,
  onCancel,
}: ImportConflictDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[440px] max-w-[90vw] border border-slate-200 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Project Already Exists
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
            A project named <strong className="text-slate-800 dark:text-slate-200">"{existingProjectName}"</strong> already exists.
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            How would you like to import <strong className="text-slate-700 dark:text-slate-300">"{importedProjectName}"</strong>?
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={onReplace}
            className="w-full px-3 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors"
          >
            Replace existing project
          </button>
          <button
            type="button"
            onClick={onImportAsNew}
            className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Import as new project
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
