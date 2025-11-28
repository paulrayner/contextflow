import { describe, it, expect } from 'vitest'
import {
  validateStageName,
  validateStagePosition,
  createSelectionState,
  type FlowStage,
} from './validation'

describe('validateStageName', () => {
  const stages: FlowStage[] = [
    { name: 'Stage 1', position: 1 },
    { name: 'Stage 2', position: 2 },
    { name: 'Stage 3', position: 3 },
  ]

  it('throws error when name already exists', () => {
    expect(() => validateStageName(stages, 'Stage 2')).toThrow('Stage name must be unique')
  })

  it('does not throw when name is unique', () => {
    expect(() => validateStageName(stages, 'Stage 4')).not.toThrow()
  })

  it('allows duplicate name when excludeIndex matches', () => {
    expect(() => validateStageName(stages, 'Stage 2', 1)).not.toThrow()
  })

  it('throws error when name exists at different index', () => {
    expect(() => validateStageName(stages, 'Stage 2', 0)).toThrow('Stage name must be unique')
  })
})

describe('validateStagePosition', () => {
  const stages: FlowStage[] = [
    { name: 'Stage 1', position: 1 },
    { name: 'Stage 2', position: 2 },
    { name: 'Stage 3', position: 3 },
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
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedContextIds: [],
    })
  })

  it('creates relationship selection state', () => {
    const result = createSelectionState('rel1', 'relationship')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: 'rel1',
      selectedGroupId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedContextIds: [],
    })
  })

  it('creates group selection state', () => {
    const result = createSelectionState('grp1', 'group')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: 'grp1',
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedContextIds: [],
    })
  })

  it('creates user selection state', () => {
    const result = createSelectionState('user1', 'user')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedUserId: 'user1',
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedContextIds: [],
    })
  })

  it('creates userNeed selection state', () => {
    const result = createSelectionState('need1', 'userNeed')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedUserId: null,
      selectedUserNeedId: 'need1',
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedContextIds: [],
    })
  })

  it('creates userNeedConnection selection state', () => {
    const result = createSelectionState('conn1', 'userNeedConnection')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: 'conn1',
      selectedNeedContextConnectionId: null,
      selectedContextIds: [],
    })
  })

  it('creates needContextConnection selection state', () => {
    const result = createSelectionState('conn2', 'needContextConnection')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: 'conn2',
      selectedContextIds: [],
    })
  })

  it('creates selection state with null selectedId', () => {
    const result = createSelectionState(null, 'context')

    expect(result).toEqual({
      selectedContextId: null,
      selectedRelationshipId: null,
      selectedGroupId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedContextIds: [],
    })
  })
})
