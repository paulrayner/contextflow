import React from 'react'
import { X, Users, FileText, Box, GitBranch, LayoutGrid, Lightbulb } from 'lucide-react'

interface GettingStartedGuideModalProps {
  onClose: () => void
  onViewSample?: () => void
}

interface StepCardProps {
  number: number
  title: string
  children: React.ReactNode
}

function StepCard({ number, title, children }: StepCardProps) {
  return (
    <div className="border border-slate-200 dark:border-neutral-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold shrink-0">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            {title}
          </h4>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mt-3">
      <Lightbulb size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 dark:text-amber-400">
        {children}
      </p>
    </div>
  )
}

export function GettingStartedGuideModal({ onClose, onViewSample }: GettingStartedGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[85vh] border border-slate-200 dark:border-neutral-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Getting Started Guide
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              How to create your first context map
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close getting started guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Introduction */}
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p>
              Context mapping helps you visualize how different parts of your system connect and serve your users.
              Start by following a single user journey through your domain.
            </p>
          </div>

          {/* Philosophy callout */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 text-sm mb-2">
              Focus on usefulness, not perfection
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Your map is a discovery tool—use it to explore the landscape, challenge assumptions,
              and guide future investment. Don't aim for a perfect model. Aim for one that sparks
              useful conversations and helps you make better decisions.
            </p>
          </div>

          {/* Step 1 */}
          <StepCard number={1} title="Choose a User Journey">
            <p>Pick a specific scenario to map:</p>
            <ul className="list-disc ml-5 space-y-1 text-slate-500 dark:text-slate-400">
              <li>Customer making a purchase</li>
              <li>User uploading and processing a file</li>
              <li>Admin generating a report</li>
              <li>Support rep handling a ticket</li>
            </ul>
            <TipBox>Start with something you know well. You can always add more journeys later.</TipBox>
          </StepCard>

          {/* Step 2 */}
          <StepCard number={2} title="Identify Who's Involved">
            <p>
              Add <strong className="text-slate-700 dark:text-slate-300">Users</strong> for each person or role in the journey.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Users size={14} className="text-slate-400" />
              <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ User</strong> in the toolbar</span>
            </div>
            <p className="mt-2">
              Mark users as <em>external</em> (customers, partners) or <em>internal</em> (employees) in the inspector panel.
            </p>
          </StepCard>

          {/* Step 3 */}
          <StepCard number={3} title="Map Their Needs to Systems">
            <p>
              For each user, add what they need to accomplish, then connect those needs to the systems that fulfill them.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-slate-400" />
                <span className="text-xs"><strong className="text-slate-700 dark:text-slate-300">+ Need</strong> — what the user is trying to do</span>
              </div>
              <div className="flex items-center gap-2">
                <Box size={14} className="text-slate-400" />
                <span className="text-xs"><strong className="text-slate-700 dark:text-slate-300">+ Context</strong> — each system or service handling a step</span>
              </div>
            </div>
            <p className="mt-3">
              Ask yourself: <em>What system handles this step? Is it internal (you own it) or external (third-party)?</em>
            </p>
          </StepCard>

          {/* Step 4 */}
          <StepCard number={4} title="Connect the Systems">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-slate-400" />
              <span>Drag from one context to another to show how they integrate.</span>
            </div>
            <p className="mt-2">
              Choose patterns like <em>Customer-Supplier</em>, <em>Anti-Corruption Layer</em>, or <em>Shared Kernel</em> to describe the relationship.
            </p>
            <TipBox>
              Don't worry about getting patterns perfect at first. You can always change them later in the inspector panel.
            </TipBox>
          </StepCard>

          {/* Step 5 */}
          <StepCard number={5} title="Organize Your Map (Optional)">
            <div className="flex items-center gap-2">
              <LayoutGrid size={14} className="text-slate-400" />
              <span>Add structure to make your map easier to read.</span>
            </div>
            <ul className="list-disc ml-5 space-y-1 mt-2 text-slate-500 dark:text-slate-400">
              <li>
                <strong className="text-slate-700 dark:text-slate-300">+ Stage</strong> — organize contexts into flow stages
                (e.g., Discovery → Selection → Transaction → Fulfillment)
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">Distillation View</strong> — classify contexts as Core, Supporting, or Generic
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">Strategic View</strong> — position contexts by evolution stage
              </li>
            </ul>
          </StepCard>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-neutral-700 shrink-0 flex gap-3">
          {onViewSample && (
            <button
              onClick={onViewSample}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Explore Sample Project
            </button>
          )}
          <button
            onClick={onClose}
            className={`${onViewSample ? 'flex-1' : 'w-full'} px-4 py-2 text-sm bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-slate-200 rounded transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
