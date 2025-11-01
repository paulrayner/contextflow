import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { TemporalKeyframe } from '../model/types'

interface KeyframeEditorProps {
  keyframe: TemporalKeyframe
  onClose: () => void
  onUpdate: (updates: Partial<TemporalKeyframe>) => void
  onDelete: () => void
}

export function KeyframeEditor({ keyframe, onClose, onUpdate, onDelete }: KeyframeEditorProps) {
  const [date, setDate] = useState(keyframe.date)
  const [label, setLabel] = useState(keyframe.label || '')
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    // Validate date format
    const dateRegex = /^\d{4}(-Q[1-4])?$/
    if (!dateRegex.test(date)) {
      setError('Invalid date format. Use YYYY or YYYY-Q#')
      return
    }

    onUpdate({
      date,
      label: label.trim() || undefined,
    })
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this keyframe?')) {
      onDelete()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Edit Keyframe
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setError(null)
              }}
              placeholder="2027 or 2027-Q2"
              className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Post-migration"
              className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Delete Keyframe
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
