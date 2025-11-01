import React, { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../model/store'
import type { TemporalKeyframe } from '../model/types'
import { dateToNumeric, findNearestKeyframe, shouldSnapToKeyframe } from '../lib/temporal'
import { KeyframeEditor } from './KeyframeEditor'

export function TimeSlider() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const viewMode = useEditorStore(s => s.activeViewMode)
  const currentDate = useEditorStore(s => s.temporal.currentDate)
  const activeKeyframeId = useEditorStore(s => s.temporal.activeKeyframeId)
  const setCurrentDate = useEditorStore(s => s.setCurrentDate)
  const setActiveKeyframe = useEditorStore(s => s.setActiveKeyframe)
  const updateKeyframe = useEditorStore(s => s.updateKeyframe)
  const deleteKeyframe = useEditorStore(s => s.deleteKeyframe)

  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [editingKeyframe, setEditingKeyframe] = useState<TemporalKeyframe | null>(null)

  const keyframes = project?.temporal?.keyframes || []
  const currentYear = new Date().getFullYear()

  // Calculate year range: current year ± 10 years, or adjusted for keyframes
  const allYears = keyframes.map(kf => parseInt(kf.date.split('-')[0]))
  const minYear = Math.min(currentYear - 2, ...allYears)
  const maxYear = Math.max(currentYear + 10, ...allYears)
  const yearRange = maxYear - minYear

  // Convert position (0-100%) to date
  const positionToDate = (position: number): string => {
    const fraction = position / 100
    const yearValue = minYear + fraction * yearRange
    const year = Math.floor(yearValue)
    const quarterFraction = (yearValue - year) * 4
    const quarter = Math.floor(quarterFraction) + 1

    // For now, return year only (quarter support can be added later)
    return year.toString()
  }

  // Convert date to position (0-100%)
  const dateToPosition = (date: string): number => {
    const numericDate = dateToNumeric(date)
    return ((numericDate - minYear) / yearRange) * 100
  }

  // Handle slider drag
  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const position = (x / rect.width) * 100
    const newDate = positionToDate(Math.max(0, Math.min(100, position)))

    // Check if we should snap to a keyframe
    const nearest = findNearestKeyframe(newDate, keyframes)
    if (nearest && shouldSnapToKeyframe(newDate, nearest)) {
      setCurrentDate(nearest.date)
      setActiveKeyframe(nearest.id)
    } else {
      setCurrentDate(newDate)
      setActiveKeyframe(null)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleSliderClick(e)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const position = (x / rect.width) * 100
    const newDate = positionToDate(Math.max(0, Math.min(100, position)))

    // Check if we should snap to a keyframe
    const nearest = findNearestKeyframe(newDate, keyframes)
    if (nearest && shouldSnapToKeyframe(newDate, nearest)) {
      setCurrentDate(nearest.date)
      setActiveKeyframe(nearest.id)
    } else {
      setCurrentDate(newDate)
      setActiveKeyframe(null)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add mouse move/up listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, minYear, maxYear, yearRange])

  // Don't show time slider if not in Strategic View or temporal mode not enabled
  if (viewMode !== 'strategic' || !project?.temporal?.enabled) {
    return null
  }

  // Calculate current handle position
  const handlePosition = currentDate ? dateToPosition(currentDate) : dateToPosition(currentYear.toString())

  // Find active keyframe for display
  const activeKeyframe = activeKeyframeId
    ? keyframes.find(kf => kf.id === activeKeyframeId)
    : null

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
        <div
          ref={sliderRef}
          className="absolute top-10 left-0 right-0 h-2 bg-slate-200 dark:bg-neutral-700 rounded-full cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          {/* Keyframe markers */}
          {keyframes.map((keyframe) => {
            const position = dateToPosition(keyframe.date)

            return (
              <div
                key={keyframe.id}
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-800 cursor-pointer hover:scale-125 transition-transform shadow-md ${
                  keyframe.id === activeKeyframeId ? 'bg-blue-600 scale-125' : 'bg-blue-500'
                }`}
                style={{ left: `${position}%`, transform: 'translate(-50%, -50%)' }}
                title={`${keyframe.date}${keyframe.label ? ` - ${keyframe.label}` : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingKeyframe(keyframe)
                }}
              />
            )
          })}

          {/* Current position handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-700 dark:bg-slate-300 rounded-full border-2 border-white dark:border-neutral-800 cursor-grab active:cursor-grabbing shadow-lg z-10"
            style={{ left: `${handlePosition}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Status text */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 text-xs text-center">
          {keyframes.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400">
              Add a keyframe to project future evolution
            </div>
          ) : (
            <div className="text-slate-700 dark:text-slate-300">
              <span className="font-medium">{currentDate || currentYear.toString()}</span>
              {activeKeyframe && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  • Locked to keyframe: {activeKeyframe.label || activeKeyframe.date}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyframe Editor Modal */}
      {editingKeyframe && (
        <KeyframeEditor
          keyframe={editingKeyframe}
          onClose={() => setEditingKeyframe(null)}
          onUpdate={(updates) => updateKeyframe(editingKeyframe.id, updates)}
          onDelete={() => deleteKeyframe(editingKeyframe.id)}
        />
      )}
    </div>
  )
}
