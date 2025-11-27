import React from 'react'
import { X, User, FileText, Box, ArrowRight } from 'lucide-react'

interface ValueChainGuideModalProps {
  onClose: () => void
}

/**
 * Large SVG diagram showing the complete value chain model
 */
function ValueChainDiagram() {
  const boxStyle = "fill-slate-100 dark:fill-neutral-700 stroke-slate-400 dark:stroke-neutral-500"
  const textStyle = "fill-slate-700 dark:fill-slate-200 text-[11px] font-medium"
  const subtextStyle = "fill-slate-500 dark:fill-slate-400 text-[9px]"
  const arrowStyle = "stroke-slate-400 dark:stroke-slate-500"

  return (
    <svg viewBox="0 0 440 80" className="w-full h-20">
      {/* Actor */}
      <g>
        <rect x={10} y={20} width={100} height={40} rx={8} className="fill-slate-50 dark:fill-neutral-800 stroke-slate-300 dark:stroke-neutral-600" strokeWidth={2} />
        <text x={60} y={38} textAnchor="middle" className={textStyle}>Actor</text>
        <text x={60} y={52} textAnchor="middle" className={subtextStyle}>(who)</text>
      </g>

      {/* Arrow 1 */}
      <g className={arrowStyle}>
        <line x1={110} y1={40} x2={155} y2={40} strokeWidth={2} />
        <polygon points="165,40 155,35 155,45" className="fill-slate-400 dark:fill-slate-500" />
      </g>

      {/* User Need */}
      <g>
        <rect x={165} y={20} width={110} height={40} rx={6} className="fill-blue-50 dark:fill-blue-900/30 stroke-blue-400 dark:stroke-blue-500" strokeWidth={2} />
        <text x={220} y={38} textAnchor="middle" className="fill-blue-700 dark:fill-blue-300 text-[11px] font-medium">User Need</text>
        <text x={220} y={52} textAnchor="middle" className="fill-blue-500 dark:fill-blue-400 text-[9px]">(what problem)</text>
      </g>

      {/* Arrow 2 */}
      <g className={arrowStyle}>
        <line x1={275} y1={40} x2={320} y2={40} strokeWidth={2} />
        <polygon points="330,40 320,35 320,45" className="fill-slate-400 dark:fill-slate-500" />
      </g>

      {/* Context */}
      <g>
        <rect x={330} y={20} width={100} height={40} rx={4} className="fill-slate-50 dark:fill-neutral-800 stroke-slate-300 dark:stroke-neutral-600" strokeWidth={2} />
        <text x={380} y={38} textAnchor="middle" className={textStyle}>Context</text>
        <text x={380} y={52} textAnchor="middle" className={subtextStyle}>(how / solution)</text>
      </g>
    </svg>
  )
}

interface LayerCardProps {
  icon: React.ReactNode
  title: string
  description: string
  connectionRule: string
  examples: string[]
  color: 'slate' | 'blue'
}

function LayerCard({ icon, title, description, connectionRule, examples, color }: LayerCardProps) {
  const colorClasses = {
    slate: {
      border: 'border-slate-200 dark:border-neutral-700',
      iconBg: 'bg-slate-100 dark:bg-neutral-700',
      iconText: 'text-slate-600 dark:text-slate-300',
    },
    blue: {
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconText: 'text-blue-600 dark:text-blue-400',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className={`border ${colors.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${colors.iconBg} ${colors.iconText} p-2 rounded-lg shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
            {title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {description}
          </p>

          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Connections: </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{connectionRule}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Examples: </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{examples.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ValueChainGuideModal({ onClose }: ValueChainGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[85vh] border border-slate-200 dark:border-neutral-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Value Chain Model
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              How Actors, User Needs, and Contexts connect
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Main diagram */}
          <div className="bg-slate-50 dark:bg-neutral-900 rounded-lg p-4 border border-slate-200 dark:border-neutral-700">
            <ValueChainDiagram />
          </div>

          {/* Explanation */}
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              The <strong className="text-slate-700 dark:text-slate-300">value chain</strong> shows how your system delivers value to users:
            </p>
            <ol className="list-decimal ml-5 space-y-1">
              <li><strong className="text-slate-700 dark:text-slate-300">Actors</strong> represent the people or systems that use your product</li>
              <li><strong className="text-slate-700 dark:text-slate-300">User Needs</strong> capture the problems or jobs those actors are trying to accomplish</li>
              <li><strong className="text-slate-700 dark:text-slate-300">Contexts</strong> are the bounded contexts (parts of your system) that address those needs</li>
            </ol>
          </div>

          {/* Layer cards */}
          <div className="space-y-3">
            <LayerCard
              icon={<User size={20} />}
              title="Actors"
              description="People, teams, or external systems that interact with your product. They can be internal (employees, teams) or external (customers, partners)."
              connectionRule="Connect to User Needs only"
              examples={['Customer', 'Admin', 'Payment Provider', 'Support Agent']}
              color="slate"
            />

            <LayerCard
              icon={<FileText size={20} />}
              title="User Needs"
              description="The problems, goals, or jobs-to-be-done that actors are trying to accomplish. These represent value from the user's perspective."
              connectionRule="Connect from Actors, connect to Contexts"
              examples={['Browse products', 'Track my order', 'Process refund', 'Generate reports']}
              color="blue"
            />

            <LayerCard
              icon={<Box size={20} />}
              title="Bounded Contexts"
              description="The logical boundaries in your system that solve specific problems. Each context has its own domain model and vocabulary."
              connectionRule="Connect from User Needs, connect to other Contexts"
              examples={['Catalog', 'Ordering', 'Shipping', 'Payments']}
              color="slate"
            />
          </div>

          {/* Why this matters */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
              Why can't I connect Actors directly to Contexts?
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              User Needs act as the bridge between <em>who</em> uses your system and <em>how</em> it's built.
              This ensures your architecture is driven by real user problems, not just technical boundaries.
              It also helps identify which contexts are user-facing vs. supporting infrastructure.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-neutral-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-200 rounded transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
