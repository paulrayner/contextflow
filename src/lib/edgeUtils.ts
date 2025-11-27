import { Position } from 'reactflow'

/**
 * Minimal node shape for edge position calculations.
 * Compatible with React Flow's Node type.
 */
export interface NodeRect {
  position: { x: number; y: number }
  width?: number | null
  height?: number | null
}

/**
 * Edge endpoint coordinates and positions.
 */
export interface EdgeEndpoints {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
}

/**
 * Calculate vertical edge endpoints between two nodes.
 * Source connects from bottom-center, target connects to top-center.
 *
 * Returns null if either node lacks valid dimensions.
 */
export function getVerticalEdgeEndpoints(
  sourceNode: NodeRect | undefined,
  targetNode: NodeRect | undefined
): EdgeEndpoints | null {
  if (!sourceNode || !targetNode) return null
  if (!sourceNode.width || !sourceNode.height) return null
  if (!targetNode.width || !targetNode.height) return null

  return {
    sourceX: sourceNode.position.x + sourceNode.width / 2,
    sourceY: sourceNode.position.y + sourceNode.height,
    targetX: targetNode.position.x + targetNode.width / 2,
    targetY: targetNode.position.y,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  }
}

/**
 * Edge visual state for styling calculations.
 */
export type EdgeState = 'selected' | 'highlighted' | 'hovered' | 'default'

/**
 * Determine edge state from boolean flags.
 * Priority: selected > highlighted > hovered > default
 */
export function getEdgeState(
  isSelected: boolean,
  isHighlighted: boolean,
  isHovered: boolean
): EdgeState {
  if (isSelected) return 'selected'
  if (isHighlighted) return 'highlighted'
  if (isHovered) return 'hovered'
  return 'default'
}

/**
 * Get stroke width for an edge based on its visual state.
 */
export function getEdgeStrokeWidth(
  state: EdgeState,
  strokeWidths: { default: number; hover: number; selected: number }
): number {
  switch (state) {
    case 'selected':
    case 'highlighted':
      return strokeWidths.selected
    case 'hovered':
      return strokeWidths.hover
    default:
      return strokeWidths.default
  }
}

const INDICATOR_BOX_GAP = 6

export function getIndicatorBoxPosition(
  node: NodeRect | undefined,
  edgePosition: Position,
  boxWidth: number,
  boxHeight: number
): { x: number; y: number } | null {
  if (!node || !node.width || !node.height) return null

  const nodeX = node.position.x
  const nodeY = node.position.y
  const nodeW = node.width
  const nodeH = node.height

  switch (edgePosition) {
    case Position.Top:
      return {
        x: nodeX + nodeW / 2,
        y: nodeY - INDICATOR_BOX_GAP - boxHeight / 2
      }
    case Position.Bottom:
      return {
        x: nodeX + nodeW / 2,
        y: nodeY + nodeH + INDICATOR_BOX_GAP + boxHeight / 2
      }
    case Position.Left:
      return {
        x: nodeX - INDICATOR_BOX_GAP - boxWidth / 2,
        y: nodeY + nodeH / 2
      }
    case Position.Right:
      return {
        x: nodeX + nodeW + INDICATOR_BOX_GAP + boxWidth / 2,
        y: nodeY + nodeH / 2
      }
    default:
      return null
  }
}
