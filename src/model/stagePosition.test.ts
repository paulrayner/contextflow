import { describe, it, expect } from 'vitest'
import { calculateNextStagePosition, calculateNextPosition } from './stagePosition'
import { FlowStageMarker } from './types'

describe('calculateNextStagePosition', () => {
  it('should return 50 for empty stages array', () => {
    const stages: FlowStageMarker[] = []
    expect(calculateNextStagePosition(stages)).toBe(50)
  })

  it('should find midpoint of largest gap when one stage exists at center', () => {
    const stages: FlowStageMarker[] = [{ name: 'Middle', position: 50 }]
    // Gaps: 0-50 (size 50) and 50-100 (size 50), both equal
    // Should pick first gap: midpoint of 0-50 = 25
    expect(calculateNextStagePosition(stages)).toBe(25)
  })

  it('should find midpoint of largest gap when stage is at low position', () => {
    const stages: FlowStageMarker[] = [{ name: 'Early', position: 10 }]
    // Gaps: 0-10 (size 10) and 10-100 (size 90)
    // Largest gap is 10-100, midpoint = 55
    expect(calculateNextStagePosition(stages)).toBe(55)
  })

  it('should find midpoint of largest gap when stage is at high position', () => {
    const stages: FlowStageMarker[] = [{ name: 'Late', position: 90 }]
    // Gaps: 0-90 (size 90) and 90-100 (size 10)
    // Largest gap is 0-90, midpoint = 45
    expect(calculateNextStagePosition(stages)).toBe(45)
  })

  it('should handle two stages and find the largest gap', () => {
    const stages: FlowStageMarker[] = [
      { name: 'First', position: 25 },
      { name: 'Second', position: 50 },
    ]
    // Gaps: 0-25 (25), 25-50 (25), 50-100 (50)
    // Largest is 50-100, midpoint = 75
    expect(calculateNextStagePosition(stages)).toBe(75)
  })

  it('should handle unsorted stages correctly', () => {
    const stages: FlowStageMarker[] = [
      { name: 'Second', position: 50 },
      { name: 'First', position: 25 },
    ]
    // Same as above but unsorted input
    expect(calculateNextStagePosition(stages)).toBe(75)
  })

  it('should handle evenly distributed stages', () => {
    const stages: FlowStageMarker[] = [
      { name: 'Discovery', position: 10 },
      { name: 'Selection', position: 30 },
      { name: 'Purchase', position: 50 },
      { name: 'Fulfillment', position: 70 },
      { name: 'Post-Sale', position: 90 },
    ]
    // Gaps: 0-10 (10), 10-30 (20), 30-50 (20), 50-70 (20), 70-90 (20), 90-100 (10)
    // Multiple gaps of size 20, first one is 10-30, midpoint = 20
    expect(calculateNextStagePosition(stages)).toBe(20)
  })

  it('should round to nearest integer', () => {
    const stages: FlowStageMarker[] = [{ name: 'Odd', position: 33 }]
    // Gaps: 0-33 (33) and 33-100 (67)
    // Largest is 33-100, midpoint = 33 + 67/2 = 66.5 → rounds to 67
    expect(calculateNextStagePosition(stages)).toBe(67)
  })

  it('should handle stages at boundaries', () => {
    const stages: FlowStageMarker[] = [
      { name: 'Start', position: 0 },
      { name: 'End', position: 100 },
    ]
    // Gaps: 0-0 (0), 0-100 (100), 100-100 (0)
    // Largest is 0-100, midpoint = 50
    expect(calculateNextStagePosition(stages)).toBe(50)
  })

  it('should handle stage at position 0', () => {
    const stages: FlowStageMarker[] = [{ name: 'Start', position: 0 }]
    // Gaps: 0-0 (0), 0-100 (100)
    // Largest is 0-100, midpoint = 50
    expect(calculateNextStagePosition(stages)).toBe(50)
  })

  it('should handle stage at position 100', () => {
    const stages: FlowStageMarker[] = [{ name: 'End', position: 100 }]
    // Gaps: 0-100 (100), 100-100 (0)
    // Largest is 0-100, midpoint = 50
    expect(calculateNextStagePosition(stages)).toBe(50)
  })
})

describe('calculateNextPosition', () => {
  it('returns 50 for empty array', () => {
    expect(calculateNextPosition([])).toBe(50)
  })

  it('finds largest gap with one item at center', () => {
    const items = [{ position: 50 }]
    expect(calculateNextPosition(items)).toBe(25)
  })

  it('finds largest gap with item at low position', () => {
    const items = [{ position: 10 }]
    expect(calculateNextPosition(items)).toBe(55)
  })

  it('finds largest gap with multiple items', () => {
    const items = [{ position: 25 }, { position: 50 }]
    expect(calculateNextPosition(items)).toBe(75)
  })

  it('works with User-like objects', () => {
    const users = [
      { id: 'u1', name: 'CSR', position: 50 },
      { id: 'u2', name: 'Admin', position: 75 },
    ]
    expect(calculateNextPosition(users)).toBe(25)
  })

  it('works with UserNeed-like objects', () => {
    const needs = [
      { id: 'n1', name: 'Need 1', position: 30, visibility: true },
      { id: 'n2', name: 'Need 2', position: 60, visibility: true },
    ]
    expect(calculateNextPosition(needs)).toBe(80)
  })
})
