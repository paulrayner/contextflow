import React, { useState } from 'react'
import { useEditorStore } from '../model/store'
import type { TemporalKeyframe } from '../model/types'

export function TimeSlider() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const viewMode = useEditorStore(s => s.activeViewMode)

  // Don't show time slider if not in Strategic View or temporal mode not enabled
  if (viewMode !== 'strategic' || !project?.temporal?.enabled) {
    return null
  }

  const keyframes = project.temporal.keyframes || []
  const currentYear = new Date().getFullYear()

  // Calculate year range: current year ± 10 years, or adjusted for keyframes
  const allYears = keyframes.map(kf => parseInt(kf.date.split('-')[0]))
  const minYear = Math.min(currentYear - 2, ...allYears)
  const maxYear = Math.max(currentYear + 10, ...allYears)
  const yearRange = maxYear - minYear

  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-white dark:bg-neutral-800 border-t border-slate-200 dark:border-neutral-700 flex items-center px-8 z-20">
      <div className="relative flex-1 h-16">
        {/* Year markers */}
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center">
          {Array.from({ length: yearRange + 1 }, (_, i) => minYear + i).map((year) => {
            const position = ((year - minYear) / yearRange) * 100
            const isCurrentYear = year === currentYear

            return (
              <div
                key={year}
                className="absolute"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {year}
                </div>
                {isCurrentYear && (
                  <div className="absolute top-6 w-px h-3 bg-blue-500" style={{ left: '50%', transform: 'translateX(-50%)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Slider track */}
        <div className="absolute top-10 left-0 right-0 h-2 bg-slate-200 dark:bg-neutral-700 rounded-full">
          {/* Keyframe markers */}
          {keyframes.map((keyframe) => {
            const year = parseInt(keyframe.date.split('-')[0])
            let quarterOffset = 0

            // Handle quarter offsets (Q1 = 0, Q2 = 0.25, Q3 = 0.5, Q4 = 0.75)
            const quarterMatch = keyframe.date.match(/-Q([1-4])/)
            if (quarterMatch) {
              const quarter = parseInt(quarterMatch[1])
              quarterOffset = (quarter - 1) / 4
            } else {
              // If no quarter specified, treat as Q2.5 (mid-year)
              quarterOffset = 0.375
            }

            const position = ((year + quarterOffset - minYear) / yearRange) * 100

            return (
              <div
                key={keyframe.id}
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-neutral-800 cursor-pointer hover:scale-125 transition-transform shadow-md"
                style={{ left: `${position}%`, transform: 'translate(-50%, -50%)' }}
                title={`${keyframe.date}${keyframe.label ? ` - ${keyframe.label}` : ''}`}
              />
            )
          })}
        </div>

        {/* Help text when no keyframes */}
        {keyframes.length === 0 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 text-xs text-slate-500 dark:text-slate-400">
            Add a keyframe to project future evolution
          </div>
        )}
      </div>
    </div>
  )
}
