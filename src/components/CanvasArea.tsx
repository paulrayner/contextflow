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
  Position,
  Handle,
  useViewport,
  useReactFlow,
  NodeDragHandler,
  useNodesState,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { useEditorStore, setFitViewCallback } from '../model/store'
import type { BoundedContext, Relationship, Group } from '../model/types'

// Node size mapping
const NODE_SIZES = {
  tiny: { width: 120, height: 70 },
  small: { width: 140, height: 80 },
  medium: { width: 170, height: 100 },
  large: { width: 200, height: 120 },
  huge: { width: 240, height: 140 },
}

// Custom node component
function ContextNode({ data }: NodeProps) {
  const context = data.context as BoundedContext
  const isSelected = data.isSelected as boolean
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

  // Border color - subtle, professional (highlight when dragging over)
  const borderColor = isDragOver ? '#3b82f6' : isSelected ? '#64748b' : '#cbd5e1'

  // Box shadow for visual depth - softer, more professional
  const shadow = isDragOver
    ? '0 0 0 3px #3b82f6, 0 8px 16px -4px rgba(59, 130, 246, 0.3)'
    : isSelected
    ? '0 0 0 2px #e0e7ff, 0 4px 12px -2px rgba(0, 0, 0, 0.15)'
    : isHovered
    ? context.isExternal
      ? '0 0 0 2px white, 0 0 0 3px #cbd5e1, 0 4px 8px -1px rgba(0, 0, 0, 0.12)'
      : '0 2px 8px -1px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)'
    : context.isExternal
    ? '0 0 0 2px white, 0 0 0 3px #cbd5e1, 0 2px 6px 0 rgba(0, 0, 0, 0.06)'
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
        const yPos = 40

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

// Component to render group overlays
function GroupsOverlay({ groups }: { groups: Array<{ group: Group; minX: number; maxX: number; minY: number; maxY: number }> }) {
  const { x, y, zoom } = useViewport()
  const selectedGroupId = useEditorStore(s => s.selectedGroupId)

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark')

  return (
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
      {groups.map(({ group, minX, maxX, minY, maxY }) => {
        const transformedMinX = minX * zoom + x
        const transformedMinY = minY * zoom + y
        const width = (maxX - minX) * zoom
        const height = (maxY - minY) * zoom

        const isSelected = group.id === selectedGroupId
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
          ? (isSelected ? 0.15 : 0.08)
          : (isSelected ? 0.5 : 0.4)

        return (
          <div
            key={group.id}
            style={{
              position: 'absolute',
              left: transformedMinX,
              top: transformedMinY,
              width,
              height,
              backgroundColor: hexToRgba(groupColor, bgAlpha),
              borderRadius: '12px',
              border: isSelected ? `2px solid ${groupColor}` : `2px dashed ${groupColor}`,
              boxShadow: isDarkMode ? 'none' : `0 2px 10px ${hexToRgba(groupColor, 0.3)}`,
              transition: 'all 0.2s',
              pointerEvents: 'none',
            }}
            title={group.label}
          >
            {/* Group label - clickable to select group */}
            <div
              onClick={(e) => {
                e.stopPropagation()
                useEditorStore.setState({
                  selectedGroupId: group.id,
                  selectedContextId: null,
                  selectedContextIds: []
                })
              }}
              style={{
                position: 'absolute',
                top: '8px',
                left: '12px',
                fontSize: `${11 * zoom}px`,
                fontWeight: 700,
                color: groupColor,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: `${3 * zoom}px ${8 * zoom}px`,
                borderRadius: `${4 * zoom}px`,
                border: `1.5px solid ${groupColor}`,
                pointerEvents: 'auto',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = `0 2px 8px ${hexToRgba(groupColor, 0.4)}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {group.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Component to render Y-axis labels that pan/zoom with canvas
function YAxisLabels() {
  const { x, y, zoom } = useViewport()

  const labels = [
    { text: 'User-Facing / Value Delivery', yPos: 500 },
    { text: 'Enabling / Platform', yPos: 1400 }
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
        const xPos = -50
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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
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
}

const edgeTypes = {
  relationship: RelationshipEdge,
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
  const viewMode = useEditorStore(s => s.activeViewMode)
  const updateContextPosition = useEditorStore(s => s.updateContextPosition)
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

  // Convert BoundedContexts to React Flow nodes
  const baseNodes: Node[] = useMemo(() => {
    if (!project) return []

    return project.contexts.map((context) => {
      const size = NODE_SIZES[context.codeSize?.bucket || 'medium']

      // Map 0-100 positions to pixel coordinates
      // Choose x position based on active view mode
      const xPos = viewMode === 'flow' ? context.positions.flow.x : context.positions.strategic.x
      const x = (xPos / 100) * 2000
      const y = (context.positions.shared.y / 100) * 1000

      return {
        id: context.id,
        type: 'context',
        position: { x, y },
        data: {
          context,
          isSelected: context.id === selectedContextId || selectedContextIds.includes(context.id),
        },
        style: {
          width: size.width,
          height: size.height,
        },
        width: size.width,
        height: size.height,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: true,
        selectable: true,
        connectable: false,
      }
    })
  }, [project, selectedContextId, viewMode])

  // Use React Flow's internal nodes state for smooth updates
  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes)

  // Update nodes when baseNodes change (view mode switch or context updates)
  useEffect(() => {
    setNodes((currentNodes) => {
      return baseNodes.map((baseNode) => {
        const existingNode = currentNodes.find(n => n.id === baseNode.id)
        // Preserve any internal React Flow state while updating position
        return existingNode ? { ...existingNode, ...baseNode } : baseNode
      })
    })
  }, [baseNodes, setNodes, selectedContextIds])

  // Convert Relationships to React Flow edges
  const edges: Edge[] = useMemo(() => {
    if (!project) return []

    return project.relationships.map((rel) => ({
      id: rel.id,
      source: rel.fromContextId,
      target: rel.toContextId,
      type: 'relationship',
      data: { relationship: rel },
      animated: false,
    }))
  }, [project])

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      // Multi-select mode (Shift or Cmd/Ctrl)
      useEditorStore.getState().toggleContextSelection(node.id)
    } else {
      // Single select
      useEditorStore.setState({ selectedContextId: node.id, selectedContextIds: [], selectedGroupId: null })
    }
  }, [])

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    useEditorStore.setState({ selectedContextId: null, selectedContextIds: [], selectedGroupId: null })
  }, [])

  // Handle node drag stop - update positions in store
  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    // Convert pixel coordinates back to 0-100 scale
    const xPercent = (node.position.x / 2000) * 100
    const yPercent = (node.position.y / 1000) * 100

    const context = project?.contexts.find(c => c.id === node.id)
    if (!context) return

    // Update the appropriate position based on view mode
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
  }, [viewMode, updateContextPosition, project])

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

  // Render groups as background hulls
  const renderGroupsOverlay = () => {
    if (!project?.groups || project.groups.length === 0) return null

    return project.groups.map(group => {
      const contexts = project.contexts.filter(c => group.contextIds.includes(c.id))
      if (contexts.length === 0) return null

      // Calculate bounding box for all contexts in group
      const xPositions = contexts.map(c => (viewMode === 'flow' ? c.positions.flow.x : c.positions.strategic.x) * 20)
      const yPositions = contexts.map(c => c.positions.shared.y * 10)

      const minX = Math.min(...xPositions) - 30
      const maxX = Math.max(...xPositions) + 200
      const minY = Math.min(...yPositions) - 30
      const maxY = Math.max(...yPositions) + 150

      return { group, minX, maxX, minY, maxY }
    }).filter(Boolean) as Array<{ group: any; minX: number; maxX: number; minY: number; maxY: number }>
  }

  const groupOverlays = renderGroupsOverlay()

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

        {/* Group overlays - render right after background to be underneath nodes/edges */}
        {groupOverlays && groupOverlays.length > 0 && (
          <Panel position="top-left" style={{ pointerEvents: 'auto', zIndex: 0 }}>
            <GroupsOverlay groups={groupOverlays} />
          </Panel>
        )}

        <CustomControls />
        {viewMode === 'flow' ? (
          <StageLabels stages={flowStages} />
        ) : (
          <EvolutionBands />
        )}
        <YAxisLabels />

        {/* Arrow marker definition */}
        <svg style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
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
