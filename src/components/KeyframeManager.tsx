import React, { useState } from 'react'
import { X, Plus, Trash2, Copy, ChevronRight } from 'lucide-react'
import type { TemporalKeyframe } from '../model/types'
import { useEditorStore } from '../model/store'

interface KeyframeManagerProps {
  onClose: () => void
}

export function KeyframeManager({ onClose }: KeyframeManagerProps) {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const setCurrentDate = useEditorStore(s => s.setCurrentDate)
  const setActiveKeyframe = useEditorStore(s => s.setActiveKeyframe)
  const addKeyframe = useEditorStore(s => s.addKeyframe)
  const deleteKeyframe = useEditorStore(s => s.deleteKeyframe)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!project?.temporal) {
    return null
  }

  const keyframes = [...project.temporal.keyframes].sort((a, b) => a.date.localeCompare(b.date))

  const handleAddKeyframe = () => {
    // Validate date format
    const dateRegex = /^\d{4}(-Q[1-4])?$/
    if (!dateRegex.test(newDate)) {
      setError('Invalid date format. Use YYYY or YYYY-Q#')
      return
    }

    // Check for duplicate date
    if (keyframes.some(kf => kf.date === newDate)) {
      setError('A keyframe already exists at this date')
      return
    }

    addKeyframe(newDate, newLabel.trim() || undefined)
    setNewDate('')
    setNewLabel('')
    setShowAddForm(false)
    setError(null)
  }

  const handleJumpTo = (keyframe: TemporalKeyframe) => {
    setCurrentDate(keyframe.date)
    setActiveKeyframe(keyframe.id)
    onClose()
  }

  const handleDelete = (keyframe: TemporalKeyframe) => {
    if (window.confirm(`Delete keyframe "${keyframe.label || keyframe.date}"?`)) {
      deleteKeyframe(keyframe.id)
    }
  }

  const handleDuplicate = (keyframe: TemporalKeyframe) => {
    // Suggest a new date (increment year by 1)
    const year = parseInt(keyframe.date.split('-')[0])
    const suggestedDate = `${year + 1}`
    setNewDate(suggestedDate)
    setNewLabel(`${keyframe.label || ''} (copy)`)
    setShowAddForm(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Manage Keyframes
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Keyframe List */}
        <div className="space-y-2 mb-4">
          {keyframes.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No keyframes yet. Create your first keyframe to project future evolution.
            </div>
          ) : (
            keyframes.map((keyframe) => {
              const contextCount = keyframe.activeContextIds?.length || Object.keys(keyframe.positions).length

              return (
                <div
                  key={keyframe.id}
                  className="flex items-center gap-3 p-3 border border-slate-200 dark:border-neutral-700 rounded-md hover:bg-slate-50 dark:hover:bg-neutral-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {keyframe.date}
                      {keyframe.label && (
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                          {keyframe.label}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {contextCount} context{contextCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleJumpTo(keyframe)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Jump to keyframe"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(keyframe)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-600 rounded transition-colors"
                      title="Duplicate keyframe"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(keyframe)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete keyframe"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Add Keyframe Form */}
        {showAddForm ? (
          <div className="border border-slate-200 dark:border-neutral-700 rounded-md p-4 space-y-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Add New Keyframe</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="text"
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value)
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
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., Post-migration"
                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewDate('')
                  setNewLabel('')
                  setError(null)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddKeyframe}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Add Keyframe
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <Plus size={16} />
            Add Keyframe
          </button>
        )}
      </div>
    </div>
  )
}
