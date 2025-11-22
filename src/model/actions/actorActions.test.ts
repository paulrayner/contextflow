import { describe, it, expect, vi } from 'vitest'
import type { EditorState } from '../storeTypes'
import {
  addActorAction,
  deleteActorAction,
  updateActorAction,
  updateActorPositionAction,
  createActorConnectionAction,
  deleteActorConnectionAction,
  updateActorConnectionAction,
  addUserNeedAction,
  deleteUserNeedAction,
  updateUserNeedAction,
  updateUserNeedPositionAction,
  createActorNeedConnectionAction,
  deleteActorNeedConnectionAction,
  updateActorNeedConnectionAction,
  createNeedContextConnectionAction,
  deleteNeedContextConnectionAction,
  updateNeedContextConnectionAction,
} from './actorActions'
import type { Project } from '../types'

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
}))

const mockProject: Project = {
  id: 'test-project',
  name: 'Test Project',
  description: '',
  contexts: [],
  relationships: [],
  groups: [],
  repos: [],
  actors: [],
  userNeeds: [],
  actorConnections: [],
  actorNeedConnections: [],
  needContextConnections: [],
  viewConfig: {
    flowStages: [],
  },
}

const createMockState = (projectOverrides?: Partial<Project>): EditorState => ({
  activeProjectId: 'test-project',
  projects: {
    'test-project': {
      ...mockProject,
      ...projectOverrides,
    },
  },
  activeViewMode: 'flow',
  selectedContextId: null,
  selectedRelationshipId: null,
  selectedGroupId: null,
  selectedActorId: null,
  selectedUserNeedId: null,
  selectedContextIds: [],
  canvasView: {
    flow: { zoom: 1, panX: 0, panY: 0 },
    strategic: { zoom: 1, panX: 0, panY: 0 },
    distillation: { zoom: 1, panX: 0, panY: 0 },
  },
  showGroups: true,
  showRelationships: true,
  groupOpacity: 0.6,
  temporal: {
    currentDate: '2024',
    activeKeyframeId: null,
  },
  undoStack: [],
  redoStack: [],
  updateContext: vi.fn(),
  updateContextPosition: vi.fn(),
  updateMultipleContextPositions: vi.fn(),
  setSelectedContext: vi.fn(),
  toggleContextSelection: vi.fn(),
  clearContextSelection: vi.fn(),
  setViewMode: vi.fn(),
  setActiveProject: vi.fn(),
  addContext: vi.fn(),
  deleteContext: vi.fn(),
  assignRepoToContext: vi.fn(),
  unassignRepo: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  removeContextFromGroup: vi.fn(),
  addContextToGroup: vi.fn(),
  addContextsToGroup: vi.fn(),
  addRelationship: vi.fn(),
  deleteRelationship: vi.fn(),
  updateRelationship: vi.fn(),
  setSelectedRelationship: vi.fn(),
  addActor: vi.fn(),
  deleteActor: vi.fn(),
  updateActor: vi.fn(),
  updateActorPosition: vi.fn(),
  setSelectedActor: vi.fn(),
  createActorConnection: vi.fn(),
  deleteActorConnection: vi.fn(),
  updateActorConnection: vi.fn(),
  addUserNeed: vi.fn(),
  deleteUserNeed: vi.fn(),
  updateUserNeed: vi.fn(),
  updateUserNeedPosition: vi.fn(),
  setSelectedUserNeed: vi.fn(),
  createActorNeedConnection: vi.fn(),
  deleteActorNeedConnection: vi.fn(),
  updateActorNeedConnection: vi.fn(),
  createNeedContextConnection: vi.fn(),
  deleteNeedContextConnection: vi.fn(),
  updateNeedContextConnection: vi.fn(),
  toggleShowGroups: vi.fn(),
  toggleShowRelationships: vi.fn(),
  setGroupOpacity: vi.fn(),
  updateFlowStage: vi.fn(),
  addFlowStage: vi.fn(),
  deleteFlowStage: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  fitToMap: vi.fn(),
  exportProject: vi.fn(),
  importProject: vi.fn(),
  reset: vi.fn(),
  toggleTemporalMode: vi.fn(),
  setCurrentDate: vi.fn(),
  setActiveKeyframe: vi.fn(),
  addKeyframe: vi.fn(),
  deleteKeyframe: vi.fn(),
  updateKeyframe: vi.fn(),
  updateKeyframeContextPosition: vi.fn(),
})

describe('actorActions', () => {
  describe('addActorAction', () => {
    it('should add a new actor to the project', () => {
      const state = createMockState()
      const result = addActorAction(state, 'Customer')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actors).toHaveLength(1)
      expect(updatedProject?.actors[0].name).toBe('Customer')
      expect(updatedProject?.actors[0].position).toBe(50)
    })

    it('should set selectedActorId to new actor', () => {
      const state = createMockState()
      const result = addActorAction(state, 'Customer')

      const updatedProject = result.projects?.['test-project']
      expect(result.selectedActorId).toBe(updatedProject?.actors[0].id)
    })

    it('should add to undo stack', () => {
      const state = createMockState()
      const result = addActorAction(state, 'Customer')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('addActor')
    })

    it('should clear redo stack', () => {
      const state = createMockState()
      state.redoStack = [{ type: 'addActor', payload: { actor: { id: 'old', name: 'Old', position: 50 } } }]
      const result = addActorAction(state, 'Customer')

      expect(result.redoStack).toEqual([])
    })

    it('should return unchanged state if no active project', () => {
      const state = createMockState()
      state.activeProjectId = null
      const result = addActorAction(state, 'Customer')

      expect(result).toBe(state)
    })
  })

  describe('deleteActorAction', () => {
    it('should delete an actor from the project', () => {
      const state = createMockState({
        actors: [{ id: 'actor-1', name: 'Customer', position: 50 }],
      })
      const result = deleteActorAction(state, 'actor-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actors).toHaveLength(0)
    })

    it('should delete all actor connections for the actor', () => {
      const state = createMockState({
        actors: [{ id: 'actor-1', name: 'Customer', position: 50 }],
        contexts: [{ id: 'ctx-1', name: 'Context', positions: { flow: { x: 0 }, strategic: { x: 50 }, distillation: { x: 50, y: 50 }, shared: { y: 50 } }, isExternal: false, evolutionStage: 'custom', strategicClassification: 'core' }],
        actorConnections: [
          { id: 'conn-1', actorId: 'actor-1', contextId: 'ctx-1' },
          { id: 'conn-2', actorId: 'actor-2', contextId: 'ctx-1' },
        ],
      })
      const result = deleteActorAction(state, 'actor-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actorConnections).toHaveLength(1)
      expect(updatedProject?.actorConnections[0].id).toBe('conn-2')
    })

    it('should clear selectedActorId if deleted actor was selected', () => {
      const state = createMockState({
        actors: [{ id: 'actor-1', name: 'Customer', position: 50 }],
      })
      state.selectedActorId = 'actor-1'
      const result = deleteActorAction(state, 'actor-1')

      expect(result.selectedActorId).toBeNull()
    })

    it('should add to undo stack', () => {
      const state = createMockState({
        actors: [{ id: 'actor-1', name: 'Customer', position: 50 }],
      })
      const result = deleteActorAction(state, 'actor-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteActor')
    })

    it('should return unchanged state if actor not found', () => {
      const state = createMockState()
      const result = deleteActorAction(state, 'nonexistent')

      expect(result).toBe(state)
    })
  })

  describe('updateActorAction', () => {
    it('should update actor properties', () => {
      const state = createMockState({
        actors: [{ id: 'actor-1', name: 'Customer', position: 50 }],
      })
      const result = updateActorAction(state, 'actor-1', { name: 'Updated Customer' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actors[0].name).toBe('Updated Customer')
    })

    it('should return unchanged state if actor not found', () => {
      const state = createMockState()
      const result = updateActorAction(state, 'nonexistent', { name: 'Test' })

      expect(result).toBe(state)
    })
  })

  describe('updateActorPositionAction', () => {
    it('should update actor position', () => {
      const state = createMockState({
        actors: [{ id: 'actor-1', name: 'Customer', position: 50 }],
      })
      const result = updateActorPositionAction(state, 'actor-1', 75)

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actors[0].position).toBe(75)
    })

    it('should add to undo stack with old and new positions', () => {
      const state = createMockState({
        actors: [{ id: 'actor-1', name: 'Customer', position: 50 }],
      })
      const result = updateActorPositionAction(state, 'actor-1', 75)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('moveActor')
      expect(result.undoStack?.[0].payload.oldPosition).toBe(50)
      expect(result.undoStack?.[0].payload.newPosition).toBe(75)
    })
  })

  describe('createActorConnectionAction', () => {
    it('should create a connection between actor and context', () => {
      const state = createMockState({
        actors: [{ id: 'actor-1', name: 'Customer', position: 50 }],
        contexts: [{ id: 'ctx-1', name: 'Context', positions: { flow: { x: 0 }, strategic: { x: 50 }, distillation: { x: 50, y: 50 }, shared: { y: 50 } }, isExternal: false, evolutionStage: 'custom', strategicClassification: 'core' }],
      })
      const result = createActorConnectionAction(state, 'actor-1', 'ctx-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actorConnections).toHaveLength(1)
      expect(updatedProject?.actorConnections[0].actorId).toBe('actor-1')
      expect(updatedProject?.actorConnections[0].contextId).toBe('ctx-1')
    })

    it('should add to undo stack', () => {
      const state = createMockState()
      const result = createActorConnectionAction(state, 'actor-1', 'ctx-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('addActorConnection')
    })
  })

  describe('deleteActorConnectionAction', () => {
    it('should delete an actor connection', () => {
      const state = createMockState({
        actorConnections: [{ id: 'conn-1', actorId: 'actor-1', contextId: 'ctx-1' }],
      })
      const result = deleteActorConnectionAction(state, 'conn-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actorConnections).toHaveLength(0)
    })

    it('should add to undo stack', () => {
      const state = createMockState({
        actorConnections: [{ id: 'conn-1', actorId: 'actor-1', contextId: 'ctx-1' }],
      })
      const result = deleteActorConnectionAction(state, 'conn-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteActorConnection')
    })
  })

  describe('updateActorConnectionAction', () => {
    it('should update actor connection properties', () => {
      const state = createMockState({
        actorConnections: [{ id: 'conn-1', actorId: 'actor-1', contextId: 'ctx-1' }],
      })
      const result = updateActorConnectionAction(state, 'conn-1', { contextId: 'ctx-2' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actorConnections[0].contextId).toBe('ctx-2')
    })
  })

  describe('addUserNeedAction', () => {
    it('should add a new user need to the project', () => {
      const state = createMockState()
      const { newState, newUserNeedId } = addUserNeedAction(state, 'Track Orders')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.userNeeds).toHaveLength(1)
      expect(updatedProject?.userNeeds[0].name).toBe('Track Orders')
      expect(updatedProject?.userNeeds[0].position).toBe(50)
      expect(updatedProject?.userNeeds[0].visibility).toBe(true)
      expect(newUserNeedId).toBe(updatedProject?.userNeeds[0].id)
    })

    it('should set selectedUserNeedId to new need', () => {
      const state = createMockState()
      const { newState } = addUserNeedAction(state, 'Track Orders')

      expect(newState.selectedUserNeedId).toBeDefined()
    })

    it('should return null if no active project', () => {
      const state = createMockState()
      state.activeProjectId = null
      const { newUserNeedId } = addUserNeedAction(state, 'Track Orders')

      expect(newUserNeedId).toBeNull()
    })
  })

  describe('deleteUserNeedAction', () => {
    it('should delete a user need from the project', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      const result = deleteUserNeedAction(state, 'need-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeeds).toHaveLength(0)
    })

    it('should delete all actor-need connections for the need', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
        actorNeedConnections: [
          { id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' },
          { id: 'conn-2', actorId: 'actor-1', userNeedId: 'need-2' },
        ],
      })
      const result = deleteUserNeedAction(state, 'need-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actorNeedConnections).toHaveLength(1)
      expect(updatedProject?.actorNeedConnections[0].userNeedId).toBe('need-2')
    })

    it('should delete all need-context connections for the need', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
        needContextConnections: [
          { id: 'conn-1', userNeedId: 'need-1', contextId: 'ctx-1' },
          { id: 'conn-2', userNeedId: 'need-2', contextId: 'ctx-1' },
        ],
      })
      const result = deleteUserNeedAction(state, 'need-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.needContextConnections).toHaveLength(1)
      expect(updatedProject?.needContextConnections[0].userNeedId).toBe('need-2')
    })

    it('should clear selectedUserNeedId if deleted need was selected', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      state.selectedUserNeedId = 'need-1'
      const result = deleteUserNeedAction(state, 'need-1')

      expect(result.selectedUserNeedId).toBeNull()
    })
  })

  describe('updateUserNeedAction', () => {
    it('should update user need properties', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      const result = updateUserNeedAction(state, 'need-1', { name: 'Track All Orders' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeeds[0].name).toBe('Track All Orders')
    })

    it('should return unchanged state if need not found', () => {
      const state = createMockState()
      const result = updateUserNeedAction(state, 'nonexistent', { name: 'Test' })

      expect(result).toBe(state)
    })
  })

  describe('updateUserNeedPositionAction', () => {
    it('should update user need position', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      const result = updateUserNeedPositionAction(state, 'need-1', 75)

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeeds[0].position).toBe(75)
    })

    it('should add to undo stack with old and new positions', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      const result = updateUserNeedPositionAction(state, 'need-1', 75)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('moveUserNeed')
      expect(result.undoStack?.[0].payload.oldPosition).toBe(50)
      expect(result.undoStack?.[0].payload.newPosition).toBe(75)
    })
  })

  describe('createActorNeedConnectionAction', () => {
    it('should create a connection between actor and user need', () => {
      const state = createMockState()
      const { newState } = createActorNeedConnectionAction(state, 'actor-1', 'need-1')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.actorNeedConnections).toHaveLength(1)
      expect(updatedProject?.actorNeedConnections[0].actorId).toBe('actor-1')
      expect(updatedProject?.actorNeedConnections[0].userNeedId).toBe('need-1')
    })

    it('should add to undo stack', () => {
      const state = createMockState()
      const { newState } = createActorNeedConnectionAction(state, 'actor-1', 'need-1')

      expect(newState.undoStack).toHaveLength(1)
      expect(newState.undoStack?.[0].type).toBe('addActorNeedConnection')
    })

    it('should return connection id', () => {
      const state = createMockState()
      const { newConnectionId } = createActorNeedConnectionAction(state, 'actor-1', 'need-1')

      expect(newConnectionId).toBeDefined()
      expect(newConnectionId).not.toBeNull()
    })
  })

  describe('deleteActorNeedConnectionAction', () => {
    it('should delete an actor-need connection', () => {
      const state = createMockState({
        actorNeedConnections: [{ id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' }],
      })
      const result = deleteActorNeedConnectionAction(state, 'conn-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actorNeedConnections).toHaveLength(0)
    })

    it('should add to undo stack', () => {
      const state = createMockState({
        actorNeedConnections: [{ id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' }],
      })
      const result = deleteActorNeedConnectionAction(state, 'conn-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteActorNeedConnection')
    })
  })

  describe('updateActorNeedConnectionAction', () => {
    it('should update actor-need connection properties', () => {
      const state = createMockState({
        actorNeedConnections: [{ id: 'conn-1', actorId: 'actor-1', userNeedId: 'need-1' }],
      })
      const result = updateActorNeedConnectionAction(state, 'conn-1', { userNeedId: 'need-2' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.actorNeedConnections[0].userNeedId).toBe('need-2')
    })
  })

  describe('createNeedContextConnectionAction', () => {
    it('should create a connection between user need and context', () => {
      const state = createMockState()
      const { newState } = createNeedContextConnectionAction(state, 'need-1', 'ctx-1')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.needContextConnections).toHaveLength(1)
      expect(updatedProject?.needContextConnections[0].userNeedId).toBe('need-1')
      expect(updatedProject?.needContextConnections[0].contextId).toBe('ctx-1')
    })

    it('should add to undo stack', () => {
      const state = createMockState()
      const { newState } = createNeedContextConnectionAction(state, 'need-1', 'ctx-1')

      expect(newState.undoStack).toHaveLength(1)
      expect(newState.undoStack?.[0].type).toBe('addNeedContextConnection')
    })

    it('should return connection id', () => {
      const state = createMockState()
      const { newConnectionId } = createNeedContextConnectionAction(state, 'need-1', 'ctx-1')

      expect(newConnectionId).toBeDefined()
      expect(newConnectionId).not.toBeNull()
    })
  })

  describe('deleteNeedContextConnectionAction', () => {
    it('should delete a need-context connection', () => {
      const state = createMockState({
        needContextConnections: [{ id: 'conn-1', userNeedId: 'need-1', contextId: 'ctx-1' }],
      })
      const result = deleteNeedContextConnectionAction(state, 'conn-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.needContextConnections).toHaveLength(0)
    })

    it('should add to undo stack', () => {
      const state = createMockState({
        needContextConnections: [{ id: 'conn-1', userNeedId: 'need-1', contextId: 'ctx-1' }],
      })
      const result = deleteNeedContextConnectionAction(state, 'conn-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteNeedContextConnection')
    })
  })

  describe('updateNeedContextConnectionAction', () => {
    it('should update need-context connection properties', () => {
      const state = createMockState({
        needContextConnections: [{ id: 'conn-1', userNeedId: 'need-1', contextId: 'ctx-1' }],
      })
      const result = updateNeedContextConnectionAction(state, 'conn-1', { contextId: 'ctx-2' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.needContextConnections[0].contextId).toBe('ctx-2')
    })
  })
})
