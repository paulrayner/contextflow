import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  autosaveIfNeeded,
  determineProjectOrigin,
  calculateKeyframeTransition,
  migrateProject,
  validateStageLabel,
  validateStagePosition,
  createSelectionState,
  type FlowStage,
} from './storeHelpers'
import type { Project } from './types'
import * as persistence from './persistence'

vi.mock('./persistence')
vi.mock('./classification', () => ({
  classifyFromStrategicPosition: (x: number) => {
    if (x < 25) return 'genesis'
    if (x < 50) return 'custom-built'
    if (x < 75) return 'product'
    return 'commodity'
  }
}))

describe('autosaveIfNeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves project when projectId and projects are provided', () => {
    const mockProject = { id: 'test-project' } as Project
    const projects = { 'test-project': mockProject }
    const saveProjectMock = vi.mocked(persistence.saveProject).mockResolvedValue()

    autosaveIfNeeded('test-project', projects)

    expect(saveProjectMock).toHaveBeenCalledWith(mockProject)
  })

  it('does not save when projectId is null', () => {
    const projects = { 'test-project': {} as Project }
    const saveProjectMock = vi.mocked(persistence.saveProject)

    autosaveIfNeeded(null, projects)

    expect(saveProjectMock).not.toHaveBeenCalled()
  })

  it('does not save when projects is undefined', () => {
    const saveProjectMock = vi.mocked(persistence.saveProject)

    autosaveIfNeeded('test-project', undefined)

    expect(saveProjectMock).not.toHaveBeenCalled()
  })

  it('does not save when both are missing', () => {
    const saveProjectMock = vi.mocked(persistence.saveProject)

    autosaveIfNeeded(null, undefined)

    expect(saveProjectMock).not.toHaveBeenCalled()
  })

  it('logs error when save fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Save failed')
    vi.mocked(persistence.saveProject).mockRejectedValue(error)

    const mockProject = { id: 'test-project' } as Project
    const projects = { 'test-project': mockProject }

    autosaveIfNeeded('test-project', projects)

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to autosave project:', error)
    })

    consoleErrorSpy.mockRestore()
  })
})

describe('determineProjectOrigin', () => {
  it('returns "sample" for acme-ecommerce', () => {
    expect(determineProjectOrigin('acme-ecommerce', false)).toBe('sample')
  })

  it('returns "sample" for cbioportal', () => {
    expect(determineProjectOrigin('cbioportal', false)).toBe('sample')
  })

  it('returns "sample" for elan-warranty', () => {
    expect(determineProjectOrigin('elan-warranty', false)).toBe('sample')
  })

  it('returns "empty" for empty-project', () => {
    expect(determineProjectOrigin('empty-project', false)).toBe('empty')
  })

  it('returns "imported" for first load of custom project', () => {
    expect(determineProjectOrigin('custom-project', true)).toBe('imported')
  })

  it('returns "continued" for subsequent load of custom project', () => {
    expect(determineProjectOrigin('custom-project', false)).toBe('continued')
  })
})

describe('calculateKeyframeTransition', () => {
  it('entering keyframe mode saves current state and hides groups/relationships', () => {
    const result = calculateKeyframeTransition('kf1', null, true, false, undefined, undefined)

    expect(result).toEqual({
      activeKeyframeId: 'kf1',
      savedShowGroups: true,
      savedShowRelationships: false,
      showGroups: false,
      showRelationships: false,
    })
  })

  it('exiting keyframe mode restores saved state', () => {
    const result = calculateKeyframeTransition(null, 'kf1', false, false, true, true)

    expect(result).toEqual({
      activeKeyframeId: null,
      showGroups: true,
      showRelationships: true,
    })
  })

  it('exiting keyframe mode uses current state when saved state is undefined', () => {
    const result = calculateKeyframeTransition(null, 'kf1', false, true, undefined, undefined)

    expect(result).toEqual({
      activeKeyframeId: null,
      showGroups: false,
      showRelationships: true,
    })
  })

  it('switching between keyframes only updates activeKeyframeId', () => {
    const result = calculateKeyframeTransition('kf2', 'kf1', false, false, true, true)

    expect(result).toEqual({
      activeKeyframeId: 'kf2',
    })
  })

  it('redundant call with no active keyframe only updates activeKeyframeId', () => {
    const result = calculateKeyframeTransition(null, null, true, true, undefined, undefined)

    expect(result).toEqual({
      activeKeyframeId: null,
    })
  })
})

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

describe('validateStageLabel', () => {
  const stages: FlowStage[] = [
    { label: 'Stage 1', position: 1 },
    { label: 'Stage 2', position: 2 },
    { label: 'Stage 3', position: 3 },
  ]

  it('throws error when label already exists', () => {
    expect(() => validateStageLabel(stages, 'Stage 2')).toThrow('Stage label must be unique')
  })

  it('does not throw when label is unique', () => {
    expect(() => validateStageLabel(stages, 'Stage 4')).not.toThrow()
  })

  it('allows duplicate label when excludeIndex matches', () => {
    expect(() => validateStageLabel(stages, 'Stage 2', 1)).not.toThrow()
  })

  it('throws error when label exists at different index', () => {
    expect(() => validateStageLabel(stages, 'Stage 2', 0)).toThrow('Stage label must be unique')
  })
})

describe('validateStagePosition', () => {
  const stages: FlowStage[] = [
    { label: 'Stage 1', position: 1 },
    { label: 'Stage 2', position: 2 },
    { label: 'Stage 3', position: 3 },
  ]

  it('throws error when position already exists', () => {
    expect(() => validateStagePosition(stages, 2)).toThrow('Stage position must be unique')
  })

  it('does not throw when position is unique', () => {
    expect(() => validateStagePosition(stages, 4)).not.toThrow()
  })

  it('allows duplicate position when excludeIndex matches', () => {
    expect(() => validateStagePosition(stages, 2, 1)).not.toThrow()
  })

  it('throws error when position exists at different index', () => {
    expect(() => validateStagePosition(stages, 2, 0)).toThrow('Stage position must be unique')
  })
})

describe('createSelectionState', () => {
  it('creates context selection state', () => {
    const result = createSelectionState('ctx1', 'context')

    expect(result).toEqual({
      selectedContextId: 'ctx1',
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedActorId: null,
      selectedUserNeedId: null,
      selectedContextIds: [],
    })
  })

  it('creates relationship selection state', () => {
    const result = createSelectionState('rel1', 'relationship')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: 'rel1',
      selectedGroupId: null,
      selectedActorId: null,
      selectedUserNeedId: null,
      selectedContextIds: [],
    })
  })

  it('creates group selection state', () => {
    const result = createSelectionState('grp1', 'group')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: 'grp1',
      selectedActorId: null,
      selectedUserNeedId: null,
      selectedContextIds: [],
    })
  })

  it('creates actor selection state', () => {
    const result = createSelectionState('act1', 'actor')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedActorId: 'act1',
      selectedUserNeedId: null,
      selectedContextIds: [],
    })
  })

  it('creates userNeed selection state', () => {
    const result = createSelectionState('need1', 'userNeed')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedActorId: null,
      selectedUserNeedId: 'need1',
      selectedContextIds: [],
    })
  })

  it('creates selection state with null selectedId', () => {
    const result = createSelectionState(null, 'context')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedActorId: null,
      selectedUserNeedId: null,
      selectedContextIds: [],
    })
  })
})
