import { FlowStageMarker } from './types'

/**
 * Calculate the next available position for a new flow stage
 * by finding the midpoint of the largest gap between existing stages.
 */
export function calculateNextStagePosition(stages: FlowStageMarker[]): number {
  if (stages.length === 0) return 50

  // Get sorted positions including boundaries (0 and 100)
  const positions = [0, ...stages.map(s => s.position).sort((a, b) => a - b), 100]

  // Find largest gap
  let maxGap = 0
  let gapStart = 0
  for (let i = 0; i < positions.length - 1; i++) {
    const gap = positions[i + 1] - positions[i]
    if (gap > maxGap) {
      maxGap = gap
      gapStart = positions[i]
    }
  }

  // Return midpoint of largest gap, rounded to integer
  return Math.round(gapStart + maxGap / 2)
}
