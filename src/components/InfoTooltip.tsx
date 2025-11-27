import React, { ReactNode } from 'react'
import { useEditorStore } from '../model/store'
import type { ConceptDefinition } from '../model/conceptDefinitions'

interface InfoTooltipProps {
  content: ConceptDefinition
  children: ReactNode
  /** Position relative to the trigger element */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Additional class names for the wrapper */
  className?: string
}

/**
 * A hover tooltip that displays educational content about DDD and Wardley Mapping concepts.
 * Respects the global showHelpTooltips setting.
 */
export function InfoTooltip({
  content,
  children,
  position = 'bottom',
  className = '',
}: InfoTooltipProps) {
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)

  if (!showHelpTooltips) {
    return <>{children}</>
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-700 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-700 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-700 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-700 border-y-transparent border-l-transparent',
  }

  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {children}
      <div
        className={`
          absolute z-50 ${positionClasses[position]}
          opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible
          transition-opacity duration-150
          pointer-events-none
        `}
      >
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
        />
        {/* Tooltip content */}
        <div className="w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg text-left">
          <div className="font-semibold text-sm mb-1">{content.title}</div>
          <div className="text-xs text-slate-300 mb-2">{content.description}</div>
          {content.characteristics && content.characteristics.length > 0 && (
            <ul className="text-xs text-slate-300 space-y-0.5">
              {content.characteristics.map((item, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="text-slate-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </span>
  )
}
