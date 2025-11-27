import React, { useRef, useEffect } from 'react'
import { User, FileText, Box } from 'lucide-react'

interface ConnectionGuidanceTooltipProps {
  sourceType: 'actor' | 'userNeed' | 'context'
  targetType: 'actor' | 'userNeed' | 'context'
  position: { x: number; y: number }
  onDismiss: () => void
  onCreateUserNeed: () => void
  onLearnMore: () => void
}

const TYPE_LABELS: Record<string, string> = {
  actor: 'Actor',
  userNeed: 'User Need',
  context: 'Context',
}

/**
 * SVG diagram showing Actor → UserNeed → Context flow
 */
function ValueChainDiagram() {
  const boxStyle = "fill-slate-100 dark:fill-neutral-700 stroke-slate-400 dark:stroke-neutral-500"
  const textStyle = "fill-slate-600 dark:fill-slate-300 text-[8px]"
  const arrowStyle = "stroke-slate-400 dark:stroke-slate-500"

  return (
    <svg viewBox="0 0 200 40" className="w-full h-10">
      {/* Actor - octagon approximated as rounded rect */}
      <rect x={5} y={10} width={50} height={20} rx={6} className={boxStyle} strokeWidth={1.5} />
      <text x={30} y={23} textAnchor="middle" className={textStyle}>Actor</text>

      {/* Arrow 1 */}
      <g className={arrowStyle}>
        <line x1={55} y1={20} x2={70} y2={20} strokeWidth={1.5} />
        <polygon points="75,20 69,17 69,23" className="fill-slate-400 dark:fill-slate-500" />
      </g>

      {/* User Need - rounded rect */}
      <rect x={75} y={10} width={50} height={20} rx={4} className="fill-blue-50 dark:fill-blue-900/30 stroke-blue-400 dark:stroke-blue-500" strokeWidth={1.5} />
      <text x={100} y={23} textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-[8px]">User Need</text>

      {/* Arrow 2 */}
      <g className={arrowStyle}>
        <line x1={125} y1={20} x2={140} y2={20} strokeWidth={1.5} />
        <polygon points="145,20 139,17 139,23" className="fill-slate-400 dark:fill-slate-500" />
      </g>

      {/* Context - rect */}
      <rect x={145} y={10} width={50} height={20} rx={3} className={boxStyle} strokeWidth={1.5} />
      <text x={170} y={23} textAnchor="middle" className={textStyle}>Context</text>
    </svg>
  )
}

export function ConnectionGuidanceTooltip({
  sourceType,
  targetType,
  position,
  onDismiss,
  onCreateUserNeed,
  onLearnMore,
}: ConnectionGuidanceTooltipProps) {
  const ref = useRef<HTMLDivElement>(null)
  const sourceLabel = TYPE_LABELS[sourceType] || sourceType
  const targetLabel = TYPE_LABELS[targetType] || targetType

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss()
      }
    }
    // Delay adding listener to avoid immediate dismissal from the connection drop
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onDismiss])

  // Determine if we should show the "Create User Need" button
  // Only makes sense when connecting Actor → Context
  const showCreateUserNeed = sourceType === 'actor' && targetType === 'context'

  // Constrain tooltip to viewport
  const tooltipWidth = 280
  const tooltipHeight = 180
  const padding = 16

  let left = position.x - tooltipWidth / 2
  let top = position.y - tooltipHeight - 10

  // Keep within viewport bounds
  if (left < padding) left = padding
  if (left + tooltipWidth > window.innerWidth - padding) {
    left = window.innerWidth - tooltipWidth - padding
  }
  if (top < padding) {
    // Show below instead
    top = position.y + 20
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ left, top }}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 p-4 w-[280px]">
        {/* Diagram */}
        <div className="bg-slate-50 dark:bg-neutral-900 rounded-md p-2 mb-3 border border-slate-200 dark:border-neutral-700">
          <ValueChainDiagram />
        </div>

        {/* Explanation text */}
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
          <span className="font-medium">{sourceLabel}</span> cannot connect directly to <span className="font-medium">{targetLabel}</span>.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Actors connect through User Needs, which represent the problems your users are trying to solve.
        </p>

        {/* Action buttons */}
        <div className="flex gap-2">
          {showCreateUserNeed && (
            <button
              onClick={onCreateUserNeed}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Create User Need
            </button>
          )}
          <button
            onClick={onLearnMore}
            className={`${showCreateUserNeed ? '' : 'flex-1'} px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-200 rounded transition-colors`}
          >
            Learn more
          </button>
        </div>
      </div>
    </div>
  )
}
