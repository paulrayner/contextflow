import React from 'react'
import { X } from 'lucide-react'
import type { BoundedContext } from '../model/types'

interface RelationshipCreateDialogProps {
  fromContext: BoundedContext
  availableContexts: BoundedContext[]
  onConfirm: (toContextId: string, pattern: string, description?: string) => void
  onCancel: () => void
}

export const DDD_PATTERNS = [
  { value: 'customer-supplier', label: 'Customer-Supplier', description: 'Downstream depends on upstream' },
  { value: 'conformist', label: 'Conformist', description: 'Downstream conforms to upstream model' },
  { value: 'anti-corruption-layer', label: 'Anti-Corruption Layer', description: 'Downstream uses translation layer' },
  { value: 'open-host-service', label: 'Open Host Service', description: 'Upstream provides public API' },
  { value: 'published-language', label: 'Published Language', description: 'Shared, well-documented format' },
  { value: 'shared-kernel', label: 'Shared Kernel', description: 'Shared code/model (symmetric)' },
  { value: 'partnership', label: 'Partnership', description: 'Mutual dependency (symmetric)' },
  { value: 'separate-ways', label: 'Separate Ways', description: 'No integration' },
]

export function RelationshipCreateDialog({
  fromContext,
  availableContexts,
  onConfirm,
  onCancel,
}: RelationshipCreateDialogProps) {
  const [toContextId, setToContextId] = React.useState('')
  const [pattern, setPattern] = React.useState('customer-supplier')
  const [description, setDescription] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (toContextId) {
      onConfirm(toContextId, pattern, description.trim() || undefined)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[480px] max-w-[90vw] border border-slate-200 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Add Relationship
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* From Context (read-only) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              From
            </label>
            <div className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300">
              {fromContext.name}
            </div>
          </div>

          {/* To Context */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              To (Target Context)
            </label>
            <select
              value={toContextId}
              onChange={(e) => setToContextId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
              required
            >
              <option value="">Select target context...</option>
              {availableContexts.map(ctx => (
                <option key={ctx.id} value={ctx.id}>
                  {ctx.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              DDD Pattern
            </label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
            >
              {DDD_PATTERNS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {/* Pattern description */}
            <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              {DDD_PATTERNS.find(p => p.value === pattern)?.description}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this relationship..."
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!toContextId}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-neutral-600 text-white rounded transition-colors disabled:cursor-not-allowed"
            >
              Add Relationship
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
