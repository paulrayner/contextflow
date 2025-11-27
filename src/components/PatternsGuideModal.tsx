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

const CATEGORY_LABELS: Record<PatternCategory, { title: string; description: string; note?: string }> = {
  'upstream-downstream': {
    title: 'Upstream/Downstream Patterns',
    description: 'One team has more control or influence over the integration.',
    note: '"Upstream/downstream" refers to control, not data flow direction.',
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

/**
 * SVG diagram showing the relationship pattern visually
 */
function PatternDiagram({ pattern }: { pattern: PatternDefinition['value'] }) {
  const boxStyle = "fill-slate-100 dark:fill-neutral-700 stroke-slate-400 dark:stroke-neutral-500"
  const textStyle = "fill-slate-700 dark:fill-slate-300 text-[9px] font-medium"
  const arrowStyle = "stroke-slate-500 dark:stroke-slate-400"
  const highlightStyle = "fill-blue-100 dark:fill-blue-900/30 stroke-blue-400 dark:stroke-blue-500"

  // Common elements
  const DownstreamBox = ({ x = 10, highlight = false }: { x?: number; highlight?: boolean }) => (
    <g>
      <rect x={x} y={15} width={60} height={30} rx={3} className={highlight ? highlightStyle : boxStyle} strokeWidth={1.5} />
      <text x={x + 30} y={33} textAnchor="middle" className={textStyle}>Downstream</text>
    </g>
  )

  const UpstreamBox = ({ x = 130, highlight = false }: { x?: number; highlight?: boolean }) => (
    <g>
      <rect x={x} y={15} width={60} height={30} rx={3} className={highlight ? highlightStyle : boxStyle} strokeWidth={1.5} />
      <text x={x + 30} y={33} textAnchor="middle" className={textStyle}>Upstream</text>
    </g>
  )

  const Arrow = ({ fromX = 70, toX = 130 }: { fromX?: number; toX?: number }) => (
    <g className={arrowStyle}>
      <line x1={fromX} y1={30} x2={toX - 6} y2={30} strokeWidth={1.5} />
      <polygon points={`${toX},30 ${toX - 8},26 ${toX - 8},34`} className="fill-slate-500 dark:fill-slate-400" />
    </g>
  )

  const BidirectionalArrow = () => (
    <g className={arrowStyle}>
      <line x1={76} y1={30} x2={124} y2={30} strokeWidth={1.5} />
      <polygon points="70,30 78,26 78,34" className="fill-slate-500 dark:fill-slate-400" />
      <polygon points="130,30 122,26 122,34" className="fill-slate-500 dark:fill-slate-400" />
    </g>
  )

  const diagrams: Record<PatternDefinition['value'], React.ReactNode> = {
    'customer-supplier': (
      <svg viewBox="0 0 200 60" className="w-full h-14">
        <DownstreamBox />
        <Arrow />
        <UpstreamBox highlight />
        <text x={100} y={52} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[8px]">
          negotiates priorities
        </text>
      </svg>
    ),
    'conformist': (
      <svg viewBox="0 0 200 60" className="w-full h-14">
        <DownstreamBox />
        <Arrow />
        <UpstreamBox highlight />
        <text x={100} y={52} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[8px]">
          adopts model as-is
        </text>
      </svg>
    ),
    'anti-corruption-layer': (
      <svg viewBox="0 0 200 60" className="w-full h-14">
        <DownstreamBox highlight />
        {/* ACL shield/barrier */}
        <rect x={78} y={12} width={12} height={36} rx={2} className="fill-amber-100 dark:fill-amber-900/40 stroke-amber-500 dark:stroke-amber-400" strokeWidth={1.5} />
        <text x={84} y={34} textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[8px] font-bold">A</text>
        <Arrow fromX={90} />
        <UpstreamBox />
        <text x={100} y={52} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[8px]">
          translation layer
        </text>
      </svg>
    ),
    'open-host-service': (
      <svg viewBox="0 0 200 60" className="w-full h-14">
        <DownstreamBox />
        <Arrow />
        {/* API symbol on upstream */}
        <UpstreamBox highlight />
        <rect x={172} y={22} width={16} height={16} rx={2} className="fill-green-100 dark:fill-green-900/40 stroke-green-500 dark:stroke-green-400" strokeWidth={1} />
        <text x={180} y={33} textAnchor="middle" className="fill-green-600 dark:fill-green-400 text-[7px] font-bold">API</text>
        <text x={100} y={52} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[8px]">
          public interface
        </text>
      </svg>
    ),
    'published-language': (
      <svg viewBox="0 0 200 60" className="w-full h-14">
        <DownstreamBox />
        {/* Shared schema symbol */}
        <rect x={85} y={20} width={30} height={20} rx={2} className="fill-purple-100 dark:fill-purple-900/40 stroke-purple-500 dark:stroke-purple-400" strokeWidth={1.5} />
        <text x={100} y={33} textAnchor="middle" className="fill-purple-600 dark:fill-purple-400 text-[7px] font-bold">JSON</text>
        <UpstreamBox highlight />
        <line x1={70} y1={30} x2={85} y2={30} className={arrowStyle} strokeWidth={1.5} />
        <line x1={115} y1={30} x2={130} y2={30} className={arrowStyle} strokeWidth={1.5} />
        <text x={100} y={52} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[8px]">
          shared format
        </text>
      </svg>
    ),
    'shared-kernel': (
      <svg viewBox="0 0 200 60" className="w-full h-14">
        {/* Overlapping contexts */}
        <rect x={10} y={15} width={70} height={30} rx={3} className={boxStyle} strokeWidth={1.5} />
        <rect x={120} y={15} width={70} height={30} rx={3} className={boxStyle} strokeWidth={1.5} />
        {/* Shared kernel in middle */}
        <rect x={65} y={10} width={70} height={40} rx={3} className="fill-orange-100 dark:fill-orange-900/30 stroke-orange-400 dark:stroke-orange-500" strokeWidth={1.5} strokeDasharray="4,2" />
        <text x={45} y={33} textAnchor="middle" className={textStyle}>Team A</text>
        <text x={155} y={33} textAnchor="middle" className={textStyle}>Team B</text>
        <text x={100} y={35} textAnchor="middle" className="fill-orange-600 dark:fill-orange-400 text-[8px] font-medium">Shared</text>
        <text x={100} y={55} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[8px]">
          joint ownership
        </text>
      </svg>
    ),
    'partnership': (
      <svg viewBox="0 0 200 60" className="w-full h-14">
        <DownstreamBox x={20} highlight />
        <BidirectionalArrow />
        <UpstreamBox x={120} highlight />
        <text x={20 + 30} y={33} textAnchor="middle" className={textStyle}>Team A</text>
        <text x={120 + 30} y={33} textAnchor="middle" className={textStyle}>Team B</text>
        <text x={100} y={52} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[8px]">
          mutual dependency
        </text>
      </svg>
    ),
    'separate-ways': (
      <svg viewBox="0 0 200 60" className="w-full h-14">
        <rect x={20} y={15} width={60} height={30} rx={3} className={boxStyle} strokeWidth={1.5} />
        <rect x={120} y={15} width={60} height={30} rx={3} className={boxStyle} strokeWidth={1.5} />
        <text x={50} y={33} textAnchor="middle" className={textStyle}>Context A</text>
        <text x={150} y={33} textAnchor="middle" className={textStyle}>Context B</text>
        {/* X mark indicating no connection */}
        <g className="stroke-red-400 dark:stroke-red-500" strokeWidth={2}>
          <line x1={92} y1={24} x2={108} y2={36} />
          <line x1={108} y1={24} x2={92} y2={36} />
        </g>
        <text x={100} y={52} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[8px]">
          no integration
        </text>
      </svg>
    ),
  }

  return diagrams[pattern] || null
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
          {/* Diagram */}
          <div className="bg-slate-50 dark:bg-neutral-800 rounded-md p-2 border border-slate-200 dark:border-neutral-700">
            <PatternDiagram pattern={pattern.value} />
          </div>

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
                {CATEGORY_LABELS[category].note && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                    ⚠️ {CATEGORY_LABELS[category].note}
                  </p>
                )}
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
