import { describe, it, expect } from 'vitest'
import { getGridPosition, needsRedistribution } from './distillationGrid'
import type { BoundedContext } from '../model/types'

function makeContext(distillation: { x: number; y: number }): BoundedContext {
  return {
    id: `ctx-${Math.random()}`,
    name: 'Test',
    positions: {
      flow: { x: 50 },
      strategic: { x: 50 },
      distillation,
      shared: { y: 50 },
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
