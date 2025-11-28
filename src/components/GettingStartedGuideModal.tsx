import React, { useState } from 'react'
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

type Approach = 'user-journey' | 'systems-first'

function UserJourneySteps() {
  return (
    <>
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

      <StepCard number={2} title="Add the User">
        <p>
          Add the person or role at the center of this journey.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Users size={14} className="text-slate-400" />
          <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ User</strong> in the toolbar</span>
        </div>
        <p className="mt-2">
          Mark as <em>external</em> (customers, partners) or <em>internal</em> (employees) in the inspector panel.
        </p>
      </StepCard>

      <StepCard number={3} title="Add Their Needs">
        <p>
          What is this user trying to accomplish? Add each need they have.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <FileText size={14} className="text-slate-400" />
          <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ Need</strong> — e.g., "Browse products", "Make payment", "Track order"</span>
        </div>
      </StepCard>

      <StepCard number={4} title="Map Needs to Systems">
        <p>
          For each need, add the system or service that fulfills it.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Box size={14} className="text-slate-400" />
          <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ Context</strong> — mark as external for third-party systems</span>
        </div>
        <p className="mt-3">
          Connect needs to contexts by dragging between them.
        </p>
      </StepCard>

      <StepCard number={5} title="Connect the Systems">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-slate-400" />
          <span>Drag from one context to another to show how they integrate.</span>
        </div>
        <p className="mt-2">
          Choose patterns like <em>Customer-Supplier</em>, <em>Anti-Corruption Layer</em>, or <em>Shared Kernel</em> to describe the relationship.
        </p>
        <TipBox>
          Don't worry about getting patterns perfect at first. You can always change them later.
        </TipBox>
      </StepCard>

      <StepCard number={6} title="Add Value Stream Stages">
        <p>
          Stages represent phases in your value stream—how value flows from user need to fulfillment.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <LayoutGrid size={14} className="text-slate-400" />
          <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ Stage</strong> — e.g., "Discovery", "Selection", "Transaction", "Fulfillment"</span>
        </div>
        <p className="mt-2">
          Drag contexts into stages to show which phase of the value stream they support.
        </p>
        <TipBox>
          If you've done Big Picture EventStorming, stages often map to your subprocess boundaries.
        </TipBox>
      </StepCard>

      <StepCard number={7} title="Go Deeper with Strategic Views">
        <p>
          Move beyond context mapping with two complementary strategic lenses:
        </p>
        <ul className="list-disc ml-5 space-y-2 mt-2 text-slate-500 dark:text-slate-400">
          <li>
            <strong className="text-slate-700 dark:text-slate-300">Distillation View</strong> (DDD) — Classify contexts as Core (competitive advantage), Supporting (necessary but not differentiating), or Generic (commodity). Helps prioritize where to invest engineering effort.
          </li>
          <li>
            <strong className="text-slate-700 dark:text-slate-300">Strategic View</strong> (Wardley Mapping) — Position contexts by evolution stage (Genesis → Custom → Product → Commodity). Reveals build-vs-buy decisions and where disruption may come.
          </li>
        </ul>
      </StepCard>
    </>
  )
}

function SystemsFirstSteps() {
  return (
    <>
      <StepCard number={1} title="Add Your Known Contexts">
        <p>
          Map out the systems and services you already know about.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Box size={14} className="text-slate-400" />
          <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ Context</strong> for each system</span>
        </div>
        <p className="mt-2">
          Mark contexts as <em>external</em> for third-party systems you don't own.
        </p>
        <TipBox>If you've done EventStorming, add each identified system as a context.</TipBox>
      </StepCard>

      <StepCard number={2} title="Connect the Systems">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-slate-400" />
          <span>Drag from one context to another to show how they integrate.</span>
        </div>
        <p className="mt-2">
          Choose patterns like <em>Customer-Supplier</em>, <em>Anti-Corruption Layer</em>, or <em>Shared Kernel</em> to describe the relationship.
        </p>
        <TipBox>
          Don't worry about getting patterns perfect at first. You can always change them later.
        </TipBox>
      </StepCard>

      <StepCard number={3} title="Add Users">
        <p>
          Now connect the problem space—who uses these systems?
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Users size={14} className="text-slate-400" />
          <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ User</strong> for each person or role</span>
        </div>
        <p className="mt-2">
          Mark as <em>external</em> (customers, partners) or <em>internal</em> (employees).
        </p>
      </StepCard>

      <StepCard number={4} title="Add Their Needs">
        <p>
          For each user, what are they trying to accomplish?
        </p>
        <div className="flex items-center gap-2 mt-2">
          <FileText size={14} className="text-slate-400" />
          <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ Need</strong> — e.g., "Browse products", "Make payment", "Track order"</span>
        </div>
        <p className="mt-3">
          Connect needs to the contexts that fulfill them by dragging between them.
        </p>
      </StepCard>

      <StepCard number={5} title="Add Value Stream Stages">
        <p>
          Stages represent phases in your value stream—how value flows from user need to fulfillment.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <LayoutGrid size={14} className="text-slate-400" />
          <span className="text-xs">Click <strong className="text-slate-700 dark:text-slate-300">+ Stage</strong> — e.g., "Discovery", "Selection", "Transaction", "Fulfillment"</span>
        </div>
        <p className="mt-2">
          Drag contexts into stages to show which phase of the value stream they support.
        </p>
        <TipBox>
          If you've done Big Picture EventStorming, your subprocess boundaries become stages here.
        </TipBox>
      </StepCard>

      <StepCard number={6} title="Go Deeper with Strategic Views">
        <p>
          Move beyond context mapping with two complementary strategic lenses:
        </p>
        <ul className="list-disc ml-5 space-y-2 mt-2 text-slate-500 dark:text-slate-400">
          <li>
            <strong className="text-slate-700 dark:text-slate-300">Distillation View</strong> (DDD) — Classify contexts as Core (competitive advantage), Supporting (necessary but not differentiating), or Generic (commodity). Helps prioritize where to invest engineering effort.
          </li>
          <li>
            <strong className="text-slate-700 dark:text-slate-300">Strategic View</strong> (Wardley Mapping) — Position contexts by evolution stage (Genesis → Custom → Product → Commodity). Reveals build-vs-buy decisions and where disruption may come.
          </li>
        </ul>
      </StepCard>
    </>
  )
}

export function GettingStartedGuideModal({ onClose, onViewSample }: GettingStartedGuideModalProps) {
  const [approach, setApproach] = useState<Approach | null>(null)

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

          {/* Approach selector */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Choose your approach:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setApproach('user-journey')}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  approach === 'user-journey'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
                  User Journey First
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trace a specific scenario through your systems. Great for discovery when you're still learning the landscape.
                </p>
              </button>
              <button
                onClick={() => setApproach('systems-first')}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  approach === 'systems-first'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
                  Systems First
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Map known contexts upfront (e.g., from EventStorming), then add users and needs. Great when the team already knows the systems.
                </p>
              </button>
            </div>
          </div>

          {/* Steps based on selected approach */}
          {approach === 'user-journey' && <UserJourneySteps />}
          {approach === 'systems-first' && <SystemsFirstSteps />}

          {/* Prompt to select if nothing selected */}
          {!approach && (
            <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
              Select an approach above to see the steps
            </div>
          )}
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
