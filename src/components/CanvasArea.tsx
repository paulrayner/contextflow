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
import type { BoundedContext, Relationship, Group, Actor, ActorConnection } from '../model/types'
import { User } from 'lucide-react'

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
  const [isHovered, setIsHovered] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const assignRepoToContext = useEditorStore(s => s.assignRepoToContext)

  const size = NODE_SIZES[context.codeSize?.bucket || 'medium']

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
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
    </>
  )
}

// Component to render stage labels that pan/zoom with canvas
function StageLabels({ stages }: { stages: Array<{ label: string; position: number }> }) {
  const { x, y, zoom } = useViewport()

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
      {stages.map((stage) => {
        const xPos = (stage.position / 100) * 2000
        const yPos = 40

        // Apply the same transform that React Flow applies to nodes
        const transformedX = xPos * zoom + x
        const transformedY = yPos * zoom + y

        return (
          <div
            key={stage.label}
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
            {stage.label}
          </div>
        )
      })}
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
      {bands.map((band) => {
        const xPos = (band.position / 100) * 2000
        const yPos = 960 // Bottom of canvas (1000 height - 40px padding)

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
  )
}

// Group node component - renders as a ReactFlow node for proper pan/zoom
function GroupNode({ data }: NodeProps) {
  const group = data.group as Group
  const isSelected = data.isSelected as boolean
  const [isHovered, setIsHovered] = React.useState(false)

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark')

  const groupColor = group.color || '#3b82f6'

  // Convert hex color to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Use rgba colors directly (no opacity on div) + add drop shadow in light mode
  const bgAlpha = isDarkMode
    ? (isSelected ? 0.35 : 0.25)
    : (isSelected ? 0.95 : 0.85)

  return (
    <div
      className="nodrag nopan"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: hexToRgba(groupColor, bgAlpha),
        borderRadius: '12px',
        border: isSelected ? `2px solid ${groupColor}` : `2px dashed ${groupColor}`,
        boxShadow: isDarkMode ? 'none' : `0 2px 10px ${hexToRgba(groupColor, 0.3)}`,
        transition: 'all 0.2s',
        position: 'relative',
        cursor: 'pointer',
        outline: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Group label */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '12px',
          fontSize: '11px',
          fontWeight: 700,
          color: groupColor,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '3px 8px',
          borderRadius: '4px',
          border: `1.5px solid ${groupColor}`,
          transition: 'all 0.15s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isHovered ? `0 2px 8px ${hexToRgba(groupColor, 0.4)}` : 'none',
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
        style={{
          width: 140,
          height: 60,
          backgroundColor: isSelected || isHovered ? '#eff6ff' : '#f8fafc',
          border: isSelected ? '2px solid #3b82f6' : '2px solid #cbd5e1',
          borderRadius: '12px',
          padding: '10px',
          boxShadow: isSelected
            ? '0 0 0 3px #3b82f6, 0 4px 12px -2px rgba(59, 130, 246, 0.25)'
            : isHovered
            ? '0 4px 12px -2px rgba(0, 0, 0, 0.15)'
            : '0 2px 6px 0 rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* User icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: '#dbeafe',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        >
          <User size={18} color="#3b82f6" strokeWidth={2.5} />
        </div>

        {/* Actor name */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#0f172a',
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {actor.name}
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
  const connection = data?.connection as ActorConnection | undefined

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
          stroke: isHovered ? '#60a5fa' : '#94a3b8',
          strokeWidth: isHovered ? 2 : 1.5,
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
  const relationship = data?.relationship as Relationship | undefined
  const pattern = relationship?.pattern || ''

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

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: isHovered ? '#475569' : '#cbd5e1',
          strokeWidth: isHovered ? 2.5 : 1.5,
          fill: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        markerEnd={isSymmetric ? undefined : 'url(#arrow)'}
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
        <title>{pattern}</title>
      </path>
      {/* Tooltip label on hover */}
      {isHovered && (
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
}

const edgeTypes = {
  relationship: RelationshipEdge,
  actorConnection: ActorConnectionEdge,
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
  const viewMode = useEditorStore(s => s.activeViewMode)
  const updateContextPosition = useEditorStore(s => s.updateContextPosition)
  const updateMultipleContextPositions = useEditorStore(s => s.updateMultipleContextPositions)
  const updateActorPosition = useEditorStore(s => s.updateActorPosition)
  const setSelectedActor = useEditorStore(s => s.setSelectedActor)
  const assignRepoToContext = useEditorStore(s => s.assignRepoToContext)

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

    const contextNodes = project.contexts.map((context) => {
      const size = NODE_SIZES[context.codeSize?.bucket || 'medium']

      // Map 0-100 positions to pixel coordinates
      // Choose x position based on active view mode
      const xPos = viewMode === 'flow' ? context.positions.flow.x : context.positions.strategic.x
      const x = (xPos / 100) * 2000
      const y = (context.positions.shared.y / 100) * 1000

      // Check if this context is a member of the selected group
      const isMemberOfSelectedGroup = selectedGroup?.contextIds.includes(context.id) || false

      return {
        id: context.id,
        type: 'context',
        position: { x, y },
        data: {
          context,
          isSelected: context.id === selectedContextId || selectedContextIds.includes(context.id),
          isMemberOfSelectedGroup,
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

    // Create group nodes
    const groupNodes = project.groups?.map((group) => {
      const contexts = project.contexts.filter(c => group.contextIds.includes(c.id))
      if (contexts.length === 0) return null

      // Calculate bounding box for all contexts in group
      const xPositions = contexts.map(c => (viewMode === 'flow' ? c.positions.flow.x : c.positions.strategic.x) * 20)
      const yPositions = contexts.map(c => c.positions.shared.y * 10)

      const minX = Math.min(...xPositions) - 30
      const maxX = Math.max(...xPositions) + 200
      const minY = Math.min(...yPositions) - 30
      const maxY = Math.max(...yPositions) + 150

      return {
        id: `group-${group.id}`,
        type: 'group',
        position: { x: minX, y: minY },
        data: {
          group,
          isSelected: group.id === selectedGroupId,
        },
        style: {
          width: maxX - minX,
          height: maxY - minY,
          zIndex: 0,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: 0,
        },
        className: 'group-node',
        width: maxX - minX,
        height: maxY - minY,
        draggable: false,
        selectable: true,
        connectable: false,
      }
    }).filter(Boolean) as Node[] || []

    // Create actor nodes (only in Strategic view)
    const actorNodes: Node[] = viewMode === 'strategic' && project.actors
      ? project.actors.map((actor) => {
          const x = (actor.position / 100) * 2000
          const y = 100 // Fixed y position at top

          return {
            id: actor.id,
            type: 'actor',
            position: { x, y },
            data: {
              actor,
              isSelected: actor.id === selectedActorId,
            },
            style: {
              width: 140,
              height: 60,
              zIndex: 15, // Above contexts but below actor connections
            },
            width: 140,
            height: 60,
            draggable: true,
            selectable: true,
            connectable: false,
          }
        })
      : []

    // Return groups first (rendered behind), then contexts, then actors (on top)
    return [...groupNodes, ...contextNodes, ...actorNodes]
  }, [project, selectedContextId, selectedContextIds, selectedGroupId, selectedActorId, viewMode])

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

    const relationshipEdges = project.relationships.map((rel) => ({
      id: rel.id,
      source: rel.fromContextId,
      target: rel.toContextId,
      type: 'relationship',
      data: { relationship: rel },
      animated: false,
      zIndex: 5, // Above groups (0) but below contexts (10)
    }))

    // Add actor connection edges (only in Strategic view)
    const actorConnectionEdges: Edge[] = viewMode === 'strategic' && project.actorConnections
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

    return [...relationshipEdges, ...actorConnectionEdges]
  }, [project, viewMode])

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
      })
      return
    }

    // Handle actor node clicks
    if (node.type === 'actor') {
      useEditorStore.getState().setSelectedActor(node.id)
      return
    }

    // Handle context node clicks
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      // Multi-select mode (Shift or Cmd/Ctrl)
      useEditorStore.getState().toggleContextSelection(node.id)
    } else {
      // Single select
      useEditorStore.setState({ selectedContextId: node.id, selectedContextIds: [], selectedGroupId: null, selectedActorId: null })
    }
  }, [])

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    useEditorStore.setState({ selectedContextId: null, selectedContextIds: [], selectedGroupId: null, selectedActorId: null })
  }, [])

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

          if (viewMode === 'flow') {
            positionsMap[contextId] = {
              flow: { x: newX },
              strategic: { x: ctx.positions.strategic.x },
              shared: { y: newY },
            }
          } else {
            positionsMap[contextId] = {
              flow: { x: ctx.positions.flow.x },
              strategic: { x: newX },
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
      const positionsMap: Record<string, BoundedContext['positions']> = {}

      allSelectedIds.forEach(contextId => {
        const ctx = project.contexts.find(c => c.id === contextId)
        const visualNode = nodes.find(n => n.id === contextId)
        if (!ctx || !visualNode) return

        // Get the CURRENT visual position (after React Flow's drag)
        const newX = (visualNode.position.x / 2000) * 100
        const newY = (visualNode.position.y / 1000) * 100

        if (viewMode === 'flow') {
          positionsMap[contextId] = {
            flow: { x: newX },
            strategic: { x: ctx.positions.strategic.x },
            shared: { y: newY },
          }
        } else {
          positionsMap[contextId] = {
            flow: { x: ctx.positions.flow.x },
            strategic: { x: newX },
            shared: { y: newY },
          }
        }
      })

      updateMultipleContextPositions(positionsMap)
    } else {
      // Single node move
      const context = project.contexts.find(c => c.id === node.id)
      if (!context) return

      const xPercent = (node.position.x / 2000) * 100
      const yPercent = (node.position.y / 1000) * 100

      if (viewMode === 'flow') {
        updateContextPosition(node.id, {
          flow: { x: xPercent },
          strategic: { x: context.positions.strategic.x },
          shared: { y: yPercent },
        })
      } else {
        updateContextPosition(node.id, {
          flow: { x: context.positions.flow.x },
          strategic: { x: xPercent },
          shared: { y: yPercent },
        })
      }
    }
  }, [viewMode, updateContextPosition, updateMultipleContextPositions, updateActorPosition, project, selectedContextIds, nodes])

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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
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
        {viewMode === 'flow' ? (
          <StageLabels stages={flowStages} />
        ) : (
          <EvolutionBands />
        )}
        <YAxisLabels />

        {/* Arrow marker definitions */}
        <svg style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            {/* Marker for relationship edges */}
            <marker
              id="arrow"
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
