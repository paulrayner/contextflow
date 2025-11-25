import React, { useMemo, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  Panel,
  NodeProps,
  EdgeProps,
  getBezierPath,
  getStraightPath,
  Position,
  Handle,
  useViewport,
  useReactFlow,
  NodeDragHandler,
  useNodesState,
  useNodesInitialized,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { useEditorStore, setFitViewCallback } from '../model/store'
import type { BoundedContext, Relationship, Group, Actor, UserNeed, ActorNeedConnection, NeedContextConnection } from '../model/types'
import { User, Target } from 'lucide-react'
import { TimeSlider } from './TimeSlider'
import { interpolatePosition, isContextVisibleAtDate, getContextOpacity } from '../lib/temporal'
import { generateBlobPath } from '../lib/blobShape'
import { calculateBoundingBox, translateContextsToRelative, calculateBlobPosition } from '../lib/blobPositioning'
import { DISTILLATION_GENERIC_MAX_X, DISTILLATION_CORE_MIN_X, DISTILLATION_CORE_MIN_Y } from '../model/classification'

// Node size mapping
const NODE_SIZES = {
  tiny: { width: 120, height: 70 },
  small: { width: 140, height: 80 },
  medium: { width: 170, height: 100 },
  large: { width: 200, height: 120 },
  huge: { width: 240, height: 140 },
}

// Helper functions for dynamic edge positioning (floating edges pattern)
function getNodeIntersection(intersectionNode: Node, targetNode: Node) {
  const w = intersectionNode.width ?? 0
  const h = intersectionNode.height ?? 0

  const x2 = intersectionNode.position.x + w / 2
  const y2 = intersectionNode.position.y + h / 2
  const x1 = targetNode.position.x + (targetNode.width ?? 0) / 2
  const y1 = targetNode.position.y + (targetNode.height ?? 0) / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1))
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (-xx3 + yy3) + y2

  return { x, y }
}

function getEdgePosition(node: Node, intersectionPoint: { x: number; y: number }) {
  const nx = node.position.x
  const ny = node.position.y
  const nw = node.width ?? 0
  const nh = node.height ?? 0

  // Calculate distances to each edge
  const distToLeft = Math.abs(intersectionPoint.x - nx)
  const distToRight = Math.abs(intersectionPoint.x - (nx + nw))
  const distToTop = Math.abs(intersectionPoint.y - ny)
  const distToBottom = Math.abs(intersectionPoint.y - (ny + nh))

  // Return the closest edge
  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

  if (minDist === distToLeft) return Position.Left
  if (minDist === distToRight) return Position.Right
  if (minDist === distToTop) return Position.Top
  return Position.Bottom
}

function getEdgeParams(source: Node, target: Node) {
  const sourceIntersectionPoint = getNodeIntersection(source, target)
  const targetIntersectionPoint = getNodeIntersection(target, source)

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint)
  const targetPos = getEdgePosition(target, targetIntersectionPoint)

  // Calculate handle positions (center of the edge side)
  const sourceX = source.position.x + (source.width ?? 0) / 2
  const sourceY = source.position.y + (source.height ?? 0) / 2
  const targetX = target.position.x + (target.width ?? 0) / 2
  const targetY = target.position.y + (target.height ?? 0) / 2

  // Adjust to edge center based on position
  const sx = sourcePos === Position.Left ? source.position.x
           : sourcePos === Position.Right ? source.position.x + (source.width ?? 0)
           : sourceX
  const sy = sourcePos === Position.Top ? source.position.y
           : sourcePos === Position.Bottom ? source.position.y + (source.height ?? 0)
           : sourceY
  const tx = targetPos === Position.Left ? target.position.x
           : targetPos === Position.Right ? target.position.x + (target.width ?? 0)
           : targetX
  const ty = targetPos === Position.Top ? target.position.y
           : targetPos === Position.Bottom ? target.position.y + (target.height ?? 0)
           : targetY

  return { sx, sy, tx, ty, sourcePos, targetPos }
}

// Custom node component
function ContextNode({ data }: NodeProps) {
  const context = data.context as BoundedContext
  const isSelected = data.isSelected as boolean
  const isMemberOfSelectedGroup = data.isMemberOfSelectedGroup as boolean
  const opacity = data.opacity as number | undefined
  const [isHovered, setIsHovered] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null)
  const assignRepoToContext = useEditorStore(s => s.assignRepoToContext)
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const viewMode = useEditorStore(s => s.activeViewMode)
  const activeKeyframeId = useEditorStore(s => s.temporal.activeKeyframeId)
  const updateKeyframe = useEditorStore(s => s.updateKeyframe)

  const size = NODE_SIZES[context.codeSize?.bucket || 'medium']

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only show context menu in Strategic View with an active keyframe
    const isEditingKeyframe = viewMode === 'strategic' && project?.temporal?.enabled && activeKeyframeId
    if (!isEditingKeyframe) return

    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  // Close context menu
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  // Handle hide/show in keyframe
  const handleToggleVisibility = () => {
    if (!activeKeyframeId || !project?.temporal) return

    const keyframe = project.temporal.keyframes.find(kf => kf.id === activeKeyframeId)
    if (!keyframe) return

    const isCurrentlyVisible = keyframe.activeContextIds.includes(context.id)
    const newActiveContextIds = isCurrentlyVisible
      ? keyframe.activeContextIds.filter(id => id !== context.id)
      : [...keyframe.activeContextIds, context.id]

    updateKeyframe(activeKeyframeId, { activeContextIds: newActiveContextIds })
    setContextMenu(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('application/contextflow-repo')) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const repoId = e.dataTransfer.getData('application/contextflow-repo')
    if (repoId) {
      assignRepoToContext(repoId, context.id)
    }
  }

  // Fill color based on strategic classification
  const fillColor =
    context.strategicClassification === 'core' ? '#f8e7a1' :
    context.strategicClassification === 'supporting' ? '#dbeafe' : '#f3f4f6'

  // Border style based on boundary integrity
  const borderWidth =
    context.boundaryIntegrity === 'strong' ? '3px' :
    context.boundaryIntegrity === 'moderate' ? '2px' : '2px'

  const borderStyle =
    context.boundaryIntegrity === 'weak' ? 'dashed' : 'solid'

  // Consolidated highlight state for selected or group member contexts
  const isHighlighted = isSelected || isMemberOfSelectedGroup

  // Border color - use blue for highlighted contexts
  const borderColor = isDragOver ? '#3b82f6'
    : isHighlighted ? '#3b82f6'
    : '#cbd5e1'

  // External context ring style (used in hover and default states)
  const externalRing = '0 0 0 2px white, 0 0 0 3px #cbd5e1'

  // Box shadow for visual depth
  const shadow = isDragOver
    ? '0 0 0 3px #3b82f6, 0 8px 16px -4px rgba(59, 130, 246, 0.3)'
    : isHighlighted
    ? '0 0 0 3px #3b82f6, 0 4px 12px -2px rgba(59, 130, 246, 0.25)'
    : isHovered
    ? context.isExternal
      ? `${externalRing}, 0 4px 8px -1px rgba(0, 0, 0, 0.12)`
      : '0 2px 8px -1px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)'
    : context.isExternal
    ? `${externalRing}, 0 2px 6px 0 rgba(0, 0, 0, 0.06)`
    : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'

  return (
    <>
      {/* Invisible handles for edge connections */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      {/* Top handle for receiving connections from User Needs in Strategic View */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} id="top" />

      <div
        style={{
          width: size.width,
          height: size.height,
          backgroundColor: fillColor,
          borderWidth,
          borderStyle: context.isExternal ? 'dashed' : borderStyle,
          borderColor,
          borderRadius: '8px',
          padding: '8px',
          boxShadow: shadow,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          cursor: 'pointer',
          opacity: opacity ?? 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
      >
      {/* Legacy badge */}
      {context.isLegacy && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '16px',
          }}
          title="Legacy"
        >
          ⚠
        </div>
      )}

      {/* External badge */}
      {context.isExternal && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            fontSize: '9px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            padding: '3px 7px',
            borderRadius: '6px',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          External
        </div>
      )}

      {/* Context name */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#0f172a',
          marginTop: context.isExternal ? '20px' : context.isLegacy ? '20px' : '0',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {context.name}
      </div>

      {/* Purpose */}
      {context.purpose && (
        <div
          style={{
            fontSize: '10.5px',
            color: '#64748b',
            marginTop: '6px',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {context.purpose}
        </div>
      )}
      </div>

      {/* Context Menu */}
      {contextMenu && activeKeyframeId && project?.temporal && (
        <div
          className="fixed bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleToggleVisibility}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700"
          >
            {(() => {
              const keyframe = project.temporal.keyframes.find(kf => kf.id === activeKeyframeId)
              const isVisible = keyframe?.activeContextIds.includes(context.id)
              return isVisible ? 'Hide in this keyframe' : 'Show in this keyframe'
            })()}
          </button>
        </div>
      )}
    </>
  )
}

// Component to render stage labels that pan/zoom with canvas
function StageLabels({ stages }: { stages: Array<{ label: string; position: number }> }) {
  const { x, y, zoom } = useViewport()
  const updateFlowStage = useEditorStore(s => s.updateFlowStage)
  const deleteFlowStage = useEditorStore(s => s.deleteFlowStage)
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [editValue, setEditValue] = React.useState('')
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null)
  const [dragStartX, setDragStartX] = React.useState(0)
  const [contextMenuIndex, setContextMenuIndex] = React.useState<number | null>(null)
  const [contextMenuPos, setContextMenuPos] = React.useState({ x: 0, y: 0 })
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingIndex])

  const handleStartEdit = (index: number, currentLabel: string) => {
    setEditingIndex(index)
    setEditValue(currentLabel)
  }

  const handleSaveEdit = (index: number) => {
    if (editValue.trim() && editValue !== stages[index].label) {
      try {
        updateFlowStage(index, { label: editValue.trim() })
      } catch (err) {
        alert((err as Error).message)
      }
    }
    setEditingIndex(null)
  }

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (editingIndex !== null) return
    setDraggingIndex(index)
    setDragStartX(e.clientX)
    e.preventDefault()
  }

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuIndex(index)
    setContextMenuPos({ x: e.clientX, y: e.clientY })
  }

  const handleDeleteStage = (index: number) => {
    if (stages.length <= 1) {
      alert('Cannot delete the last stage')
      return
    }
    if (window.confirm(`Delete stage "${stages[index].label}"? This can be undone with Cmd/Ctrl+Z.`)) {
      deleteFlowStage(index)
    }
    setContextMenuIndex(null)
  }

  // Close context menu on click outside
  React.useEffect(() => {
    if (contextMenuIndex === null) return

    const handleClick = () => setContextMenuIndex(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [contextMenuIndex])

  React.useEffect(() => {
    if (draggingIndex === null) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStartX) / zoom
      const currentPosition = stages[draggingIndex].position
      const newPosition = Math.max(0, Math.min(100, currentPosition + (deltaX / 2000) * 100))

      try {
        updateFlowStage(draggingIndex, { position: Math.round(newPosition * 10) / 10 })
      } catch (err) {
        // Position conflict, ignore
      }
      setDragStartX(e.clientX)
    }

    const handleMouseUp = () => {
      setDraggingIndex(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingIndex, dragStartX, stages, updateFlowStage, zoom])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {stages.map((stage, index) => {
        const xPos = (stage.position / 100) * 2000
        const yPos = -15 // Just above canvas boundary

        const transformedX = xPos * zoom + x
        const transformedY = yPos * zoom + y

        const isEditing = editingIndex === index
        const isDragging = draggingIndex === index

        return (
          <div
            key={stage.label}
            className={`text-slate-700 dark:text-slate-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              transform: 'translate(-50%, -50%)',
              whiteSpace: 'nowrap',
              fontSize: `${22.5 * zoom}px`,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, index)}
            onClick={() => !isDragging && handleStartEdit(index, stage.label)}
            onContextMenu={(e) => handleContextMenu(e, index)}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveEdit(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit(index)
                  } else if (e.key === 'Escape') {
                    setEditingIndex(null)
                  }
                }}
                className="bg-transparent text-slate-700 dark:text-slate-200 border-2 border-blue-500 dark:border-blue-400 rounded px-2 py-1 outline-none selection:bg-blue-200 selection:text-slate-900 dark:selection:bg-blue-600 dark:selection:text-white"
                style={{
                  fontSize: `${22.5 * zoom}px`,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              stage.label
            )}
          </div>
        )
      })}

      {/* Context Menu */}
      {contextMenuIndex !== null && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
          className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-xl py-1 min-w-[160px]"
        >
          <button
            onClick={() => handleDeleteStage(contextMenuIndex)}
            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete Stage
          </button>
        </div>
      )}
    </div>
  )
}

// Component to render Strategic View evolution bands
function EvolutionBands() {
  const { x, y, zoom } = useViewport()

  const bands = [
    { label: 'Genesis', position: 12.5, width: 25 },
    { label: 'Custom-Built', position: 37.5, width: 25 },
    { label: 'Product', position: 62.5, width: 25 },
    { label: 'Commodity', position: 87.5, width: 25 },
  ]

  // Zone dividers at 25%, 50%, 75%
  const zoneDividers = [25, 50, 75]

  return (
    <>
      {/* Zone divider lines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      >
        {zoneDividers.map((position) => {
          const xPos = (position / 100) * 2000
          const transformedX = xPos * zoom + x

          return (
            <div
              key={`divider-${position}`}
              style={{
                position: 'absolute',
                left: transformedX,
                top: 0,
                width: '1px',
                height: `${1000 * zoom}px`,
                background: 'repeating-linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 0px, rgba(148, 163, 184, 0.3) 5px, transparent 5px, transparent 10px)',
                marginTop: `${y}px`,
              }}
            />
          )
        })}
      </div>

      {/* Band labels */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {bands.map((band) => {
          const xPos = (band.position / 100) * 2000
          const yPos = 1040 // Below canvas boundary

          const transformedX = xPos * zoom + x
          const transformedY = yPos * zoom + y

          return (
            <div
              key={band.label}
              className="text-slate-700 dark:text-slate-200"
              style={{
                position: 'absolute',
                left: transformedX,
                top: transformedY,
                transform: 'translate(-50%, -50%)',
                whiteSpace: 'nowrap',
                fontSize: `${22.5 * zoom}px`,
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              {band.label}
            </div>
          )
        })}
      </div>
    </>
  )
}

// Group node component - renders as a ReactFlow node for proper pan/zoom
function GroupNode({ data }: NodeProps) {
  const group = data.group as Group
  const isSelected = data.isSelected as boolean
  const [isHovered, setIsHovered] = React.useState(false)
  const groupOpacity = useEditorStore(s => s.groupOpacity)
  const blobPath = data.blobPath as string
  const blobBounds = data.blobBounds as { width: number; height: number }

  const isDarkMode = document.documentElement.classList.contains('dark')

  const groupColor = group.color || '#3b82f6'

  const getRgbValues = (color: string): [number, number, number] => {
    if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
      }
    }
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return [r, g, b]
  }

  const [r, g, b] = getRgbValues(groupColor)

  const backgroundColor = `rgba(${r}, ${g}, ${b}, ${groupOpacity})`
  const borderColor = `rgb(${r}, ${g}, ${b})`

  return (
    <div
      className="nodrag nopan"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'pointer',
        outline: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width={blobBounds.width}
        height={blobBounds.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'visible',
        }}
      >
        <path
          d={blobPath}
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 2 : 1}
          strokeDasharray={isSelected ? 'none' : '5,5'}
          style={{
            filter: isDarkMode ? 'none' : `drop-shadow(0 2px 10px rgba(${r}, ${g}, ${b}, 0.3))`,
            transition: 'all 0.2s',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '12px',
          fontSize: '12px',
          fontWeight: 600,
          color: isDarkMode ? '#e2e8f0' : '#1e293b',
          backgroundColor: 'transparent',
          padding: '4px 10px',
          borderRadius: '6px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'all 0.15s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          pointerEvents: 'none',
        }}
      >
        {group.label}
      </div>
    </div>
  )
}

// Actor node component - displayed at the top of Strategic View
function ActorNode({ data }: NodeProps) {
  const actor = data.actor as Actor
  const isSelected = data.isSelected as boolean
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <>
      {/* Invisible handles for edge connections */}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div
        title={actor.name}
        style={{
          width: 100,
          height: 50,
          backgroundColor: isSelected || isHovered ? '#eff6ff' : '#f8fafc',
          borderWidth: '2px',
          borderStyle: actor.isExternal ? 'dashed' : 'solid',
          borderColor: isSelected ? '#3b82f6' : '#cbd5e1',
          borderRadius: '8px',
          padding: '8px',
          boxShadow: isSelected
            ? '0 0 0 3px #3b82f6, 0 4px 12px -2px rgba(59, 130, 246, 0.25)'
            : isHovered
            ? actor.isExternal
              ? '0 0 0 2px white, 0 0 0 3px #cbd5e1, 0 4px 8px -1px rgba(0, 0, 0, 0.12)'
              : '0 4px 12px -2px rgba(0, 0, 0, 0.15)'
            : actor.isExternal
            ? '0 0 0 2px white, 0 0 0 3px #cbd5e1, 0 2px 6px 0 rgba(0, 0, 0, 0.06)'
            : '0 2px 6px 0 rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Actor name */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#0f172a',
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {actor.name}
        </div>
      </div>
    </>
  )
}

// UserNeed node component - displayed in middle layer of Strategic View
function UserNeedNode({ data }: NodeProps) {
  const userNeed = data.userNeed as UserNeed
  const isSelected = data.isSelected as boolean
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <>
      {/* Handles for edge connections */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div
        title={userNeed.name}
        style={{
          width: 100,
          height: 50,
          backgroundColor: isSelected || isHovered ? '#f0fdf4' : '#f8fafc',
          border: isSelected ? '2px solid #10b981' : '2px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px',
          boxShadow: isSelected
            ? '0 0 0 3px rgba(16, 185, 129, 0.3), 0 4px 12px -2px rgba(16, 185, 129, 0.25)'
            : isHovered
            ? '0 4px 12px -2px rgba(0, 0, 0, 0.15)'
            : '0 2px 6px 0 rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* UserNeed name */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#0f172a',
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {userNeed.name}
        </div>
      </div>
    </>
  )
}

// Actor connection edge component
function ActorConnectionEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const selectedActorId = useEditorStore(s => s.selectedActorId)
  const connection = data?.connection as ActorConnection | undefined

  // Highlight if this connection belongs to the selected actor
  const isHighlighted = source === selectedActorId

  // Get node objects from React Flow to calculate dynamic positions
  const { getNode } = useReactFlow()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  // Calculate dynamic edge positions if nodes are available with valid dimensions
  let sx = sourceX
  let sy = sourceY
  let tx = targetX
  let ty = targetY
  let sourcePos = sourcePosition
  let targetPos = targetPosition

  if (sourceNode && targetNode &&
      sourceNode.width && sourceNode.height &&
      targetNode.width && targetNode.height) {
    // Actor is source (top), context is target (below)
    // Calculate connection from bottom center of actor to top center of context
    sx = sourceNode.position.x + (sourceNode.width / 2)
    sy = sourceNode.position.y + sourceNode.height
    tx = targetNode.position.x + (targetNode.width / 2)
    ty = targetNode.position.y
    sourcePos = Position.Bottom
    targetPos = Position.Top
  }

  const [edgePath] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  })

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: isHighlighted ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8',
          strokeWidth: isHighlighted ? 2.5 : isHovered ? 2 : 1.5,
          strokeDasharray: '5,5',
          fill: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        markerEnd="url(#actor-arrow)"
      />
      {/* Invisible wider path for easier hovering */}
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: 20,
          fill: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <title>Actor connection{connection?.notes ? `: ${connection.notes}` : ''}</title>
      </path>
    </>
  )
}

// Actor-Need connection edge component
function ActorNeedConnectionEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const selectedActorId = useEditorStore(s => s.selectedActorId)
  const selectedUserNeedId = useEditorStore(s => s.selectedUserNeedId)
  const connection = data?.connection as ActorNeedConnection | undefined

  const isHighlighted = source === selectedActorId || target === selectedUserNeedId

  const { getNode } = useReactFlow()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  let sx = sourceX
  let sy = sourceY
  let tx = targetX
  let ty = targetY
  let sourcePos = sourcePosition
  let targetPos = targetPosition

  if (sourceNode && targetNode &&
      sourceNode.width && sourceNode.height &&
      targetNode.width && targetNode.height) {
    sx = sourceNode.position.x + (sourceNode.width / 2)
    sy = sourceNode.position.y + sourceNode.height
    tx = targetNode.position.x + (targetNode.width / 2)
    ty = targetNode.position.y
    sourcePos = Position.Bottom
    targetPos = Position.Top
  }

  const [edgePath] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  })

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: isHighlighted ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8',
          strokeWidth: isHighlighted ? 2.5 : isHovered ? 2 : 1.5,
          strokeDasharray: '5,5',
          fill: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        markerEnd="url(#actor-arrow)"
      />
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: 20,
          fill: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <title>Actor-Need connection{connection?.notes ? `: ${connection.notes}` : ''}</title>
      </path>
    </>
  )
}

// Need-Context connection edge component
function NeedContextConnectionEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const selectedUserNeedId = useEditorStore(s => s.selectedUserNeedId)
  const selectedContextId = useEditorStore(s => s.selectedContextId)
  const connection = data?.connection as NeedContextConnection | undefined

  const isHighlighted = source === selectedUserNeedId || target === selectedContextId

  const { getNode } = useReactFlow()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  let sx = sourceX
  let sy = sourceY
  let tx = targetX
  let ty = targetY
  let sourcePos = sourcePosition
  let targetPos = targetPosition

  if (sourceNode && targetNode &&
      sourceNode.width && sourceNode.height &&
      targetNode.width && targetNode.height) {
    sx = sourceNode.position.x + (sourceNode.width / 2)
    sy = sourceNode.position.y + sourceNode.height
    tx = targetNode.position.x + (targetNode.width / 2)
    ty = targetNode.position.y
    sourcePos = Position.Bottom
    targetPos = Position.Top
  }

  const [edgePath] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  })

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: isHighlighted ? '#10b981' : isHovered ? '#34d399' : '#94a3b8',
          strokeWidth: isHighlighted ? 2.5 : isHovered ? 2 : 1.5,
          strokeDasharray: '5,5',
          fill: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        markerEnd="url(#need-arrow)"
      />
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: 20,
          fill: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <title>Need-Context connection{connection?.notes ? `: ${connection.notes}` : ''}</title>
      </path>
    </>
  )
}

// Component to render canvas boundary
function CanvasBoundary() {
  const { x, y, zoom } = useViewport()

  // Canvas dimensions
  const canvasWidth = 2000
  const canvasHeight = 1000

  // Transform canvas coordinates to screen coordinates
  const transformedX = 0 * zoom + x
  const transformedY = 0 * zoom + y
  const width = canvasWidth * zoom
  const height = canvasHeight * zoom

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1,
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <rect
          x={transformedX}
          y={transformedY}
          width={width}
          height={height}
          rx={12 * zoom}
          ry={12 * zoom}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-slate-300 dark:text-neutral-700"
          opacity={0.4}
        />
      </svg>
    </div>
  )
}

// Component to render Y-axis labels that pan/zoom with canvas
function YAxisLabels() {
  const { x, y, zoom } = useViewport()

  const labels = [
    { text: 'User-Facing / Value Delivery', yPos: 325 },
    { text: 'Enabling / Platform', yPos: 1000 }
  ]

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {labels.map((label) => {
        const xPos = -30
        const transformedX = xPos * zoom + x
        const transformedY = label.yPos * zoom + y

        return (
          <div
            key={label.text}
            className="text-slate-700 dark:text-slate-200"
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              transform: 'translate(0, -50%) rotate(-90deg)',
              transformOrigin: 'left center',
              whiteSpace: 'nowrap',
              fontSize: `${16.5 * zoom}px`,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.9,
            }}
          >
            {label.text}
          </div>
        )
      })}
    </div>
  )
}

// Component to render Distillation View regions and axes
function DistillationRegions() {
  const { x, y, zoom } = useViewport()

  // Define regions with background colors matching Nick Tune's chart
  // X-axis = Business Differentiation (0=Low, 100=High)
  // Y-axis = Model Complexity (0=Low, 100=High)
  const regions = [
    { name: 'GENERIC', xStart: 0, xEnd: DISTILLATION_GENERIC_MAX_X, yStart: 0, yEnd: 100, color: 'rgba(153, 153, 153, 0.30)', textColor: '#fff', labelX: DISTILLATION_GENERIC_MAX_X / 2, labelY: 50 },
    { name: 'SUPPORTING', xStart: DISTILLATION_GENERIC_MAX_X, xEnd: 100, yStart: 0, yEnd: DISTILLATION_CORE_MIN_Y, color: 'rgba(162, 132, 193, 0.35)', textColor: '#fff', labelX: (DISTILLATION_GENERIC_MAX_X + 100) / 2, labelY: DISTILLATION_CORE_MIN_Y / 2 },
    { name: 'SUPPORTING', xStart: DISTILLATION_GENERIC_MAX_X, xEnd: DISTILLATION_CORE_MIN_X, yStart: DISTILLATION_CORE_MIN_Y, yEnd: 100, color: 'rgba(162, 132, 193, 0.35)', textColor: '#fff', labelX: (DISTILLATION_GENERIC_MAX_X + DISTILLATION_CORE_MIN_X) / 2, labelY: (DISTILLATION_CORE_MIN_Y + 100) / 2 },
    { name: 'CORE', xStart: DISTILLATION_CORE_MIN_X, xEnd: 100, yStart: DISTILLATION_CORE_MIN_Y, yEnd: 100, color: 'rgba(93, 186, 164, 0.35)', textColor: '#fff', labelX: (DISTILLATION_CORE_MIN_X + 100) / 2, labelY: (DISTILLATION_CORE_MIN_Y + 100) / 2 },
  ]

  const gridLines = [
    { type: 'vertical' as const, position: DISTILLATION_GENERIC_MAX_X, label: '' },
    { type: 'vertical' as const, position: DISTILLATION_CORE_MIN_X, label: '' },
  ]

  // Axis labels - matching Nick Tune's layout
  // X-axis (bottom) = Business Differentiation (Low to High)
  const xAxisLabels = [
    { text: 'Low', xPos: 100, yPos: 980 },
    { text: 'Business Differentiation', xPos: 1000, yPos: 980 },
    { text: 'High', xPos: 1900, yPos: 980 },
  ]

  // Y-axis (left) = Model Complexity (Low to High)
  const yAxisLabels = [
    { text: 'High', xPos: 50, yPos: 100 },
    { text: 'Model Complexity', xPos: 50, yPos: 500 },
    { text: 'Low', xPos: 50, yPos: 900 },
  ]

  return (
    <>
      {/* Background regions */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {regions.map((region, idx) => {
          const width = ((region.xEnd - region.xStart) / 100) * 2000
          const height = ((region.yEnd - region.yStart) / 100) * 1000
          const xPos = (region.xStart / 100) * 2000
          const yPos = (1 - region.yEnd / 100) * 1000

          const transformedX = xPos * zoom + x
          const transformedY = yPos * zoom + y
          const transformedWidth = width * zoom
          const transformedHeight = height * zoom

          // Calculate label position
          const labelX = (region.labelX / 100) * 2000
          const labelY = (1 - region.labelY / 100) * 1000
          const transformedLabelX = labelX * zoom + x
          const transformedLabelY = labelY * zoom + y

          return (
            <React.Fragment key={`region-${idx}`}>
              <div
                style={{
                  position: 'absolute',
                  left: transformedX,
                  top: transformedY,
                  width: transformedWidth,
                  height: transformedHeight,
                  backgroundColor: region.color,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              />
              {/* Region label */}
              <div
                style={{
                  position: 'absolute',
                  left: transformedLabelX,
                  top: transformedLabelY,
                  transform: 'translate(-50%, -50%)',
                  color: region.textColor,
                  fontSize: `${48 * zoom}px`,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.85,
                  pointerEvents: 'none',
                  textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {region.name}
              </div>
            </React.Fragment>
          )
        })}

        {/* Grid lines - dotted white like Nick Tune's chart */}
        {gridLines.map((line, idx) => {
          if (line.type === 'horizontal') {
            const yPos = (1 - line.position / 100) * 1000
            const transformedY = yPos * zoom + y
            return (
              <div
                key={`grid-h-${idx}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: transformedY,
                  width: `${2000 * zoom}px`,
                  height: '1px',
                  background: 'repeating-linear-gradient(to right, rgba(255, 255, 255, 0.3) 0px, rgba(255, 255, 255, 0.3) 5px, transparent 5px, transparent 10px)',
                  marginLeft: `${x}px`,
                }}
              />
            )
          } else {
            const xPos = (line.position / 100) * 2000
            const transformedX = xPos * zoom + x
            return (
              <div
                key={`grid-v-${idx}`}
                style={{
                  position: 'absolute',
                  left: transformedX,
                  top: 0,
                  width: '1px',
                  height: `${1000 * zoom}px`,
                  background: 'repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0px, rgba(255, 255, 255, 0.3) 5px, transparent 5px, transparent 10px)',
                  marginTop: `${y}px`,
                }}
              />
            )
          }
        })}
      </div>

      {/* X-axis labels */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {xAxisLabels.map((label) => {
          const transformedX = label.xPos * zoom + x
          const transformedY = label.yPos * zoom + y

          return (
            <div
              key={label.text}
              className="text-slate-700 dark:text-slate-200"
              style={{
                position: 'absolute',
                left: transformedX,
                top: transformedY,
                transform: 'translate(-50%, -50%)',
                whiteSpace: 'nowrap',
                fontSize: `${18 * zoom}px`,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              {label.text}
            </div>
          )
        })}
      </div>

      {/* Y-axis labels */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {yAxisLabels.map((label) => {
          const transformedX = label.xPos * zoom + x
          const transformedY = label.yPos * zoom + y

          return (
            <div
              key={label.text}
              className="text-slate-700 dark:text-slate-200"
              style={{
                position: 'absolute',
                left: transformedX,
                top: transformedY,
                transform: 'translate(0, -50%) rotate(-90deg)',
                transformOrigin: 'left center',
                whiteSpace: 'nowrap',
                fontSize: `${18 * zoom}px`,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              {label.text}
            </div>
          )
        })}
      </div>
    </>
  )
}

// Custom edge component with pattern label
function RelationshipEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const selectedRelationshipId = useEditorStore(s => s.selectedRelationshipId)
  const relationship = data?.relationship as Relationship | undefined
  const pattern = relationship?.pattern || ''
  const isSelected = id === selectedRelationshipId

  // Get node objects from React Flow to calculate dynamic positions
  const { getNode } = useReactFlow()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  // Calculate dynamic edge positions if nodes are available with valid dimensions
  let sx = sourceX
  let sy = sourceY
  let tx = targetX
  let ty = targetY
  let sourcePos = sourcePosition
  let targetPos = targetPosition

  if (sourceNode && targetNode &&
      sourceNode.width && sourceNode.height &&
      targetNode.width && targetNode.height) {
    const edgeParams = getEdgeParams(sourceNode, targetNode)
    sx = edgeParams.sx
    sy = edgeParams.sy
    tx = edgeParams.tx
    ty = edgeParams.ty
    sourcePos = edgeParams.sourcePos
    targetPos = edgeParams.targetPos
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  })

  // Non-directional patterns
  const isSymmetric = pattern === 'shared-kernel' || pattern === 'partnership'

  // Use ReactFlow's built-in marker system (automatically handles rotation)
  const markerId = isSelected ? 'arrow-selected' : isHovered ? 'arrow-hover' : 'arrow-default'

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: isSelected ? '#3b82f6' : isHovered ? '#475569' : '#cbd5e1',
          strokeWidth: isSelected ? 2.5 : isHovered ? 2.5 : 1.5,
          fill: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        markerEnd={isSymmetric ? undefined : `url(#${markerId})`}
      />
      {/* Invisible wider path for easier hovering and clicking */}
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: 20,
          fill: 'none',
          cursor: 'pointer',
          pointerEvents: 'all',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          useEditorStore.setState({
            selectedRelationshipId: id,
            selectedContextId: null,
            selectedContextIds: [],
            selectedGroupId: null,
            selectedActorId: null,
          })
        }}
      >
        <title>{pattern}</title>
      </path>
      {/* Tooltip label on hover or when selected */}
      {(isHovered || isSelected) && (
        <g>
          <rect
            x={labelX - 50}
            y={labelY - 14}
            width={100}
            height={28}
            fill="#0f172a"
            rx="6"
            opacity="0.92"
          />
          <text
            x={labelX}
            y={labelY + 5}
            textAnchor="middle"
            fill="white"
            fontSize="11.5"
            fontWeight="500"
            letterSpacing="0.01em"
          >
            {pattern}
          </text>
        </g>
      )}
    </>
  )
}

const nodeTypes = {
  context: ContextNode,
  group: GroupNode,
  actor: ActorNode,
  userNeed: UserNeedNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
  actorConnection: ActorConnectionEdge,
  actorNeedConnection: ActorNeedConnectionEdge,
  needContextConnection: NeedContextConnectionEdge,
}

// Custom Controls that resets to fit view
function CustomControls() {
  const { fitView } = useReactFlow()

  const handleFitView = useCallback(() => {
    fitView({
      padding: 0.15,
      duration: 200,
      minZoom: 0.1,
      maxZoom: 0.8,
    })
  }, [fitView])

  return <Controls position="bottom-right" onFitView={handleFitView} />
}

// Inner component that has access to React Flow context
function CanvasContent() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore(s => s.selectedContextId)
  const selectedContextIds = useEditorStore(s => s.selectedContextIds)
  const selectedGroupId = useEditorStore(s => s.selectedGroupId)
  const selectedActorId = useEditorStore(s => s.selectedActorId)
  const selectedRelationshipId = useEditorStore(s => s.selectedRelationshipId)
  const viewMode = useEditorStore(s => s.activeViewMode)
  const showGroups = useEditorStore(s => s.showGroups)
  const showRelationships = useEditorStore(s => s.showRelationships)
  const updateContextPosition = useEditorStore(s => s.updateContextPosition)
  const updateMultipleContextPositions = useEditorStore(s => s.updateMultipleContextPositions)
  const updateActorPosition = useEditorStore(s => s.updateActorPosition)
  const updateUserNeedPosition = useEditorStore(s => s.updateUserNeedPosition)
  const setSelectedActor = useEditorStore(s => s.setSelectedActor)
  const assignRepoToContext = useEditorStore(s => s.assignRepoToContext)

  // Temporal state
  const currentDate = useEditorStore(s => s.temporal.currentDate)
  const activeKeyframeId = useEditorStore(s => s.temporal.activeKeyframeId)
  const updateKeyframeContextPosition = useEditorStore(s => s.updateKeyframeContextPosition)

  // Get React Flow instance for fitView
  const { fitView } = useReactFlow()

  // Register fitView callback with the store
  useEffect(() => {
    setFitViewCallback(() => {
      fitView({
        padding: 0.15,
        duration: 200,
        minZoom: 0.1,
        maxZoom: 0.8,
      })
    })
  }, [fitView])

  // Convert BoundedContexts and Groups to React Flow nodes
  const baseNodes: Node[] = useMemo(() => {
    if (!project) return []

    // Find the selected group (if any)
    const selectedGroup = selectedGroupId ? project.groups.find(g => g.id === selectedGroupId) : null

    // Find connected contexts for selected actor
    const selectedActorConnections = selectedActorId
      ? project.actorConnections?.filter(ac => ac.actorId === selectedActorId) || []
      : []
    const connectedContextIds = new Set(selectedActorConnections.map(ac => ac.contextId))

    // Find connected contexts for selected relationship
    const selectedRelationship = selectedRelationshipId
      ? project.relationships.find(r => r.id === selectedRelationshipId)
      : null
    const relationshipConnectedContextIds = new Set(
      selectedRelationship ? [selectedRelationship.fromContextId, selectedRelationship.toContextId] : []
    )

    const contextNodes = project.contexts.map((context) => {
      const size = NODE_SIZES[context.codeSize?.bucket || 'medium']

      // Map 0-100 positions to pixel coordinates
      // Choose position based on active view mode
      let x, y
      if (viewMode === 'distillation') {
        // Distillation view uses independent 2D space
        x = (context.positions.distillation.x / 100) * 2000
        y = (1 - context.positions.distillation.y / 100) * 1000 // Invert Y for distillation (0 = bottom, 100 = top)
      } else {
        // Flow and Strategic views share Y axis
        let xPos: number
        let yPos: number

        // Check if we should use temporal interpolation
        const isTemporalMode = viewMode === 'strategic' && project.temporal?.enabled && currentDate
        const keyframes = project.temporal?.keyframes || []

        if (isTemporalMode && keyframes.length > 0) {
          // Use interpolated positions for Strategic View in temporal mode
          const basePosition = {
            x: context.positions.strategic.x,
            y: context.positions.shared.y,
          }
          const interpolated = interpolatePosition(context.id, currentDate!, keyframes, basePosition)
          xPos = interpolated.x
          yPos = interpolated.y
        } else {
          // Use base positions
          xPos = viewMode === 'flow' ? context.positions.flow.x : context.positions.strategic.x
          yPos = context.positions.shared.y
        }

        x = (xPos / 100) * 2000
        y = (yPos / 100) * 1000
      }

      // Check if this context is highlighted (by group, actor, or relationship selection)
      const isMemberOfSelectedGroup = selectedGroup?.contextIds.includes(context.id)
        || connectedContextIds.has(context.id)
        || relationshipConnectedContextIds.has(context.id)
        || false

      // Calculate opacity based on temporal visibility (Strategic View only)
      let opacity = 1
      if (viewMode === 'strategic' && project.temporal?.enabled && currentDate) {
        const keyframes = project.temporal.keyframes || []
        if (keyframes.length > 0) {
          opacity = getContextOpacity(context.id, currentDate, keyframes)
        }
      }

      return {
        id: context.id,
        type: 'context',
        position: { x, y },
        data: {
          context,
          isSelected: context.id === selectedContextId || selectedContextIds.includes(context.id),
          isMemberOfSelectedGroup,
          opacity,
        },
        style: {
          width: size.width,
          height: size.height,
          zIndex: 10,
        },
        width: size.width,
        height: size.height,
        draggable: true,
        selectable: true,
        connectable: false,
      }
    })

    // Create group nodes (not shown in distillation view)
    const groupNodes = viewMode !== 'distillation' && project.groups?.map((group) => {
      const contexts = project.contexts.filter(c => group.contextIds.includes(c.id))
      if (contexts.length === 0) return null

      let xPositions, yPositions
      if (viewMode === 'distillation') {
        xPositions = []
        yPositions = []
      } else {
        xPositions = contexts.map(c => (viewMode === 'flow' ? c.positions.flow.x : c.positions.strategic.x) * 20)
        yPositions = contexts.map(c => c.positions.shared.y * 10)
      }

      const BLOB_PADDING = 60

      const contextsWithSizes = contexts.map((c, idx) => {
        const size = NODE_SIZES[c.codeSize?.bucket || 'medium']
        return {
          x: xPositions[idx],
          y: yPositions[idx],
          width: size.width,
          height: size.height
        }
      })

      const boundingBox = calculateBoundingBox(contextsWithSizes)
      const relativeContexts = translateContextsToRelative(contextsWithSizes, boundingBox)
      const blobMetadata = generateBlobPath(relativeContexts, BLOB_PADDING, true)
      const blobPosition = calculateBlobPosition(contextsWithSizes, blobMetadata, boundingBox)

      return {
        id: `group-${group.id}`,
        type: 'group',
        position: {
          x: blobPosition.containerX,
          y: blobPosition.containerY
        },
        data: {
          group,
          isSelected: group.id === selectedGroupId,
          blobPath: blobPosition.blobPath,
          blobBounds: { width: blobPosition.containerWidth, height: blobPosition.containerHeight },
        },
        style: {
          width: blobPosition.containerWidth,
          height: blobPosition.containerHeight,
          zIndex: 0,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: 0,
        },
        className: 'group-node',
        width: blobPosition.containerWidth,
        height: blobPosition.containerHeight,
        draggable: false,
        selectable: true,
        connectable: false,
      }
    }).filter(Boolean) as Node[] || []

    // Reorder groups to bring selected group to front (renders last = on top)
    const reorderedGroupNodes = selectedGroupId
      ? [
          ...groupNodes.filter(g => g.id !== `group-${selectedGroupId}`),
          ...groupNodes.filter(g => g.id === `group-${selectedGroupId}`)
        ]
      : groupNodes

    // Apply group visibility filter
    const finalGroupNodes = showGroups ? reorderedGroupNodes : []

    // Create actor nodes (visible in Strategic and Value Stream views, not Distillation)
    const actorNodes: Node[] = viewMode !== 'distillation' && project.actors
      ? project.actors.map((actor) => {
          const x = (actor.position / 100) * 2000
          const y = 10 // Fixed y position at top inside boundary

          return {
            id: actor.id,
            type: 'actor',
            position: { x, y },
            data: {
              actor,
              isSelected: actor.id === selectedActorId,
            },
            style: {
              width: 100,
              height: 50,
              zIndex: 15, // Above contexts but below actor connections
            },
            width: 100,
            height: 50,
            draggable: true,
            selectable: true,
            connectable: false,
          }
        })
      : []

    // Create userNeed nodes (visible in Strategic and Value Stream views, not Distillation)
    const userNeedNodes: Node[] = viewMode !== 'distillation' && project.userNeeds
      ? project.userNeeds
          .filter(need => need.visibility !== false)
          .map((userNeed) => {
            const x = (userNeed.position / 100) * 2000
            const y = 90 // Fixed y position below actors, inside boundary

            return {
              id: userNeed.id,
              type: 'userNeed',
              position: { x, y },
              data: {
                userNeed,
                isSelected: userNeed.id === useEditorStore.getState().selectedUserNeedId,
              },
              style: {
                width: 100,
                height: 50,
                zIndex: 14, // Between actors (15) and contexts (10)
              },
              width: 100,
              height: 50,
              draggable: true,
              selectable: true,
              connectable: false,
            }
          })
      : []

    // Return groups first (with selected on top), then contexts, then user needs, then actors
    return [...finalGroupNodes, ...contextNodes, ...userNeedNodes, ...actorNodes]
  }, [project, selectedContextId, selectedContextIds, selectedGroupId, selectedActorId, selectedRelationshipId, viewMode, showGroups, currentDate])

  // Use React Flow's internal nodes state for smooth updates
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState(baseNodes)

  // Update nodes when baseNodes change (view mode switch or context updates)
  useEffect(() => {
    setNodes((currentNodes) => {
      return baseNodes.map((baseNode) => {
        const existingNode = currentNodes.find(n => n.id === baseNode.id)
        // Preserve any internal React Flow state while updating position
        return existingNode ? { ...existingNode, ...baseNode } : baseNode
      })
    })
  }, [baseNodes, setNodes, selectedContextIds, selectedGroupId])

  // Convert Relationships and ActorConnections to React Flow edges
  const edges: Edge[] = useMemo(() => {
    if (!project) return []

    // Filter relationships based on view mode and visibility toggle
    const relationshipEdges = (viewMode !== 'distillation' && showRelationships)
      ? project.relationships.map((rel) => ({
          id: rel.id,
          source: rel.fromContextId,
          target: rel.toContextId,
          type: 'relationship',
          data: { relationship: rel },
          animated: false,
          zIndex: 5, // Above groups (0) but below contexts (10)
        }))
      : []

    // Add actor connection edges (Strategic and Value Stream views, not Distillation)
    const actorConnectionEdges: Edge[] = viewMode !== 'distillation' && project.actorConnections
      ? project.actorConnections.map((conn) => ({
          id: conn.id,
          source: conn.actorId,
          target: conn.contextId,
          type: 'actorConnection',
          data: { connection: conn },
          animated: false,
          zIndex: 12, // Above contexts (10) but below actors (15)
        }))
      : []

    // Add actor-need connection edges (Strategic and Value Stream views, not Distillation)
    const actorNeedConnectionEdges: Edge[] = viewMode !== 'distillation' && project.actorNeedConnections
      ? project.actorNeedConnections.map((conn) => ({
          id: conn.id,
          source: conn.actorId,
          target: conn.userNeedId,
          type: 'actorNeedConnection',
          data: { connection: conn },
          animated: false,
          zIndex: 12,
        }))
      : []

    // Add need-context connection edges (Strategic and Value Stream views, not Distillation)
    const needContextConnectionEdges: Edge[] = viewMode !== 'distillation' && project.needContextConnections
      ? project.needContextConnections.map((conn) => ({
          id: conn.id,
          source: conn.userNeedId,
          target: conn.contextId,
          type: 'needContextConnection',
          data: { connection: conn },
          animated: false,
          zIndex: 11,
        }))
      : []

    return [...relationshipEdges, ...actorConnectionEdges, ...actorNeedConnectionEdges, ...needContextConnectionEdges]
  }, [project, viewMode, showRelationships, selectedActorId, selectedRelationshipId])

  // Handle edge click
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    // Only handle relationship edges, not actor connections
    if (edge.type === 'relationship') {
      useEditorStore.setState({
        selectedRelationshipId: edge.id,
        selectedContextId: null,
        selectedContextIds: [],
        selectedGroupId: null,
        selectedActorId: null,
        selectedUserNeedId: null,
      })
    }
  }, [])

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Handle group node clicks
    if (node.type === 'group') {
      const groupId = node.id.replace('group-', '')
      useEditorStore.setState({
        selectedGroupId: groupId,
        selectedContextId: null,
        selectedContextIds: [],
        selectedActorId: null,
        selectedUserNeedId: null,
        selectedRelationshipId: null,
      })
      return
    }

    // Handle actor node clicks
    if (node.type === 'actor') {
      useEditorStore.getState().setSelectedActor(node.id)
      return
    }

    // Handle userNeed node clicks
    if (node.type === 'userNeed') {
      useEditorStore.getState().setSelectedUserNeed(node.id)
      return
    }

    // Handle context node clicks
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      // Multi-select mode (Shift or Cmd/Ctrl)
      useEditorStore.getState().toggleContextSelection(node.id)
    } else {
      // Single select
      useEditorStore.setState({ selectedContextId: node.id, selectedContextIds: [], selectedGroupId: null, selectedActorId: null, selectedUserNeedId: null, selectedRelationshipId: null })
    }
  }, [])

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    useEditorStore.setState({ selectedContextId: null, selectedContextIds: [], selectedGroupId: null, selectedActorId: null, selectedUserNeedId: null, selectedRelationshipId: null })
  }, [])

  // Handle edge connection (Actor → User Need → Context)
  const onConnect = useCallback((connection: any) => {
    const { source, target } = connection
    const sourceNode = nodes.find(n => n.id === source)
    const targetNode = nodes.find(n => n.id === target)

    if (!sourceNode || !targetNode) return

    // Actor → User Need
    if (sourceNode.type === 'actor' && targetNode.type === 'userNeed') {
      useEditorStore.getState().createActorNeedConnection(source, target)
      return
    }

    // User Need → Context
    if (sourceNode.type === 'userNeed' && targetNode.type === 'context') {
      useEditorStore.getState().createNeedContextConnection(source, target)
      return
    }

    // Invalid connection - show message
    console.log('Invalid connection:', sourceNode.type, '→', targetNode.type)
  }, [nodes])

  // Wrap onNodesChange to handle multi-select drag
  const onNodesChange = useCallback((changes: any[]) => {
    // Get currently selected nodes from React Flow's internal state
    const selectedNodes = nodes.filter(n => n.selected && n.type === 'context')
    const reactFlowSelectedIds = selectedNodes.map(n => n.id)

    // Combine React Flow selection with our store selection
    const allSelectedIds = [...new Set([...selectedContextIds, ...reactFlowSelectedIds])]

    const positionChanges = changes.filter(c => c.type === 'position')

    // Check if React Flow is already handling multi-select drag
    // (sending position changes for all selected nodes at once)
    const isReactFlowMultiDrag = positionChanges.length > 1 &&
                                  positionChanges.length === allSelectedIds.length

    if (isReactFlowMultiDrag) {
      // React Flow is already handling multi-select drag correctly for box selection
      // Just pass through the changes
      onNodesChangeOriginal(changes)

      // Check if this is the end of the drag (dragging: false)
      const dragEndChanges = positionChanges.filter(c => c.dragging === false)
      if (dragEndChanges.length > 0 && project) {
        // Save positions for all selected nodes
        const positionsMap: Record<string, BoundedContext['positions']> = {}

        allSelectedIds.forEach(contextId => {
          const ctx = project.contexts.find(c => c.id === contextId)
          const visualNode = nodes.find(n => n.id === contextId)
          if (!ctx || !visualNode) return

          const newX = (visualNode.position.x / 2000) * 100
          const newY = (visualNode.position.y / 1000) * 100

          if (viewMode === 'distillation') {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: ctx.positions.strategic.x },
              distillation: { x: newX, y: 100 - newY }, // Invert Y back to 0=bottom, 100=top
              shared: { y: ctx.positions.shared.y },
            }
          } else if (viewMode === 'flow') {
            positionsMap[contextId] = {
              flow: { x: newX },
              strategic: { x: ctx.positions.strategic.x },
              distillation: { x: ctx.positions.distillation.x, y: ctx.positions.distillation.y },
              shared: { y: newY },
            }
          } else {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: newX },
              distillation: { x: ctx.positions.distillation.x, y: ctx.positions.distillation.y },
              shared: { y: newY },
            }
          }
        })

        updateMultipleContextPositions(positionsMap)
      }
      return
    }

    // Handle case where React Flow sends position change for only one node
    // but multiple are selected (happens with Shift+Click selection)
    const positionChange = changes.find(
      (change) =>
        change.type === 'position' &&
        change.position &&
        allSelectedIds.includes(change.id) &&
        allSelectedIds.length > 1
    )

    if (positionChange) {
      // Find the node being dragged
      const draggedNode = nodes.find(n => n.id === positionChange.id)
      if (!draggedNode) {
        onNodesChangeOriginal(changes)
        return
      }

      // Calculate delta
      const deltaX = positionChange.position.x - draggedNode.position.x
      const deltaY = positionChange.position.y - draggedNode.position.y

      // Create position changes for all other selected nodes
      const additionalChanges = allSelectedIds
        .filter(id => id !== positionChange.id)
        .map(id => {
          const node = nodes.find(n => n.id === id)
          if (!node) return null

          return {
            type: 'position',
            id,
            dragging: true,
            position: {
              x: node.position.x + deltaX,
              y: node.position.y + deltaY,
            },
          }
        })
        .filter(Boolean)

      // Apply all changes together
      onNodesChangeOriginal([...changes, ...additionalChanges])
    } else {
      // Normal change, pass through
      onNodesChangeOriginal(changes)
    }
  }, [nodes, selectedContextIds, onNodesChangeOriginal])

  // Handle node drag stop - update positions in store
  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    if (!project) return

    // Handle actor drag (horizontal only)
    if (node.type === 'actor') {
      const actor = project.actors?.find(a => a.id === node.id)
      if (!actor) return

      // Only update horizontal position, constrain to 0-100%
      const newPosition = Math.max(0, Math.min(100, (node.position.x / 2000) * 100))
      updateActorPosition(node.id, newPosition)
      return
    }

    // Handle userNeed drag (horizontal only)
    if (node.type === 'userNeed') {
      const userNeed = project.userNeeds?.find(n => n.id === node.id)
      if (!userNeed) return

      // Only update horizontal position, constrain to 0-100%
      const newPosition = Math.max(0, Math.min(100, (node.position.x / 2000) * 100))
      updateUserNeedPosition(node.id, newPosition)
      return
    }

    // Check if we're in temporal mode with an active keyframe (Strategic View only)
    const isEditingKeyframe = viewMode === 'strategic' && project.temporal?.enabled && activeKeyframeId

    // Get currently selected nodes from React Flow's internal state
    const selectedNodes = nodes.filter(n => n.selected && n.type === 'context')
    const reactFlowSelectedIds = selectedNodes.map(n => n.id)

    // Combine React Flow selection with our store selection
    const allSelectedIds = [...new Set([...selectedContextIds, ...reactFlowSelectedIds])]

    // Check if this node is part of a multi-selection
    const isMultiSelected = allSelectedIds.includes(node.id) && allSelectedIds.length > 1

    if (isMultiSelected) {
      // For multi-select, save the current visual positions of ALL selected nodes
      // (React Flow has already moved them visually during the drag)

      if (isEditingKeyframe) {
        // Update keyframe positions for all selected nodes
        allSelectedIds.forEach(contextId => {
          const visualNode = nodes.find(n => n.id === contextId)
          if (!visualNode) return

          const newX = (visualNode.position.x / 2000) * 100
          const newY = (visualNode.position.y / 1000) * 100
          updateKeyframeContextPosition(activeKeyframeId!, contextId, newX, newY)
        })
      } else {
        // Update base positions
        const positionsMap: Record<string, BoundedContext['positions']> = {}

        allSelectedIds.forEach(contextId => {
          const ctx = project.contexts.find(c => c.id === contextId)
          const visualNode = nodes.find(n => n.id === contextId)
          if (!ctx || !visualNode) return

          // Get the CURRENT visual position (after React Flow's drag)
          const newX = (visualNode.position.x / 2000) * 100
          const newY = (visualNode.position.y / 1000) * 100

          if (viewMode === 'distillation') {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: ctx.positions.strategic.x },
              distillation: { x: newX, y: 100 - newY }, // Invert Y back to 0=bottom, 100=top
              shared: { y: ctx.positions.shared.y },
            }
          } else if (viewMode === 'flow') {
            positionsMap[contextId] = {
              flow: { x: newX },
              strategic: { x: ctx.positions.strategic.x },
              distillation: { x: ctx.positions.distillation.x, y: ctx.positions.distillation.y },
              shared: { y: newY },
            }
          } else {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: newX },
              distillation: { x: ctx.positions.distillation.x, y: ctx.positions.distillation.y },
              shared: { y: newY },
            }
          }
        })

        updateMultipleContextPositions(positionsMap)
      }
    } else {
      // Single node move
      const context = project.contexts.find(c => c.id === node.id)
      if (!context) return

      const xPercent = (node.position.x / 2000) * 100
      const yPercent = (node.position.y / 1000) * 100

      // If editing a keyframe in Strategic View, update keyframe positions
      if (isEditingKeyframe) {
        updateKeyframeContextPosition(activeKeyframeId!, node.id, xPercent, yPercent)
      } else {
        // Otherwise update base positions
        if (viewMode === 'distillation') {
          updateContextPosition(node.id, {
            flow: { x: context.positions.flow.x },
            strategic: { x: context.positions.strategic.x },
            distillation: { x: xPercent, y: 100 - yPercent }, // Invert Y back to 0=bottom, 100=top
            shared: { y: context.positions.shared.y },
          })
        } else if (viewMode === 'flow') {
          updateContextPosition(node.id, {
            flow: { x: xPercent },
            strategic: { x: context.positions.strategic.x },
            distillation: { x: context.positions.distillation.x, y: context.positions.distillation.y },
            shared: { y: yPercent },
          })
        } else {
          updateContextPosition(node.id, {
            flow: { x: context.positions.flow.x },
            strategic: { x: xPercent },
            distillation: { x: context.positions.distillation.x, y: context.positions.distillation.y },
            shared: { y: yPercent },
          })
        }
      }
    }
  }, [viewMode, updateContextPosition, updateMultipleContextPositions, updateActorPosition, updateUserNeedPosition, updateKeyframeContextPosition, project, selectedContextIds, nodes, activeKeyframeId])

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useEditorStore.setState({ selectedContextId: null })
      }
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useEditorStore.getState().undo()
      }
      // Redo: Cmd/Ctrl + Shift + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        useEditorStore.getState().redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const flowStages = project?.viewConfig.flowStages || []

  return (
    <div className="relative w-full h-full">
      <TimeSlider />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        elementsSelectable
        fitView
        fitViewOptions={{
          padding: 0.15,
          minZoom: 0.1,
          maxZoom: 0.8,
        }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        {/* Wardley-style background with very subtle dots */}
        <Background gap={24} size={0.4} color="#e5e7eb" />

        {/* Canvas boundary - marks the edges of the workspace */}
        <CanvasBoundary />

        <CustomControls />
        {viewMode === 'distillation' ? (
          <DistillationRegions />
        ) : viewMode === 'flow' ? (
          <>
            <StageLabels stages={flowStages} />
            <YAxisLabels />
          </>
        ) : (
          <>
            <EvolutionBands />
            <YAxisLabels />
          </>
        )}

        {/* Arrow marker definitions */}
        <svg style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            {/* Marker for relationship edges - default state */}
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#cbd5e1"
              />
            </marker>
            {/* Marker for relationship edges - hover state */}
            <marker
              id="arrow-hover"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#475569"
              />
            </marker>
            {/* Marker for relationship edges - selected state */}
            <marker
              id="arrow-selected"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#3b82f6"
              />
            </marker>
            {/* Marker for actor connection edges */}
            <marker
              id="actor-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#94a3b8"
              />
            </marker>
            {/* Marker for need-context connection edges */}
            <marker
              id="need-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="#10b981"
              />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  )
}

// Outer wrapper component with ReactFlowProvider
export function CanvasArea() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  )
}
