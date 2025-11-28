import { describe, it, expect } from 'vitest'
import {
  calculateStageBoundaries,
  findStageForPosition,
  getItemsInStageBoundary,
  getItemsInStage,
} from '../stageBoundaries'

describe('calculateStageBoundaries', () => {
  it('returns empty array for empty stages', () => {
    expect(calculateStageBoundaries([])).toEqual([])
  })

  it('calculates boundaries for single stage at center', () => {
    const stages = [{ name: 'Middle', position: 50 }]
    const boundaries = calculateStageBoundaries(stages)

    expect(boundaries).toHaveLength(1)
    expect(boundaries[0]).toEqual({
      stageIndex: 0,
      name: 'Middle',
      position: 50,
      startBound: 0,   // first stage always starts at 0
      endBound: 100,   // last stage always ends at 100
    })
  })

  it('calculates boundaries for single stage at edge (position 0)', () => {
    const stages = [{ name: 'Start', position: 0 }]
    const boundaries = calculateStageBoundaries(stages)

    expect(boundaries).toHaveLength(1)
    expect(boundaries[0]).toMatchObject({
      startBound: 0,   // first stage starts at 0
      endBound: 100,   // last stage ends at 100
    })
  })

  it('calculates boundaries for single stage at edge (position 100)', () => {
    const stages = [{ name: 'End', position: 100 }]
    const boundaries = calculateStageBoundaries(stages)

    expect(boundaries).toHaveLength(1)
    expect(boundaries[0]).toMatchObject({
      startBound: 0,   // first stage starts at 0
      endBound: 100,   // last stage ends at 100
    })
  })

  it('calculates boundaries for evenly spaced stages', () => {
    const stages = [
      { name: 'A', position: 10 },
      { name: 'B', position: 30 },
      { name: 'C', position: 50 },
      { name: 'D', position: 70 },
      { name: 'E', position: 90 },
    ]
    const boundaries = calculateStageBoundaries(stages)

    expect(boundaries).toHaveLength(5)
    expect(boundaries[0]).toMatchObject({ name: 'A', startBound: 0, endBound: 20 })   // starts at 0
    expect(boundaries[1]).toMatchObject({ name: 'B', startBound: 20, endBound: 40 })
    expect(boundaries[2]).toMatchObject({ name: 'C', startBound: 40, endBound: 60 })
    expect(boundaries[3]).toMatchObject({ name: 'D', startBound: 60, endBound: 80 })
    expect(boundaries[4]).toMatchObject({ name: 'E', startBound: 80, endBound: 100 }) // ends at 100
  })

  it('handles unsorted stage input and preserves original indices', () => {
    const stages = [
      { name: 'C', position: 50 },
      { name: 'A', position: 10 },
      { name: 'B', position: 30 },
    ]
    const boundaries = calculateStageBoundaries(stages)

    // Results sorted by position
    expect(boundaries[0].name).toBe('A')
    expect(boundaries[1].name).toBe('B')
    expect(boundaries[2].name).toBe('C')

    // Original indices preserved
    expect(boundaries.find(b => b.name === 'A')?.stageIndex).toBe(1)
    expect(boundaries.find(b => b.name === 'B')?.stageIndex).toBe(2)
    expect(boundaries.find(b => b.name === 'C')?.stageIndex).toBe(0)
  })

  it('handles two stages at boundaries (0 and 100)', () => {
    const stages = [
      { name: 'Start', position: 0 },
      { name: 'End', position: 100 },
    ]
    const boundaries = calculateStageBoundaries(stages)

    expect(boundaries[0]).toMatchObject({ name: 'Start', startBound: 0, endBound: 50 })
    expect(boundaries[1]).toMatchObject({ name: 'End', startBound: 50, endBound: 100 })
  })

  it('handles two adjacent stages', () => {
    const stages = [
      { name: 'First', position: 20 },
      { name: 'Second', position: 80 },
    ]
    const boundaries = calculateStageBoundaries(stages)

    expect(boundaries[0]).toMatchObject({ startBound: 0, endBound: 50 })   // starts at 0
    expect(boundaries[1]).toMatchObject({ startBound: 50, endBound: 100 }) // ends at 100
  })
})

describe('findStageForPosition', () => {
  const stages = [
    { name: 'A', position: 10 },
    { name: 'B', position: 30 },
    { name: 'C', position: 50 },
  ]
  const boundaries = calculateStageBoundaries(stages)

  it('returns null for empty boundaries', () => {
    expect(findStageForPosition(50, [])).toBeNull()
  })

  it('finds correct stage for position within first stage', () => {
    expect(findStageForPosition(0, boundaries)).toBe(0)
    expect(findStageForPosition(5, boundaries)).toBe(0)
    expect(findStageForPosition(10, boundaries)).toBe(0)
    expect(findStageForPosition(19.9, boundaries)).toBe(0)
  })

  it('finds correct stage at boundary (belongs to next stage)', () => {
    expect(findStageForPosition(20, boundaries)).toBe(1)
    expect(findStageForPosition(40, boundaries)).toBe(2)
  })

  it('finds correct stage for middle positions', () => {
    expect(findStageForPosition(25, boundaries)).toBe(1)
    expect(findStageForPosition(30, boundaries)).toBe(1)
    expect(findStageForPosition(45, boundaries)).toBe(2)
  })

  it('finds correct stage for position in last stage', () => {
    // With stages at [10, 30, 50], stage C (index 2) owns 40-100
    expect(findStageForPosition(75, boundaries)).toBe(2)
    expect(findStageForPosition(99, boundaries)).toBe(2)
  })

  it('handles position exactly at 100 (belongs to last stage by position)', () => {
    expect(findStageForPosition(100, boundaries)).toBe(2)
  })

  it('handles unsorted boundaries correctly', () => {
    const unsortedStages = [
      { name: 'C', position: 50 },
      { name: 'A', position: 10 },
    ]
    const unsortedBoundaries = calculateStageBoundaries(unsortedStages)

    // Position 5 should be in stage A (originalIndex 1)
    expect(findStageForPosition(5, unsortedBoundaries)).toBe(1)
    // Position 40 should be in stage C (originalIndex 0)
    expect(findStageForPosition(40, unsortedBoundaries)).toBe(0)
  })
})

describe('getItemsInStageBoundary', () => {
  const boundary = {
    stageIndex: 0,
    name: 'Test',
    position: 50,
    startBound: 25,
    endBound: 75,
  }

  it('returns items within boundary', () => {
    const items = [
      { id: '1', position: 30 },
      { id: '2', position: 50 },
      { id: '3', position: 74 },
    ]
    expect(getItemsInStageBoundary(items, boundary)).toHaveLength(3)
  })

  it('excludes items outside boundary', () => {
    const items = [
      { id: '1', position: 20 },
      { id: '2', position: 75 },
      { id: '3', position: 80 },
    ]
    expect(getItemsInStageBoundary(items, boundary)).toHaveLength(0)
  })

  it('includes item exactly at startBound (inclusive)', () => {
    const items = [{ id: '1', position: 25 }]
    expect(getItemsInStageBoundary(items, boundary)).toHaveLength(1)
  })

  it('excludes item exactly at endBound (exclusive)', () => {
    const items = [{ id: '1', position: 75 }]
    expect(getItemsInStageBoundary(items, boundary)).toHaveLength(0)
  })

  it('returns empty array for empty items', () => {
    expect(getItemsInStageBoundary([], boundary)).toHaveLength(0)
  })

  it('preserves item properties', () => {
    const items = [{ id: '1', name: 'Test Item', position: 50, extra: true }]
    const result = getItemsInStageBoundary(items, boundary)
    expect(result[0]).toEqual(items[0])
  })
})

describe('getItemsInStage', () => {
  const stages = [
    { name: 'Discovery', position: 20 },
    { name: 'Purchase', position: 60 },
  ]
  const boundaries = calculateStageBoundaries(stages)
  const items = [
    { id: 'u1', name: 'Item A', position: 15 },
    { id: 'u2', name: 'Item B', position: 45 },
    { id: 'u3', name: 'Item C', position: 80 },
  ]

  it('returns items in first stage', () => {
    const result = getItemsInStage(items, 0, boundaries)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Item A')
  })

  it('returns items in second stage', () => {
    const result = getItemsInStage(items, 1, boundaries)
    expect(result).toHaveLength(2)
    expect(result.map(u => u.name)).toContain('Item B')
    expect(result.map(u => u.name)).toContain('Item C')
  })

  it('returns empty array for non-existent stage index', () => {
    expect(getItemsInStage(items, 99, boundaries)).toHaveLength(0)
  })

  it('returns empty array for negative stage index', () => {
    expect(getItemsInStage(items, -1, boundaries)).toHaveLength(0)
  })

  it('returns empty array when no items exist', () => {
    expect(getItemsInStage([], 0, boundaries)).toHaveLength(0)
  })
})
