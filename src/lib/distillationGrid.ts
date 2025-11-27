import type { BoundedContext } from '../model/types'

// Grid centered in supporting region (middle of distillation view)
const GRID = { xMin: 35, xMax: 65, yMin: 30, yMax: 90, cols: 3, rowSpacing: 15 }

// Distance threshold for considering a grid position "occupied" (% of canvas)
const OCCUPIED_THRESHOLD = 5

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

export function findFirstUnoccupiedGridPosition(contexts: BoundedContext[]): { x: number; y: number } {
  const MAX_ITERATIONS = 50

  for (let index = 0; index < MAX_ITERATIONS; index++) {
    const gridPos = getGridPosition(index)
    const isOccupied = contexts.some(ctx => {
      const dx = Math.abs(ctx.positions.distillation.x - gridPos.x)
      const dy = Math.abs(ctx.positions.distillation.y - gridPos.y)
      return dx < OCCUPIED_THRESHOLD && dy < OCCUPIED_THRESHOLD
    })

    if (!isOccupied) {
      return gridPos
    }
  }

  // Fallback: return center with small offset
  return { x: 50, y: 50 }
}
