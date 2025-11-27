import React from 'react'
import { X } from 'lucide-react'
import {
  PATTERN_DEFINITIONS,
  POWER_DYNAMICS_ICONS,
  getPatternsByCategory,
  type PatternDefinition,
  type PatternCategory,
} from '../model/patternDefinitions'

interface PatternsGuideModalProps {
  onClose: () => void
}

const CATEGORY_LABELS: Record<PatternCategory, { title: string; description: string }> = {
  'upstream-downstream': {
    title: 'Upstream/Downstream Patterns',
    description: 'One team has more control or influence over the integration.',
  },
  'mutual': {
    title: 'Mutual Patterns',
    description: 'Teams share control and must coordinate closely.',
  },
  'autonomous': {
    title: 'Autonomous Patterns',
    description: 'Teams operate independently without integration.',
  },
}

const POWER_DYNAMICS_LABELS: Record<string, string> = {
  upstream: 'Upstream has control',
  downstream: 'Downstream protects itself',
  mutual: 'Shared control',
  none: 'No dependency',
}

function PatternCard({ pattern }: { pattern: PatternDefinition }) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="border border-slate-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-750 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{POWER_DYNAMICS_ICONS[pattern.powerDynamics]}</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {pattern.label}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {expanded ? '▼' : '▶'}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {pattern.shortDescription}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-3 bg-white dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-700">
          {/* Power dynamics */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">Power:</span>
            <span className="text-slate-600 dark:text-slate-400">
              {POWER_DYNAMICS_LABELS[pattern.powerDynamics]}
            </span>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pattern.detailedDescription}
            </p>
          </div>

          {/* When to use */}
          <div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              When to Use
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
              {pattern.whenToUse.map((item, i) => (
                <li key={i} className="list-disc">{item}</li>
              ))}
            </ul>
          </div>

          {/* Example */}
          <div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Example
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
              {pattern.example}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function PatternsGuideModal({ onClose }: PatternsGuideModalProps) {
  const patternsByCategory = getPatternsByCategory()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[640px] max-w-[90vw] max-h-[85vh] border border-slate-200 dark:border-neutral-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Context Relationship Patterns
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              DDD patterns for integrating bounded contexts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-neutral-850 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Power Dynamics Legend
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span><span className="text-base mr-1">↑</span> Upstream has control</span>
            <span><span className="text-base mr-1">↓</span> Downstream protects itself</span>
            <span><span className="text-base mr-1">↔</span> Shared control</span>
            <span><span className="text-base mr-1">○</span> No integration</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {(Object.keys(patternsByCategory) as PatternCategory[]).map(category => (
            <div key={category}>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {CATEGORY_LABELS[category].title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {CATEGORY_LABELS[category].description}
                </p>
              </div>
              <div className="space-y-2">
                {patternsByCategory[category].map(pattern => (
                  <PatternCard key={pattern.value} pattern={pattern} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-neutral-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
