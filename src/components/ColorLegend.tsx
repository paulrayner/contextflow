import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useEditorStore } from '../model/store'
import { InfoTooltip } from './InfoTooltip'
import {
  OWNERSHIP_DEFINITIONS,
  STRATEGIC_CLASSIFICATIONS,
  BOUNDARY_INTEGRITY,
} from '../model/conceptDefinitions'
import type { ConceptDefinition } from '../model/conceptDefinitions'

// Color constants matching CanvasArea.tsx
const OWNERSHIP_COLORS = {
  ours: '#d1fae5',
  internal: '#dbeafe',
  external: '#fed7aa',
}

const STRATEGIC_COLORS = {
  core: '#f8e7a1',
  supporting: '#dbeafe',
  generic: '#f3f4f6',
}

// Concept definitions for border style (not in conceptDefinitions.ts)
const BORDER_STYLE_DEFINITIONS: Record<string, ConceptDefinition> = {
  solid: {
    title: 'Solid Border',
    description: 'Contexts your organization owns and controls.',
  },
  dashed: {
    title: 'Dashed Border',
    description: 'Third-party contexts outside your control.',
  },
}

// Concept definition for Fill Color mode explanation
const FILL_COLOR_MODE_DEFINITION: ConceptDefinition = {
  title: 'Change Color Scheme',
  description: 'You can color contexts by Ownership (who owns it) or Strategic designation (core/supporting/generic).',
  characteristics: ['Settings → View Options → Context Colors'],
}

export function ColorLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const showColorLegend = useEditorStore(s => s.showColorLegend)
  const colorByMode = useEditorStore(s => s.colorByMode)

  if (!showColorLegend) {
    return null
  }

  return (
    <div className="absolute bottom-4 left-4 z-30">
      <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-md w-[220px]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-neutral-700">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Visual Guide
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-0.5 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Legend Content */}
        {!isCollapsed && (
          <div className="divide-y divide-slate-100 dark:divide-neutral-700">
            {/* Section 1: Fill Colors */}
            <div className="p-2">
              <InfoTooltip content={FILL_COLOR_MODE_DEFINITION} position="right">
                <div className="flex items-center gap-1.5 mb-1.5 px-2">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Fill Color:
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {colorByMode === 'ownership' ? 'Ownership' : 'Strategic'}
                  </span>
                </div>
              </InfoTooltip>

              {colorByMode === 'ownership' ? (
                <div className="space-y-0.5">
                  <LegendItem
                    color={OWNERSHIP_COLORS.ours}
                    label="Our Team"
                    content={OWNERSHIP_DEFINITIONS.ours}
                  />
                  <LegendItem
                    color={OWNERSHIP_COLORS.internal}
                    label="Internal (Other Team)"
                    content={OWNERSHIP_DEFINITIONS.internal}
                  />
                  <LegendItem
                    color={OWNERSHIP_COLORS.external}
                    label="External (Third Party)"
                    content={OWNERSHIP_DEFINITIONS.external}
                    dashed
                  />
                </div>
              ) : (
                <div className="space-y-0.5">
                  <LegendItem
                    color={STRATEGIC_COLORS.core}
                    label="Core Domain"
                    content={STRATEGIC_CLASSIFICATIONS.core}
                  />
                  <LegendItem
                    color={STRATEGIC_COLORS.supporting}
                    label="Supporting Subdomain"
                    content={STRATEGIC_CLASSIFICATIONS.supporting}
                  />
                  <LegendItem
                    color={STRATEGIC_COLORS.generic}
                    label="Generic Subdomain"
                    content={STRATEGIC_CLASSIFICATIONS.generic}
                  />
                </div>
              )}
            </div>

            {/* Section 2: Border Style */}
            <div className="p-2">
              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5 px-2">
                Border Style
              </div>
              <div className="space-y-0.5">
                <BorderStyleItem
                  borderStyle="solid"
                  label="Solid — Internal context"
                  content={BORDER_STYLE_DEFINITIONS.solid}
                />
                <BorderStyleItem
                  borderStyle="dashed"
                  label="Dashed — External context"
                  content={BORDER_STYLE_DEFINITIONS.dashed}
                />
              </div>
            </div>

            {/* Section 3: Border Thickness */}
            <div className="p-2">
              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5 px-2">
                Border Thickness
              </div>
              <div className="space-y-0.5">
                <BorderThicknessItem
                  thickness="3px"
                  borderStyle="solid"
                  label="Thick — Strong boundary"
                  content={BOUNDARY_INTEGRITY.strong}
                />
                <BorderThicknessItem
                  thickness="2px"
                  borderStyle="solid"
                  label="Medium — Moderate boundary"
                  content={BOUNDARY_INTEGRITY.moderate}
                />
                <BorderThicknessItem
                  thickness="1.5px"
                  borderStyle="dotted"
                  label="Thin dotted — Weak boundary"
                  content={BOUNDARY_INTEGRITY.weak}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface LegendItemProps {
  color: string
  label: string
  content: ConceptDefinition
  dashed?: boolean
}

function LegendItem({ color, label, content, dashed }: LegendItemProps) {
  return (
    <InfoTooltip content={content} position="right">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-neutral-700/50">
        <div
          className={`w-3.5 h-3.5 rounded flex-shrink-0 ${
            dashed
              ? 'border border-dashed border-slate-400 dark:border-slate-500'
              : 'border border-slate-300 dark:border-slate-500'
          }`}
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-slate-700 dark:text-slate-300">{label}</span>
      </div>
    </InfoTooltip>
  )
}

interface BorderStyleItemProps {
  borderStyle: 'solid' | 'dashed'
  label: string
  content: ConceptDefinition
}

function BorderStyleItem({ borderStyle, label, content }: BorderStyleItemProps) {
  return (
    <InfoTooltip content={content} position="right">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-neutral-700/50">
        <div
          className="w-6 h-3 rounded-sm flex-shrink-0 bg-slate-100 dark:bg-neutral-700"
          style={{
            border: `2px ${borderStyle} #64748b`,
          }}
        />
        <span className="text-xs text-slate-700 dark:text-slate-300">{label}</span>
      </div>
    </InfoTooltip>
  )
}

interface BorderThicknessItemProps {
  thickness: string
  borderStyle: 'solid' | 'dotted'
  label: string
  content: ConceptDefinition
}

function BorderThicknessItem({ thickness, borderStyle, label, content }: BorderThicknessItemProps) {
  return (
    <InfoTooltip content={content} position="right">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-neutral-700/50">
        <div
          className="w-6 h-3 rounded-sm flex-shrink-0 bg-slate-100 dark:bg-neutral-700"
          style={{
            border: `${thickness} ${borderStyle} #64748b`,
          }}
        />
        <span className="text-xs text-slate-700 dark:text-slate-300">{label}</span>
      </div>
    </InfoTooltip>
  )
}
