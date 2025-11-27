import { describe, it, expect } from 'vitest'
import { applyUndo, applyRedo } from './undoRedo'
import type { Project, BoundedContext, Group, Relationship, User, UserNeed, UserNeedConnection, NeedContextConnection, TemporalKeyframe } from './types'
import type { EditorCommand } from './storeTypes'

// Helper to create minimal project for testing
function createTestProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [],
    repos: [],
    groups: [],
    relationships: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: {
      flowStages: [],
    },
    temporal: {
      enabled: false,
      keyframes: [],
    },
    ...overrides,
  }
}

// Helper to create test context
function createTestContext(id: string, overrides: Partial<BoundedContext> = {}): BoundedContext {
  return {
    id,
    name: `Context ${id}`,
    description: '',
    classification: {
      distillation: 'supporting',
      strategic: 'custom-built',
    },
    positions: {
      flow: { x: 100, y: 100 },
      strategic: { x: 100, y: 100 },
      shared: { y: 100 },
    },
    isExternal: false,
    ...overrides,
  }
}

describe('applyUndo', () => {
  describe('moveContext command', () => {
    it('should restore old positions', () => {
      const context = createTestContext('ctx1', {
        positions: {
          flow: { x: 200, y: 200 },
          strategic: { x: 200, y: 200 },
          shared: { y: 200 },
        },
      })
      const project = createTestProject({ contexts: [context] })
      const command: EditorCommand = {
        type: 'moveContext',
        payload: {
          contextId: 'ctx1',
          oldPositions: {
            flow: { x: 100, y: 100 },
            strategic: { x: 100, y: 100 },
            shared: { y: 100 },
          },
          newPositions: {
            flow: { x: 200, y: 200 },
            strategic: { x: 200, y: 200 },
            shared: { y: 200 },
          },
        },
      }

      const result = applyUndo(project, command)

      expect(result.contexts[0].positions).toEqual({
        flow: { x: 100, y: 100 },
        strategic: { x: 100, y: 100 },
        shared: { y: 100 },
      })
    })

    it('should handle missing context gracefully', () => {
      const project = createTestProject({ contexts: [] })
      const command: EditorCommand = {
        type: 'moveContext',
        payload: {
          contextId: 'nonexistent',
          oldPositions: {
            flow: { x: 100, y: 100 },
            strategic: { x: 100, y: 100 },
            shared: { y: 100 },
          },
          newPositions: {
            flow: { x: 200, y: 200 },
            strategic: { x: 200, y: 200 },
            shared: { y: 200 },
          },
        },
      }

      const result = applyUndo(project, command)

      expect(result.contexts).toEqual([])
    })
  })

  describe('moveContextGroup command', () => {
    it('should restore old positions for all moved contexts', () => {
      const ctx1 = createTestContext('ctx1', {
        positions: {
          flow: { x: 200, y: 200 },
          strategic: { x: 200, y: 200 },
          shared: { y: 200 },
        },
      })
      const ctx2 = createTestContext('ctx2', {
        positions: {
          flow: { x: 300, y: 300 },
          strategic: { x: 300, y: 300 },
          shared: { y: 300 },
        },
      })
      const project = createTestProject({ contexts: [ctx1, ctx2] })
      const command: EditorCommand = {
        type: 'moveContextGroup',
        payload: {
          positionsMap: {
            'ctx1': {
              old: {
                flow: { x: 100, y: 100 },
                strategic: { x: 100, y: 100 },
                shared: { y: 100 },
              },
              new: {
                flow: { x: 200, y: 200 },
                strategic: { x: 200, y: 200 },
                shared: { y: 200 },
              },
            },
            'ctx2': {
              old: {
                flow: { x: 150, y: 150 },
                strategic: { x: 150, y: 150 },
                shared: { y: 150 },
              },
              new: {
                flow: { x: 300, y: 300 },
                strategic: { x: 300, y: 300 },
                shared: { y: 300 },
              },
            },
          },
        },
      }

      const result = applyUndo(project, command)

      expect(result.contexts[0].positions).toEqual({
        flow: { x: 100, y: 100 },
        strategic: { x: 100, y: 100 },
        shared: { y: 100 },
      })
      expect(result.contexts[1].positions).toEqual({
        flow: { x: 150, y: 150 },
        strategic: { x: 150, y: 150 },
        shared: { y: 150 },
      })
    })
  })

  describe('addContext command', () => {
    it('should remove the added context', () => {
      const context = createTestContext('ctx1')
      const project = createTestProject({ contexts: [context] })
      const command: EditorCommand = {
        type: 'addContext',
        payload: { context },
      }

      const result = applyUndo(project, command)

      expect(result.contexts).toEqual([])
    })
  })

  describe('deleteContext command', () => {
    it('should restore the deleted context', () => {
      const context = createTestContext('ctx1')
      const project = createTestProject({ contexts: [] })
      const command: EditorCommand = {
        type: 'deleteContext',
        payload: { context },
      }

      const result = applyUndo(project, command)

      expect(result.contexts).toEqual([context])
    })
  })

  describe('assignRepo command', () => {
    it('should restore old context assignment', () => {
      const project = createTestProject({
        repos: [{ id: 'repo1', name: 'Repo 1', contextId: 'ctx2' }],
      })
      const command: EditorCommand = {
        type: 'assignRepo',
        payload: {
          repoId: 'repo1',
          oldContextId: 'ctx1',
          newContextId: 'ctx2',
        },
      }

      const result = applyUndo(project, command)

      expect(result.repos[0].contextId).toBe('ctx1')
    })

    it('should handle undefined old context', () => {
      const project = createTestProject({
        repos: [{ id: 'repo1', name: 'Repo 1', contextId: 'ctx2' }],
      })
      const command: EditorCommand = {
        type: 'assignRepo',
        payload: {
          repoId: 'repo1',
          oldContextId: undefined,
          newContextId: 'ctx2',
        },
      }

      const result = applyUndo(project, command)

      expect(result.repos[0].contextId).toBeUndefined()
    })
  })

  describe('unassignRepo command', () => {
    it('should restore context assignment', () => {
      const project = createTestProject({
        repos: [{ id: 'repo1', name: 'Repo 1', contextId: undefined }],
      })
      const command: EditorCommand = {
        type: 'unassignRepo',
        payload: {
          repoId: 'repo1',
          oldContextId: 'ctx1',
        },
      }

      const result = applyUndo(project, command)

      expect(result.repos[0].contextId).toBe('ctx1')
    })
  })

  describe('addGroup command', () => {
    it('should remove the added group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [group] })
      const command: EditorCommand = {
        type: 'addGroup',
        payload: { group },
      }

      const result = applyUndo(project, command)

      expect(result.groups).toEqual([])
    })
  })

  describe('deleteGroup command', () => {
    it('should restore the deleted group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [] })
      const command: EditorCommand = {
        type: 'deleteGroup',
        payload: { group },
      }

      const result = applyUndo(project, command)

      expect(result.groups).toEqual([group])
    })
  })

  describe('addToGroup command', () => {
    it('should remove context from group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1', 'ctx2'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [group] })
      const command: EditorCommand = {
        type: 'addToGroup',
        payload: {
          groupId: 'grp1',
          contextId: 'ctx2',
        },
      }

      const result = applyUndo(project, command)

      expect(result.groups[0].contextIds).toEqual(['ctx1'])
    })

    it('should remove multiple contexts from group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1', 'ctx2', 'ctx3'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [group] })
      const command: EditorCommand = {
        type: 'addToGroup',
        payload: {
          groupId: 'grp1',
          contextIds: ['ctx2', 'ctx3'],
        },
      }

      const result = applyUndo(project, command)

      expect(result.groups[0].contextIds).toEqual(['ctx1'])
    })
  })

  describe('removeFromGroup command', () => {
    it('should re-add context to group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [group] })
      const command: EditorCommand = {
        type: 'removeFromGroup',
        payload: {
          groupId: 'grp1',
          contextId: 'ctx2',
        },
      }

      const result = applyUndo(project, command)

      expect(result.groups[0].contextIds).toEqual(['ctx1', 'ctx2'])
    })
  })

  describe('addRelationship command', () => {
    it('should remove the added relationship', () => {
      const relationship: Relationship = {
        id: 'rel1',
        upstreamContextId: 'ctx1',
        downstreamContextId: 'ctx2',
        pattern: 'customer-supplier',
      }
      const project = createTestProject({ relationships: [relationship] })
      const command: EditorCommand = {
        type: 'addRelationship',
        payload: { relationship },
      }

      const result = applyUndo(project, command)

      expect(result.relationships).toEqual([])
    })
  })

  describe('deleteRelationship command', () => {
    it('should restore the deleted relationship', () => {
      const relationship: Relationship = {
        id: 'rel1',
        upstreamContextId: 'ctx1',
        downstreamContextId: 'ctx2',
        pattern: 'customer-supplier',
      }
      const project = createTestProject({ relationships: [] })
      const command: EditorCommand = {
        type: 'deleteRelationship',
        payload: { relationship },
      }

      const result = applyUndo(project, command)

      expect(result.relationships).toEqual([relationship])
    })
  })

  describe('updateRelationship command', () => {
    it('should restore old relationship data', () => {
      const newRel: Relationship = {
        id: 'rel1',
        upstreamContextId: 'ctx1',
        downstreamContextId: 'ctx2',
        pattern: 'conformist',
      }
      const oldRel: Relationship = {
        id: 'rel1',
        upstreamContextId: 'ctx1',
        downstreamContextId: 'ctx2',
        pattern: 'customer-supplier',
      }
      const project = createTestProject({ relationships: [newRel] })
      const command: EditorCommand = {
        type: 'updateRelationship',
        payload: {
          relationshipId: 'rel1',
          oldRelationship: oldRel,
          newRelationship: newRel,
        },
      }

      const result = applyUndo(project, command)

      expect(result.relationships[0].pattern).toBe('customer-supplier')
    })
  })

  describe('addUser command', () => {
    it('should remove the added user', () => {
      const user: User = {
        id: 'user1',
        name: 'User',
        position: 0,
      }
      const project = createTestProject({ users: [user] })
      const command: EditorCommand = {
        type: 'addUser',
        payload: { user },
      }

      const result = applyUndo(project, command)

      expect(result.users).toEqual([])
    })
  })

  describe('deleteUser command', () => {
    it('should restore the deleted user', () => {
      const user: User = {
        id: 'user1',
        name: 'User',
        position: 0,
      }
      const project = createTestProject({ users: [] })
      const command: EditorCommand = {
        type: 'deleteUser',
        payload: { user },
      }

      const result = applyUndo(project, command)

      expect(result.users).toEqual([user])
    })
  })

  describe('moveUser command', () => {
    it('should restore old user position', () => {
      const user: User = {
        id: 'user1',
        name: 'User',
        position: 1,
      }
      const project = createTestProject({ users: [user] })
      const command: EditorCommand = {
        type: 'moveUser',
        payload: {
          userId: 'user1',
          oldPosition: 0,
          newPosition: 1,
        },
      }

      const result = applyUndo(project, command)

      expect(result.users[0].position).toBe(0)
    })
  })

  describe('addUserNeed command', () => {
    it('should remove the added user need', () => {
      const userNeed: UserNeed = {
        id: 'need1',
        name: 'Need',
        position: 0,
      }
      const project = createTestProject({ userNeeds: [userNeed] })
      const command: EditorCommand = {
        type: 'addUserNeed',
        payload: { userNeed },
      }

      const result = applyUndo(project, command)

      expect(result.userNeeds).toEqual([])
    })
  })

  describe('deleteUserNeed command', () => {
    it('should restore the deleted user need', () => {
      const userNeed: UserNeed = {
        id: 'need1',
        name: 'Need',
        position: 0,
      }
      const project = createTestProject({ userNeeds: [] })
      const command: EditorCommand = {
        type: 'deleteUserNeed',
        payload: { userNeed },
      }

      const result = applyUndo(project, command)

      expect(result.userNeeds).toEqual([userNeed])
    })
  })

  describe('moveUserNeed command', () => {
    it('should restore old user need position', () => {
      const userNeed: UserNeed = {
        id: 'need1',
        name: 'Need',
        position: 1,
      }
      const project = createTestProject({ userNeeds: [userNeed] })
      const command: EditorCommand = {
        type: 'moveUserNeed',
        payload: {
          userNeedId: 'need1',
          oldPosition: 0,
          newPosition: 1,
        },
      }

      const result = applyUndo(project, command)

      expect(result.userNeeds[0].position).toBe(0)
    })
  })

  describe('connection commands', () => {
    it('should remove added user-need connection', () => {
      const connection: UserNeedConnection = {
        id: 'conn1',
        userId: 'user1',
        userNeedId: 'need1',
      }
      const project = createTestProject({ userNeedConnections: [connection] })
      const command: EditorCommand = {
        type: 'addUserNeedConnection',
        payload: { userNeedConnection: connection },
      }

      const result = applyUndo(project, command)

      expect(result.userNeedConnections).toEqual([])
    })

    it('should restore deleted user-need connection', () => {
      const connection: UserNeedConnection = {
        id: 'conn1',
        userId: 'user1',
        userNeedId: 'need1',
      }
      const project = createTestProject({ userNeedConnections: [] })
      const command: EditorCommand = {
        type: 'deleteUserNeedConnection',
        payload: { userNeedConnection: connection },
      }

      const result = applyUndo(project, command)

      expect(result.userNeedConnections).toEqual([connection])
    })

    it('should remove added need-context connection', () => {
      const connection: NeedContextConnection = {
        id: 'conn1',
        userNeedId: 'need1',
        contextId: 'ctx1',
      }
      const project = createTestProject({ needContextConnections: [connection] })
      const command: EditorCommand = {
        type: 'addNeedContextConnection',
        payload: { needContextConnection: connection },
      }

      const result = applyUndo(project, command)

      expect(result.needContextConnections).toEqual([])
    })

    it('should restore deleted need-context connection', () => {
      const connection: NeedContextConnection = {
        id: 'conn1',
        userNeedId: 'need1',
        contextId: 'ctx1',
      }
      const project = createTestProject({ needContextConnections: [] })
      const command: EditorCommand = {
        type: 'deleteNeedContextConnection',
        payload: { needContextConnection: connection },
      }

      const result = applyUndo(project, command)

      expect(result.needContextConnections).toEqual([connection])
    })
  })

  describe('flow stage commands', () => {
    it('should restore old flow stage data', () => {
      const oldStage = { label: 'Old', position: 0 }
      const newStage = { label: 'New', position: 0 }
      const project = createTestProject({
        viewConfig: { flowStages: [newStage] },
      })
      const command: EditorCommand = {
        type: 'updateFlowStage',
        payload: {
          flowStageIndex: 0,
          oldFlowStage: oldStage,
          newFlowStage: newStage,
        },
      }

      const result = applyUndo(project, command)

      expect(result.viewConfig.flowStages[0]).toEqual(oldStage)
    })

    it('should remove added flow stage', () => {
      const stage = { label: 'Stage', position: 0 }
      const project = createTestProject({
        viewConfig: { flowStages: [stage] },
      })
      const command: EditorCommand = {
        type: 'addFlowStage',
        payload: { flowStage: stage },
      }

      const result = applyUndo(project, command)

      expect(result.viewConfig.flowStages).toEqual([])
    })

    it('should restore deleted flow stage', () => {
      const stage = { label: 'Stage', position: 0 }
      const project = createTestProject({
        viewConfig: { flowStages: [] },
      })
      const command: EditorCommand = {
        type: 'deleteFlowStage',
        payload: {
          flowStageIndex: 0,
          flowStage: stage,
        },
      }

      const result = applyUndo(project, command)

      expect(result.viewConfig.flowStages).toEqual([stage])
    })
  })

  describe('temporal commands', () => {
    it('should remove created keyframe', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'Q1',
        positions: {},
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [keyframe],
        },
      })
      const command: EditorCommand = {
        type: 'createKeyframe',
        payload: { keyframe },
      }

      const result = applyUndo(project, command)

      expect(result.temporal.keyframes).toEqual([])
    })

    it('should remove multiple created keyframes', () => {
      const kf1: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'Q1',
        positions: {},
      }
      const kf2: TemporalKeyframe = {
        id: 'kf2',
        date: '2024-04-01',
        label: 'Q2',
        positions: {},
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [kf1, kf2],
        },
      })
      const command: EditorCommand = {
        type: 'createKeyframe',
        payload: { keyframes: [kf1, kf2] },
      }

      const result = applyUndo(project, command)

      expect(result.temporal.keyframes).toEqual([])
    })

    it('should restore deleted keyframe', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'Q1',
        positions: {},
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [],
        },
      })
      const command: EditorCommand = {
        type: 'deleteKeyframe',
        payload: { keyframe },
      }

      const result = applyUndo(project, command)

      expect(result.temporal.keyframes).toEqual([keyframe])
    })

    it('should restore old keyframe data', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'New',
        positions: {},
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [keyframe],
        },
      })
      const command: EditorCommand = {
        type: 'updateKeyframe',
        payload: {
          keyframeId: 'kf1',
          oldKeyframeData: { label: 'Old' },
          newKeyframeData: { label: 'New' },
        },
      }

      const result = applyUndo(project, command)

      expect(result.temporal.keyframes[0].label).toBe('Old')
    })

    it('should restore old context position in keyframe', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'Q1',
        positions: {
          'ctx1': { x: 200, y: 200 },
        },
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [keyframe],
        },
      })
      const command: EditorCommand = {
        type: 'moveContextInKeyframe',
        payload: {
          keyframeId: 'kf1',
          contextId: 'ctx1',
          oldPositions: {
            flow: { x: 100, y: 100 },
            strategic: { x: 100, y: 100 },
            shared: { y: 100 },
          },
          newPositions: {
            flow: { x: 200, y: 200 },
            strategic: { x: 200, y: 200 },
            shared: { y: 200 },
          },
        },
      }

      const result = applyUndo(project, command)

      expect(result.temporal.keyframes[0].positions['ctx1']).toEqual({ x: 100, y: 100 })
    })
  })
})

describe('applyRedo', () => {
  describe('moveContext command', () => {
    it('should apply new positions', () => {
      const context = createTestContext('ctx1', {
        positions: {
          flow: { x: 100, y: 100 },
          strategic: { x: 100, y: 100 },
          shared: { y: 100 },
        },
      })
      const project = createTestProject({ contexts: [context] })
      const command: EditorCommand = {
        type: 'moveContext',
        payload: {
          contextId: 'ctx1',
          oldPositions: {
            flow: { x: 100, y: 100 },
            strategic: { x: 100, y: 100 },
            shared: { y: 100 },
          },
          newPositions: {
            flow: { x: 200, y: 200 },
            strategic: { x: 200, y: 200 },
            shared: { y: 200 },
          },
        },
      }

      const result = applyRedo(project, command)

      expect(result.contexts[0].positions).toEqual({
        flow: { x: 200, y: 200 },
        strategic: { x: 200, y: 200 },
        shared: { y: 200 },
      })
    })
  })

  describe('moveContextGroup command', () => {
    it('should apply new positions for all moved contexts', () => {
      const ctx1 = createTestContext('ctx1', {
        positions: {
          flow: { x: 100, y: 100 },
          strategic: { x: 100, y: 100 },
          shared: { y: 100 },
        },
      })
      const ctx2 = createTestContext('ctx2', {
        positions: {
          flow: { x: 150, y: 150 },
          strategic: { x: 150, y: 150 },
          shared: { y: 150 },
        },
      })
      const project = createTestProject({ contexts: [ctx1, ctx2] })
      const command: EditorCommand = {
        type: 'moveContextGroup',
        payload: {
          positionsMap: {
            'ctx1': {
              old: {
                flow: { x: 100, y: 100 },
                strategic: { x: 100, y: 100 },
                shared: { y: 100 },
              },
              new: {
                flow: { x: 200, y: 200 },
                strategic: { x: 200, y: 200 },
                shared: { y: 200 },
              },
            },
            'ctx2': {
              old: {
                flow: { x: 150, y: 150 },
                strategic: { x: 150, y: 150 },
                shared: { y: 150 },
              },
              new: {
                flow: { x: 300, y: 300 },
                strategic: { x: 300, y: 300 },
                shared: { y: 300 },
              },
            },
          },
        },
      }

      const result = applyRedo(project, command)

      expect(result.contexts[0].positions).toEqual({
        flow: { x: 200, y: 200 },
        strategic: { x: 200, y: 200 },
        shared: { y: 200 },
      })
      expect(result.contexts[1].positions).toEqual({
        flow: { x: 300, y: 300 },
        strategic: { x: 300, y: 300 },
        shared: { y: 300 },
      })
    })
  })

  describe('addContext command', () => {
    it('should add the context', () => {
      const context = createTestContext('ctx1')
      const project = createTestProject({ contexts: [] })
      const command: EditorCommand = {
        type: 'addContext',
        payload: { context },
      }

      const result = applyRedo(project, command)

      expect(result.contexts).toEqual([context])
    })
  })

  describe('deleteContext command', () => {
    it('should remove the context', () => {
      const context = createTestContext('ctx1')
      const project = createTestProject({ contexts: [context] })
      const command: EditorCommand = {
        type: 'deleteContext',
        payload: { context },
      }

      const result = applyRedo(project, command)

      expect(result.contexts).toEqual([])
    })
  })

  describe('assignRepo command', () => {
    it('should apply new context assignment', () => {
      const project = createTestProject({
        repos: [{ id: 'repo1', name: 'Repo 1', contextId: 'ctx1' }],
      })
      const command: EditorCommand = {
        type: 'assignRepo',
        payload: {
          repoId: 'repo1',
          oldContextId: 'ctx1',
          newContextId: 'ctx2',
        },
      }

      const result = applyRedo(project, command)

      expect(result.repos[0].contextId).toBe('ctx2')
    })
  })

  describe('unassignRepo command', () => {
    it('should remove context assignment', () => {
      const project = createTestProject({
        repos: [{ id: 'repo1', name: 'Repo 1', contextId: 'ctx1' }],
      })
      const command: EditorCommand = {
        type: 'unassignRepo',
        payload: {
          repoId: 'repo1',
          oldContextId: 'ctx1',
        },
      }

      const result = applyRedo(project, command)

      expect(result.repos[0].contextId).toBeUndefined()
    })
  })

  describe('group commands', () => {
    it('should add group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [] })
      const command: EditorCommand = {
        type: 'addGroup',
        payload: { group },
      }

      const result = applyRedo(project, command)

      expect(result.groups).toEqual([group])
    })

    it('should delete group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [group] })
      const command: EditorCommand = {
        type: 'deleteGroup',
        payload: { group },
      }

      const result = applyRedo(project, command)

      expect(result.groups).toEqual([])
    })

    it('should add context to group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [group] })
      const command: EditorCommand = {
        type: 'addToGroup',
        payload: {
          groupId: 'grp1',
          contextId: 'ctx2',
        },
      }

      const result = applyRedo(project, command)

      expect(result.groups[0].contextIds).toEqual(['ctx1', 'ctx2'])
    })

    it('should add multiple contexts to group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [group] })
      const command: EditorCommand = {
        type: 'addToGroup',
        payload: {
          groupId: 'grp1',
          contextIds: ['ctx2', 'ctx3'],
        },
      }

      const result = applyRedo(project, command)

      expect(result.groups[0].contextIds).toEqual(['ctx1', 'ctx2', 'ctx3'])
    })

    it('should remove context from group', () => {
      const group: Group = {
        id: 'grp1',
        name: 'Group 1',
        contextIds: ['ctx1', 'ctx2'],
        color: '#ff0000',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      }
      const project = createTestProject({ groups: [group] })
      const command: EditorCommand = {
        type: 'removeFromGroup',
        payload: {
          groupId: 'grp1',
          contextId: 'ctx2',
        },
      }

      const result = applyRedo(project, command)

      expect(result.groups[0].contextIds).toEqual(['ctx1'])
    })
  })

  describe('relationship commands', () => {
    it('should add relationship', () => {
      const relationship: Relationship = {
        id: 'rel1',
        upstreamContextId: 'ctx1',
        downstreamContextId: 'ctx2',
        pattern: 'customer-supplier',
      }
      const project = createTestProject({ relationships: [] })
      const command: EditorCommand = {
        type: 'addRelationship',
        payload: { relationship },
      }

      const result = applyRedo(project, command)

      expect(result.relationships).toEqual([relationship])
    })

    it('should delete relationship', () => {
      const relationship: Relationship = {
        id: 'rel1',
        upstreamContextId: 'ctx1',
        downstreamContextId: 'ctx2',
        pattern: 'customer-supplier',
      }
      const project = createTestProject({ relationships: [relationship] })
      const command: EditorCommand = {
        type: 'deleteRelationship',
        payload: { relationship },
      }

      const result = applyRedo(project, command)

      expect(result.relationships).toEqual([])
    })

    it('should update relationship', () => {
      const oldRel: Relationship = {
        id: 'rel1',
        upstreamContextId: 'ctx1',
        downstreamContextId: 'ctx2',
        pattern: 'customer-supplier',
      }
      const newRel: Relationship = {
        id: 'rel1',
        upstreamContextId: 'ctx1',
        downstreamContextId: 'ctx2',
        pattern: 'conformist',
      }
      const project = createTestProject({ relationships: [oldRel] })
      const command: EditorCommand = {
        type: 'updateRelationship',
        payload: {
          relationshipId: 'rel1',
          oldRelationship: oldRel,
          newRelationship: newRel,
        },
      }

      const result = applyRedo(project, command)

      expect(result.relationships[0].pattern).toBe('conformist')
    })
  })

  describe('temporal commands', () => {
    it('should add keyframe', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'Q1',
        positions: {},
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [],
        },
      })
      const command: EditorCommand = {
        type: 'createKeyframe',
        payload: { keyframe },
      }

      const result = applyRedo(project, command)

      expect(result.temporal.keyframes).toEqual([keyframe])
    })

    it('should delete keyframe', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'Q1',
        positions: {},
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [keyframe],
        },
      })
      const command: EditorCommand = {
        type: 'deleteKeyframe',
        payload: { keyframe },
      }

      const result = applyRedo(project, command)

      expect(result.temporal.keyframes).toEqual([])
    })

    it('should update keyframe', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'Old',
        positions: {},
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [keyframe],
        },
      })
      const command: EditorCommand = {
        type: 'updateKeyframe',
        payload: {
          keyframeId: 'kf1',
          oldKeyframeData: { label: 'Old' },
          newKeyframeData: { label: 'New' },
        },
      }

      const result = applyRedo(project, command)

      expect(result.temporal.keyframes[0].label).toBe('New')
    })

    it('should move context in keyframe', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf1',
        date: '2024-01-01',
        label: 'Q1',
        positions: {
          'ctx1': { x: 100, y: 100 },
        },
      }
      const project = createTestProject({
        temporal: {
          enabled: true,
          keyframes: [keyframe],
        },
      })
      const command: EditorCommand = {
        type: 'moveContextInKeyframe',
        payload: {
          keyframeId: 'kf1',
          contextId: 'ctx1',
          oldPositions: {
            flow: { x: 100, y: 100 },
            strategic: { x: 100, y: 100 },
            shared: { y: 100 },
          },
          newPositions: {
            flow: { x: 200, y: 200 },
            strategic: { x: 200, y: 200 },
            shared: { y: 200 },
          },
        },
      }

      const result = applyRedo(project, command)

      expect(result.temporal.keyframes[0].positions['ctx1']).toEqual({ x: 200, y: 200 })
    })
  })
})
