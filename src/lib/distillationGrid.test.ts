import { describe, it, expect } from 'vitest'
import { getGridPosition, needsRedistribution, findFirstUnoccupiedGridPosition, findFirstUnoccupiedFlowPosition } from './distillationGrid'
import type { BoundedContext } from '../model/types'

function makeContext(distillation: { x: number; y: number }, flow?: { x: number }, sharedY?: number): BoundedContext {
  return {
    id: `ctx-${Math.random()}`,
    name: 'Test',
    positions: {
      flow: flow ?? { x: 50 },
      strategic: { x: 50 },
      distillation,
      shared: { y: sharedY ?? 50 },
    },
    evolutionStage: 'custom-built',
  }
}

describe('getGridPosition', () => {
  it('returns center position for index 0', () => {
    expect(getGridPosition(0)).toEqual({ x: 50, y: 50 })
  })

  it('returns unique positions for indices 0-5', () => {
    const positions = [0, 1, 2, 3, 4, 5].map(getGridPosition)
    const unique = new Set(positions.map((p) => `${p.x},${p.y}`))
    expect(unique.size).toBe(6)
  })

  it('keeps positions within 0-100 range for first 20 indices', () => {
    for (let i = 0; i < 20; i++) {
      const pos = getGridPosition(i)
      expect(pos.x).toBeGreaterThanOrEqual(0)
      expect(pos.x).toBeLessThanOrEqual(100)
      expect(pos.y).toBeGreaterThanOrEqual(0)
      expect(pos.y).toBeLessThanOrEqual(100)
    }
  })
})

describe('needsRedistribution', () => {
  it('returns false for empty array', () => {
    expect(needsRedistribution([])).toBe(false)
  })

  it('returns false for single context', () => {
    const contexts = [makeContext({ x: 50, y: 50 })]
    expect(needsRedistribution(contexts)).toBe(false)
  })

  it('returns true when all contexts at default position', () => {
    const contexts = [
      makeContext({ x: 50, y: 50 }),
      makeContext({ x: 50, y: 50 }),
    ]
    expect(needsRedistribution(contexts)).toBe(true)
  })

  it('returns false when any context has been moved', () => {
    const contexts = [
      makeContext({ x: 50, y: 50 }),
      makeContext({ x: 60, y: 40 }),
    ]
    expect(needsRedistribution(contexts)).toBe(false)
  })
})

describe('findFirstUnoccupiedGridPosition', () => {
  it('returns position 0 when no contexts exist', () => {
    expect(findFirstUnoccupiedGridPosition([])).toEqual({ x: 50, y: 50 })
  })

  it('returns position 1 when position 0 is occupied', () => {
    const contexts = [makeContext({ x: 50, y: 50 })]
    const result = findFirstUnoccupiedGridPosition(contexts)
    expect(result).toEqual(getGridPosition(1))
  })

  it('finds gap when earlier positions are occupied', () => {
    const pos0 = getGridPosition(0)
    const pos2 = getGridPosition(2)
    const contexts = [makeContext(pos0), makeContext(pos2)]
    const result = findFirstUnoccupiedGridPosition(contexts)
    expect(result).toEqual(getGridPosition(1))
  })

  it('skips occupied positions regardless of context order', () => {
    const pos0 = getGridPosition(0)
    const pos1 = getGridPosition(1)
    const pos2 = getGridPosition(2)
    const contexts = [makeContext(pos0), makeContext(pos1), makeContext(pos2)]
    const result = findFirstUnoccupiedGridPosition(contexts)
    expect(result).toEqual(getGridPosition(3))
  })
})

describe('findFirstUnoccupiedFlowPosition', () => {
  it('returns center position when no contexts exist', () => {
    expect(findFirstUnoccupiedFlowPosition([])).toEqual({ x: 50, y: 50 })
  })

  it('returns next position when center is occupied', () => {
    const contexts = [makeContext({ x: 0, y: 0 }, { x: 50 }, 50)]
    const result = findFirstUnoccupiedFlowPosition(contexts)
    expect(result).not.toEqual({ x: 50, y: 50 })
  })

  it('finds unoccupied position based on flow.x and shared.y', () => {
    // Occupy first two grid positions (50,50) and (37,30)
    const contexts = [
      makeContext({ x: 0, y: 0 }, { x: 50 }, 50),
      makeContext({ x: 0, y: 0 }, { x: 37 }, 30),
    ]
    const result = findFirstUnoccupiedFlowPosition(contexts)
    // Should return a position different from the occupied ones
    const isNotFirst = result.x !== 50 || result.y !== 50
    const isNotSecond = result.x !== 37 || result.y !== 30
    expect(isNotFirst && isNotSecond).toBe(true)
  })
})
