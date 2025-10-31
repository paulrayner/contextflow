import React, { useMemo, useCallback } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEditorStore } from '../model/store'
import type { BoundedContext, Relationship } from '../model/types'

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

  const size = NODE_SIZES[context.codeSize?.bucket || 'medium']

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

  // Border color - subtle, professional
  const borderColor = isSelected ? '#64748b' : '#cbd5e1'

  // Box shadow for visual depth - softer, more professional
  const shadow = isSelected
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
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              transform: 'translate(-50%, -50%)',
              whiteSpace: 'nowrap',
              color: '#475569',
              fontSize: `${15 * zoom}px`,
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

// Component to render Y-axis labels that pan/zoom with canvas
function YAxisLabels() {
  const { x, y, zoom } = useViewport()

  const labels = [
    { text: 'User-Facing / Value Delivery', yPos: 600 },
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
            style={{
              position: 'absolute',
              left: transformedX,
              top: transformedY,
              transform: 'translate(0, -50%) rotate(-90deg)',
              transformOrigin: 'left center',
              whiteSpace: 'nowrap',
              color: '#64748b',
              fontSize: `${11 * zoom}px`,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.75,
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

export function CanvasArea() {
  const projectId = useEditorStore(s => s.activeProjectId)
  const project = useEditorStore(s => (projectId ? s.projects[projectId] : undefined))
  const selectedContextId = useEditorStore(s => s.selectedContextId)

  // Convert BoundedContexts to React Flow nodes
  const nodes: Node[] = useMemo(() => {
    if (!project) return []

    return project.contexts.map((context) => {
      const size = NODE_SIZES[context.codeSize?.bucket || 'medium']

      // Map 0-100 positions to pixel coordinates
      // Use a scale factor for better spacing
      const x = (context.positions.flow.x / 100) * 2000
      const y = (context.positions.shared.y / 100) * 1000

      return {
        id: context.id,
        type: 'context',
        position: { x, y },
        data: {
          context,
          isSelected: context.id === selectedContextId,
        },
        style: {
          width: size.width,
          height: size.height,
        },
        width: size.width,
        height: size.height,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: false,
        selectable: true,
        connectable: false,
      }
    })
  }, [project, selectedContextId])

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
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    useEditorStore.setState({ selectedContextId: node.id })
  }, [])

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    useEditorStore.setState({ selectedContextId: null })
  }, [])

  // Handle escape key (deselect)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useEditorStore.setState({ selectedContextId: null })
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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
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
        <CustomControls />
        <StageLabels stages={flowStages} />
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
