import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  migrateProject,
} from './persistence'
import type { Project } from './types'
import {
  STRATEGIC_GENESIS_MAX_X,
  STRATEGIC_CUSTOM_BUILT_MAX_X,
  STRATEGIC_PRODUCT_RENTAL_MAX_X
} from './classification'

vi.mock('./classification', () => ({
  classifyFromStrategicPosition: (x: number) => {
    if (x < 25) return 'genesis'
    if (x < 50) return 'custom-built'
    if (x < 75) return 'product'
    return 'commodity'
  },
  STRATEGIC_GENESIS_MAX_X: 25,
  STRATEGIC_CUSTOM_BUILT_MAX_X: 50,
  STRATEGIC_PRODUCT_RENTAL_MAX_X: 75
}))

describe('migrateProject', () => {
  it('adds empty actors array when missing', () => {
    const project = { contexts: [], actorConnections: [] } as unknown as Project
    const migrated = migrateProject(project)

    expect(migrated.actors).toEqual([])
  })

  it('adds empty actorConnections array when missing', () => {
    const project = { contexts: [], actors: [] } as unknown as Project
    const migrated = migrateProject(project)

    expect(migrated.actorConnections).toEqual([])
  })

  it('adds distillation position to contexts missing it', () => {
    const project = {
      actors: [],
      actorConnections: [],
      contexts: [
        {
          id: 'ctx1',
          positions: { strategic: { x: 30, y: 50 }, flow: { x: 10 } },
        },
      ],
    } as unknown as Project

    const migrated = migrateProject(project)

    expect(migrated.contexts[0].positions.distillation).toEqual({ x: 50, y: 50 })
  })

  it('adds evolutionStage to contexts missing it', () => {
    const project = {
      actors: [],
      actorConnections: [],
      contexts: [
        {
          id: 'ctx1',
          positions: { strategic: { x: 30, y: 50 }, flow: { x: 10 }, distillation: { x: 50, y: 50 } },
        },
      ],
    } as unknown as Project

    const migrated = migrateProject(project)

    expect(migrated.contexts[0].evolutionStage).toBe('custom-built')
  })

  it('adds strategicClassification to contexts missing it', () => {
    const project = {
      actors: [],
      actorConnections: [],
      contexts: [
        {
          id: 'ctx1',
          positions: { strategic: { x: 30, y: 50 }, flow: { x: 10 }, distillation: { x: 50, y: 50 } },
        },
      ],
    } as unknown as Project

    const migrated = migrateProject(project)

    expect(migrated.contexts[0].strategicClassification).toBe('supporting')
  })

  it('does not modify contexts that already have all fields', () => {
    const context = {
      id: 'ctx1',
      positions: {
        strategic: { x: 30, y: 50 },
        flow: { x: 10 },
        distillation: { x: 60, y: 70 },
      },
      strategicClassification: 'core',
      evolutionStage: 'product',
    }
    const project = {
      actors: [],
      actorConnections: [],
      contexts: [context],
    } as unknown as Project

    const migrated = migrateProject(project)

    expect(migrated.contexts[0]).toEqual(context)
  })

  it('classifies genesis evolution stage for x < 25', () => {
    const project = {
      actors: [],
      actorConnections: [],
      contexts: [
        {
          id: 'ctx1',
          positions: { strategic: { x: 10, y: 50 }, flow: { x: 10 } },
        },
      ],
    } as unknown as Project

    const migrated = migrateProject(project)

    expect(migrated.contexts[0].evolutionStage).toBe('genesis')
  })

  it('classifies custom-built evolution stage for 25 <= x < 50', () => {
    const project = {
      actors: [],
      actorConnections: [],
      contexts: [
        {
          id: 'ctx1',
          positions: { strategic: { x: 30, y: 50 }, flow: { x: 10 } },
        },
      ],
    } as unknown as Project

    const migrated = migrateProject(project)

    expect(migrated.contexts[0].evolutionStage).toBe('custom-built')
  })

  it('classifies product evolution stage for 50 <= x < 75', () => {
    const project = {
      actors: [],
      actorConnections: [],
      contexts: [
        {
          id: 'ctx1',
          positions: { strategic: { x: 60, y: 50 }, flow: { x: 10 } },
        },
      ],
    } as unknown as Project

    const migrated = migrateProject(project)

    expect(migrated.contexts[0].evolutionStage).toBe('product')
  })

  it('classifies commodity evolution stage for x >= 75', () => {
    const project = {
      actors: [],
      actorConnections: [],
      contexts: [
        {
          id: 'ctx1',
          positions: { strategic: { x: 80, y: 50 }, flow: { x: 10 } },
        },
      ],
    } as unknown as Project

    const migrated = migrateProject(project)

    expect(migrated.contexts[0].evolutionStage).toBe('commodity')
  })
})
