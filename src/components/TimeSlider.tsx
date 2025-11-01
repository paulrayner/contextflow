import React, { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../model/store'
import type { TemporalKeyframe } from '../model/types'
import { dateToNumeric, findNearestKeyframe, shouldSnapToKeyframe } from '../lib/temporal'
import { Copy, Trash2 } from 'lucide-react'

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
  const addKeyframe = useEditorStore(s => s.addKeyframe)

  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [editingKeyframeId, setEditingKeyframeId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [contextMenuKeyframe, setContextMenuKeyframe] = useState<{ keyframe: TemporalKeyframe; x: number; y: number } | null>(null)

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

  // Handle slider track click - create keyframe with double-click, scrub with single click
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

  const handleSliderDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const position = (x / rect.width) * 100
    const newDate = positionToDate(Math.max(0, Math.min(100, position)))

    // Don't create if too close to existing keyframe
    const nearest = findNearestKeyframe(newDate, keyframes)
    if (nearest && shouldSnapToKeyframe(newDate, nearest)) {
      return
    }

    // Create keyframe at this date
    addKeyframe(newDate, undefined)
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

  const handleKeyframeClick = (e: React.MouseEvent, keyframe: TemporalKeyframe) => {
    e.stopPropagation()
    // Start editing label
    setEditingKeyframeId(keyframe.id)
    setEditingLabel(keyframe.label || '')
  }

  const handleKeyframeContextMenu = (e: React.MouseEvent, keyframe: TemporalKeyframe) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuKeyframe({ keyframe, x: e.clientX, y: e.clientY })
  }

  const handleLabelChange = (keyframeId: string, newLabel: string) => {
    updateKeyframe(keyframeId, { label: newLabel.trim() || undefined })
    setEditingKeyframeId(null)
  }

  const handleDuplicateKeyframe = (keyframe: TemporalKeyframe) => {
    // Create a new keyframe one year later with same positions
    const year = parseInt(keyframe.date.split('-')[0])
    const newDate = `${year + 1}`

    // Check if date already exists
    if (keyframes.some(kf => kf.date === newDate)) {
      alert('A keyframe already exists at that date')
      return
    }

    addKeyframe(newDate, keyframe.label ? `${keyframe.label} (copy)` : undefined)
    setContextMenuKeyframe(null)
  }

  const handleDeleteKeyframe = (keyframe: TemporalKeyframe) => {
    if (window.confirm(`Delete keyframe "${keyframe.label || keyframe.date}"?`)) {
      deleteKeyframe(keyframe.id)
    }
    setContextMenuKeyframe(null)
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenuKeyframe(null)
    if (contextMenuKeyframe) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [contextMenuKeyframe])

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
          onDoubleClick={handleSliderDoubleClick}
        >
          {/* Keyframe markers */}
          {keyframes.map((keyframe) => {
            const position = dateToPosition(keyframe.date)
            const isEditing = editingKeyframeId === keyframe.id

            return (
              <div
                key={keyframe.id}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white dark:border-neutral-800 cursor-pointer hover:scale-125 transition-transform shadow-md ${
                    keyframe.id === activeKeyframeId ? 'bg-blue-600 scale-125' : 'bg-blue-500'
                  }`}
                  onClick={(e) => handleKeyframeClick(e, keyframe)}
                  onContextMenu={(e) => handleKeyframeContextMenu(e, keyframe)}
                  title={isEditing ? undefined : `${keyframe.date}${keyframe.label ? ` - ${keyframe.label}` : ''}\nClick to edit label, right-click for options`}
                />
                {/* Inline label editor */}
                {isEditing && (
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={() => handleLabelChange(keyframe.id, editingLabel)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLabelChange(keyframe.id, editingLabel)
                      } else if (e.key === 'Escape') {
                        setEditingKeyframeId(null)
                      }
                    }}
                    autoFocus
                    placeholder={keyframe.date}
                    className="absolute top-6 left-1/2 -translate-x-1/2 w-32 px-2 py-1 text-xs bg-white dark:bg-neutral-800 border border-blue-500 rounded shadow-lg text-slate-900 dark:text-slate-100 focus:outline-none z-50"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
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
              Double-click on timeline to add a keyframe
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

      {/* Context Menu */}
      {contextMenuKeyframe && (
        <div
          className="fixed bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenuKeyframe.x, top: contextMenuKeyframe.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDuplicateKeyframe(contextMenuKeyframe.keyframe)}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 flex items-center gap-2"
          >
            <Copy size={14} />
            Duplicate keyframe
          </button>
          <button
            onClick={() => handleDeleteKeyframe(contextMenuKeyframe.keyframe)}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete keyframe
          </button>
        </div>
      )}
    </div>
  )
}
