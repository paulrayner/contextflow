import type { BoundedContext } from '../model/types'

// Grid centered in supporting region (middle of distillation view)
const GRID = { xMin: 35, xMax: 65, yMin: 30, yMax: 90, cols: 3, rowSpacing: 15 }

/**
 * Calculate grid position for a context in distillation view.
 * Index 0 gets center position, subsequent indices spread in a grid.
 */
export function getGridPosition(index: number): { x: number; y: number } {
  if (index === 0) return { x: 50, y: 50 }

  const col = (index - 1) % GRID.cols
  const row = Math.floor((index - 1) / GRID.cols)
  const colWidth = (GRID.xMax - GRID.xMin) / GRID.cols

  return {
    x: Math.round(GRID.xMin + (col + 0.5) * colWidth),
    y: Math.min(GRID.yMin + row * GRID.rowSpacing, GRID.yMax),
  }
}

/**
 * Check if contexts need redistribution (all at default position 50,50).
 * Returns false for 0 or 1 context (no overlap possible).
 */
export function needsRedistribution(contexts: BoundedContext[]): boolean {
  if (contexts.length <= 1) return false
  return contexts.every(
    (c) => c.positions.distillation.x === 50 && c.positions.distillation.y === 50
  )
}
