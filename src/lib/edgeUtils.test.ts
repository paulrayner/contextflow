import { describe, it, expect } from 'vitest'
import { Position } from 'reactflow'
import {
  getVerticalEdgeEndpoints,
  getEdgeState,
  getEdgeStrokeWidth,
  getIndicatorBoxPosition,
  NodeRect,
} from './edgeUtils'

describe('getVerticalEdgeEndpoints', () => {
  const sourceNode: NodeRect = {
    position: { x: 100, y: 50 },
    width: 120,
    height: 80,
  }

  const targetNode: NodeRect = {
    position: { x: 150, y: 200 },
    width: 100,
    height: 60,
  }

  it('calculates endpoints from bottom-center of source to top-center of target', () => {
    const result = getVerticalEdgeEndpoints(sourceNode, targetNode)

    expect(result).toEqual({
      sourceX: 160, // 100 + 120/2
      sourceY: 130, // 50 + 80
      targetX: 200, // 150 + 100/2
      targetY: 200, // top of target
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    })
  })

  it('returns null when source node is undefined', () => {
    expect(getVerticalEdgeEndpoints(undefined, targetNode)).toBeNull()
  })

  it('returns null when target node is undefined', () => {
    expect(getVerticalEdgeEndpoints(sourceNode, undefined)).toBeNull()
  })

  it('returns null when source node has no width', () => {
    const invalidSource = { ...sourceNode, width: null }
    expect(getVerticalEdgeEndpoints(invalidSource, targetNode)).toBeNull()
  })

  it('returns null when source node has no height', () => {
    const invalidSource = { ...sourceNode, height: undefined }
    expect(getVerticalEdgeEndpoints(invalidSource, targetNode)).toBeNull()
  })

  it('returns null when target node has no width', () => {
    const invalidTarget = { ...targetNode, width: 0 }
    expect(getVerticalEdgeEndpoints(sourceNode, invalidTarget)).toBeNull()
  })

  it('returns null when target node has no height', () => {
    const invalidTarget = { ...targetNode, height: null }
    expect(getVerticalEdgeEndpoints(sourceNode, invalidTarget)).toBeNull()
  })
})

describe('getEdgeState', () => {
  it('returns selected when isSelected is true (highest priority)', () => {
    expect(getEdgeState(true, true, true)).toBe('selected')
    expect(getEdgeState(true, false, false)).toBe('selected')
  })

  it('returns highlighted when isHighlighted is true and not selected', () => {
    expect(getEdgeState(false, true, true)).toBe('highlighted')
    expect(getEdgeState(false, true, false)).toBe('highlighted')
  })

  it('returns hovered when isHovered is true and not selected/highlighted', () => {
    expect(getEdgeState(false, false, true)).toBe('hovered')
  })

  it('returns default when no flags are true', () => {
    expect(getEdgeState(false, false, false)).toBe('default')
  })
})

describe('getEdgeStrokeWidth', () => {
  const strokeWidths = { default: 1.5, hover: 2, selected: 2.5 }

  it('returns selected width for selected state', () => {
    expect(getEdgeStrokeWidth('selected', strokeWidths)).toBe(2.5)
  })

  it('returns selected width for highlighted state', () => {
    expect(getEdgeStrokeWidth('highlighted', strokeWidths)).toBe(2.5)
  })

  it('returns hover width for hovered state', () => {
    expect(getEdgeStrokeWidth('hovered', strokeWidths)).toBe(2)
  })

  it('returns default width for default state', () => {
    expect(getEdgeStrokeWidth('default', strokeWidths)).toBe(1.5)
  })
})

describe('getIndicatorBoxPosition', () => {
  const node: NodeRect = {
    position: { x: 100, y: 200 },
    width: 160,
    height: 100,
  }
  const boxWidth = 28
  const boxHeight = 18
  const gap = 6

  it('positions box above node center when edge is at top', () => {
    const result = getIndicatorBoxPosition(node, Position.Top, boxWidth, boxHeight)

    expect(result).toEqual({
      x: 100 + 160 / 2,
      y: 200 - gap - boxHeight / 2
    })
  })

  it('positions box below node center when edge is at bottom', () => {
    const result = getIndicatorBoxPosition(node, Position.Bottom, boxWidth, boxHeight)

    expect(result).toEqual({
      x: 100 + 160 / 2,
      y: 200 + 100 + gap + boxHeight / 2
    })
  })

  it('positions box left of node center when edge is at left', () => {
    const result = getIndicatorBoxPosition(node, Position.Left, boxWidth, boxHeight)

    expect(result).toEqual({
      x: 100 - gap - boxWidth / 2,
      y: 200 + 100 / 2
    })
  })

  it('positions box right of node center when edge is at right', () => {
    const result = getIndicatorBoxPosition(node, Position.Right, boxWidth, boxHeight)

    expect(result).toEqual({
      x: 100 + 160 + gap + boxWidth / 2,
      y: 200 + 100 / 2
    })
  })

  it('returns null when node is undefined', () => {
    expect(getIndicatorBoxPosition(undefined, Position.Top, boxWidth, boxHeight)).toBeNull()
  })

  it('returns null when node has no width', () => {
    const invalidNode = { ...node, width: null }
    expect(getIndicatorBoxPosition(invalidNode, Position.Top, boxWidth, boxHeight)).toBeNull()
  })

  it('returns null when node has no height', () => {
    const invalidNode = { ...node, height: undefined }
    expect(getIndicatorBoxPosition(invalidNode, Position.Top, boxWidth, boxHeight)).toBeNull()
  })

  it('ensures box is completely outside node boundary (top)', () => {
    const result = getIndicatorBoxPosition(node, Position.Top, boxWidth, boxHeight)!
    const boxBottom = result.y + boxHeight / 2
    const nodeTop = node.position.y

    expect(boxBottom).toBeLessThan(nodeTop)
  })

  it('ensures box is completely outside node boundary (bottom)', () => {
    const result = getIndicatorBoxPosition(node, Position.Bottom, boxWidth, boxHeight)!
    const boxTop = result.y - boxHeight / 2
    const nodeBottom = node.position.y + node.height!

    expect(boxTop).toBeGreaterThan(nodeBottom)
  })

  it('ensures box is completely outside node boundary (left)', () => {
    const result = getIndicatorBoxPosition(node, Position.Left, boxWidth, boxHeight)!
    const boxRight = result.x + boxWidth / 2
    const nodeLeft = node.position.x

    expect(boxRight).toBeLessThan(nodeLeft)
  })

  it('ensures box is completely outside node boundary (right)', () => {
    const result = getIndicatorBoxPosition(node, Position.Right, boxWidth, boxHeight)!
    const boxLeft = result.x - boxWidth / 2
    const nodeRight = node.position.x + node.width!

    expect(boxLeft).toBeGreaterThan(nodeRight)
  })
})
