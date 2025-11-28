import type { FlowStageMarker } from './types'

export interface StageBoundary {
  stageIndex: number
  name: string
  position: number
  startBound: number  // inclusive
  endBound: number    // exclusive (except position 100 belongs to last stage)
}

/**
 * Calculate the boundary region each stage owns.
 *
 * Stage boundaries are defined as the midpoint between adjacent stages.
 * Given stages at positions [10, 30, 50, 70, 90]:
 * - Stage at 10: owns 5 to 20 (midpoint from 0, midpoint to 30)
 * - Stage at 30: owns 20 to 40
 * - Stage at 50: owns 40 to 60
 * - Stage at 70: owns 60 to 80
 * - Stage at 90: owns 80 to 95 (midpoint to 100)
 */
export function calculateStageBoundaries(
  stages: FlowStageMarker[]
): StageBoundary[] {
  if (stages.length === 0) return []

  // Sort stages by position, preserving original indices
  const sorted = stages
    .map((s, originalIndex) => ({ ...s, originalIndex }))
    .sort((a, b) => a.position - b.position)

  return sorted.map((stage, idx) => {
    // First stage starts at 0, otherwise midpoint to previous
    const startBound = idx === 0
      ? 0
      : (sorted[idx - 1].position + stage.position) / 2

    // Last stage ends at 100, otherwise midpoint to next
    const endBound = idx === sorted.length - 1
      ? 100
      : (stage.position + sorted[idx + 1].position) / 2

    return {
      stageIndex: stage.originalIndex,
      name: stage.name,
      position: stage.position,
      startBound,
      endBound,
    }
  })
}

/**
 * Find which stage owns a given position.
 * Returns the original stage index, or null if no stages exist.
 */
export function findStageForPosition(
  position: number,
  boundaries: StageBoundary[]
): number | null {
  if (boundaries.length === 0) return null

  for (const boundary of boundaries) {
    if (position >= boundary.startBound && position < boundary.endBound) {
      return boundary.stageIndex
    }
  }

  // Handle edge case: position exactly at 100 belongs to last stage (by position)
  if (position === 100) {
    const lastByPosition = boundaries.reduce((max, b) =>
      b.position > max.position ? b : max
    )
    return lastByPosition.stageIndex
  }

  return null
}

/**
 * Filter items that fall within a stage's boundary.
 */
export function getItemsInStageBoundary<T extends { position: number }>(
  items: T[],
  boundary: StageBoundary
): T[] {
  return items.filter(item =>
    item.position >= boundary.startBound &&
    item.position < boundary.endBound
  )
}

/**
 * Get items that belong to a specific stage by index.
 */
export function getItemsInStage<T extends { position: number }>(
  items: T[],
  stageIndex: number,
  boundaries: StageBoundary[]
): T[] {
  const boundary = boundaries.find(b => b.stageIndex === stageIndex)
  if (!boundary) return []
  return getItemsInStageBoundary(items, boundary)
}
