import { FlowStageMarker } from './types'

type HasPosition = { position: number }

export function calculateNextPosition(items: HasPosition[]): number {
  if (items.length === 0) return 50

  const positions = [0, ...items.map(s => s.position).sort((a, b) => a - b), 100]

  let maxGap = 0
  let gapStart = 0
  for (let i = 0; i < positions.length - 1; i++) {
    const gap = positions[i + 1] - positions[i]
    if (gap > maxGap) {
      maxGap = gap
      gapStart = positions[i]
    }
  }

  return Math.round(gapStart + maxGap / 2)
}

export function calculateNextStagePosition(stages: FlowStageMarker[]): number {
  return calculateNextPosition(stages)
}
