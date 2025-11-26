import { describe, it, expect } from 'vitest'
import { calculateNextStagePosition } from './stagePosition'
import { FlowStageMarker } from './types'

describe('calculateNextStagePosition', () => {
  it('should return 50 for empty stages array', () => {
    const stages: FlowStageMarker[] = []
    expect(calculateNextStagePosition(stages)).toBe(50)
  })

  it('should find midpoint of largest gap when one stage exists at center', () => {
    const stages: FlowStageMarker[] = [{ label: 'Middle', position: 50 }]
    // Gaps: 0-50 (size 50) and 50-100 (size 50), both equal
    // Should pick first gap: midpoint of 0-50 = 25
    expect(calculateNextStagePosition(stages)).toBe(25)
  })

  it('should find midpoint of largest gap when stage is at low position', () => {
    const stages: FlowStageMarker[] = [{ label: 'Early', position: 10 }]
    // Gaps: 0-10 (size 10) and 10-100 (size 90)
    // Largest gap is 10-100, midpoint = 55
    expect(calculateNextStagePosition(stages)).toBe(55)
  })

  it('should find midpoint of largest gap when stage is at high position', () => {
    const stages: FlowStageMarker[] = [{ label: 'Late', position: 90 }]
    // Gaps: 0-90 (size 90) and 90-100 (size 10)
    // Largest gap is 0-90, midpoint = 45
    expect(calculateNextStagePosition(stages)).toBe(45)
  })

  it('should handle two stages and find the largest gap', () => {
    const stages: FlowStageMarker[] = [
      { label: 'First', position: 25 },
      { label: 'Second', position: 50 },
    ]
    // Gaps: 0-25 (25), 25-50 (25), 50-100 (50)
    // Largest is 50-100, midpoint = 75
    expect(calculateNextStagePosition(stages)).toBe(75)
  })

  it('should handle unsorted stages correctly', () => {
    const stages: FlowStageMarker[] = [
      { label: 'Second', position: 50 },
      { label: 'First', position: 25 },
    ]
    // Same as above but unsorted input
    expect(calculateNextStagePosition(stages)).toBe(75)
  })

  it('should handle evenly distributed stages', () => {
    const stages: FlowStageMarker[] = [
      { label: 'Discovery', position: 10 },
      { label: 'Selection', position: 30 },
      { label: 'Purchase', position: 50 },
      { label: 'Fulfillment', position: 70 },
      { label: 'Post-Sale', position: 90 },
    ]
    // Gaps: 0-10 (10), 10-30 (20), 30-50 (20), 50-70 (20), 70-90 (20), 90-100 (10)
    // Multiple gaps of size 20, first one is 10-30, midpoint = 20
    expect(calculateNextStagePosition(stages)).toBe(20)
  })

  it('should round to nearest integer', () => {
    const stages: FlowStageMarker[] = [{ label: 'Odd', position: 33 }]
    // Gaps: 0-33 (33) and 33-100 (67)
    // Largest is 33-100, midpoint = 33 + 67/2 = 66.5 → rounds to 67
    expect(calculateNextStagePosition(stages)).toBe(67)
  })

  it('should handle stages at boundaries', () => {
    const stages: FlowStageMarker[] = [
      { label: 'Start', position: 0 },
      { label: 'End', position: 100 },
    ]
    // Gaps: 0-0 (0), 0-100 (100), 100-100 (0)
    // Largest is 0-100, midpoint = 50
    expect(calculateNextStagePosition(stages)).toBe(50)
  })

  it('should handle stage at position 0', () => {
    const stages: FlowStageMarker[] = [{ label: 'Start', position: 0 }]
    // Gaps: 0-0 (0), 0-100 (100)
    // Largest is 0-100, midpoint = 50
    expect(calculateNextStagePosition(stages)).toBe(50)
  })

  it('should handle stage at position 100', () => {
    const stages: FlowStageMarker[] = [{ label: 'End', position: 100 }]
    // Gaps: 0-100 (100), 100-100 (0)
    // Largest is 0-100, midpoint = 50
    expect(calculateNextStagePosition(stages)).toBe(50)
  })
})
