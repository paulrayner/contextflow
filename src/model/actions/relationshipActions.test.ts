import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  addRelationshipAction,
  deleteRelationshipAction,
  updateRelationshipAction
} from './relationshipActions'
import type { EditorState } from '../storeTypes'
import type { Project, BoundedContext, Relationship } from '../types'

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPropertyChange: vi.fn(),
  trackTextFieldEdit: vi.fn(),
  trackFTUEMilestone: vi.fn(),
}))

describe('relationshipActions', () => {
  let mockState: EditorState
  let mockProject: Project
  let mockContext1: BoundedContext
  let mockContext2: BoundedContext
  let mockRelationship: Relationship

  beforeEach(() => {
    mockContext1 = {
      id: 'context-1',
      name: 'Context 1',
      positions: {
        flow: { x: 30 },
        strategic: { x: 30 },
        distillation: { x: 30, y: 30 },
        shared: { y: 30 },
      },
      strategicClassification: 'core',
      evolutionStage: 'custom-built',
    }

    mockContext2 = {
      id: 'context-2',
      name: 'Context 2',
      positions: {
        flow: { x: 70 },
        strategic: { x: 70 },
        distillation: { x: 70, y: 70 },
        shared: { y: 70 },
      },
      strategicClassification: 'supporting',
      evolutionStage: 'product',
    }

    mockRelationship = {
      id: 'rel-1',
      fromContextId: 'context-1',
      toContextId: 'context-2',
      pattern: 'customer-supplier',
    }

    mockProject = {
      id: 'project-1',
      name: 'Test Project',
      contexts: [mockContext1, mockContext2],
      relationships: [mockRelationship],
      repos: [],
      groups: [],
      actors: [],
      userNeeds: [],
      actorConnections: [],
      actorNeedConnections: [],
      needContextConnections: [],
      viewConfig: {
        flowStages: [],
      },
    }

    mockState = {
      activeProjectId: 'project-1',
      projects: {
        'project-1': mockProject,
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
      groupOpacity: 0.2,
      temporal: {
        currentDate: '2025',
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
      setSelectedGroup: vi.fn(),
    }
  })

  describe('addRelationshipAction', () => {
    beforeEach(() => {
      // Start with no relationships
      mockState.projects['project-1'].relationships = []
    })

    it('should add a new relationship', () => {
      const result = addRelationshipAction(mockState, 'context-1', 'context-2', 'customer-supplier', undefined)

      expect(result.projects?.['project-1'].relationships).toHaveLength(1)
      expect(result.projects?.['project-1'].relationships[0].fromContextId).toBe('context-1')
      expect(result.projects?.['project-1'].relationships[0].toContextId).toBe('context-2')
      expect(result.projects?.['project-1'].relationships[0].pattern).toBe('customer-supplier')
    })

    it('should include description if provided', () => {
      const result = addRelationshipAction(mockState, 'context-1', 'context-2', 'partnership', 'Test description')

      expect(result.projects?.['project-1'].relationships[0].description).toBe('Test description')
    })

    it('should add command to undo stack', () => {
      const result = addRelationshipAction(mockState, 'context-1', 'context-2', 'shared-kernel', undefined)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('addRelationship')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: mockRelationship } }]

      const result = addRelationshipAction(mockState, 'context-1', 'context-2', 'conformist', undefined)

      expect(result.redoStack).toHaveLength(0)
    })

    it('should return unchanged state if project not found', () => {
      const state = { ...mockState, activeProjectId: 'nonexistent' }
      const result = addRelationshipAction(state, 'context-1', 'context-2', 'partnership', undefined)

      expect(result).toBe(state)
    })
  })

  describe('deleteRelationshipAction', () => {
    it('should delete a relationship', () => {
      const result = deleteRelationshipAction(mockState, 'rel-1')

      expect(result.projects?.['project-1'].relationships).toHaveLength(0)
    })

    it('should return unchanged state if relationship not found', () => {
      const result = deleteRelationshipAction(mockState, 'nonexistent')

      expect(result).toBe(mockState)
    })

    it('should add command to undo stack', () => {
      const result = deleteRelationshipAction(mockState, 'rel-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteRelationship')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: mockRelationship } }]

      const result = deleteRelationshipAction(mockState, 'rel-1')

      expect(result.redoStack).toHaveLength(0)
    })

    it('should preserve other relationships', () => {
      const relationship2: Relationship = {
        id: 'rel-2',
        fromContextId: 'context-2',
        toContextId: 'context-1',
        pattern: 'anti-corruption-layer',
      }
      mockState.projects['project-1'].relationships.push(relationship2)

      const result = deleteRelationshipAction(mockState, 'rel-1')

      expect(result.projects?.['project-1'].relationships).toHaveLength(1)
      expect(result.projects?.['project-1'].relationships[0]).toEqual(relationship2)
    })
  })

  describe('updateRelationshipAction', () => {
    it('should update relationship pattern', () => {
      const result = updateRelationshipAction(mockState, 'rel-1', { pattern: 'partnership' })

      expect(result.projects?.['project-1'].relationships[0].pattern).toBe('partnership')
    })

    it('should update relationship description', () => {
      const result = updateRelationshipAction(mockState, 'rel-1', { description: 'New description' })

      expect(result.projects?.['project-1'].relationships[0].description).toBe('New description')
    })

    it('should update relationship communicationMode', () => {
      const result = updateRelationshipAction(mockState, 'rel-1', { communicationMode: 'sync' })

      expect(result.projects?.['project-1'].relationships[0].communicationMode).toBe('sync')
    })

    it('should return unchanged state if relationship not found', () => {
      const result = updateRelationshipAction(mockState, 'nonexistent', { pattern: 'partnership' })

      expect(result).toBe(mockState)
    })

    it('should add command to undo stack when pattern changes', () => {
      const result = updateRelationshipAction(mockState, 'rel-1', { pattern: 'shared-kernel' })

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('updateRelationship')
    })

    it('should NOT add command to undo stack when only description changes', () => {
      const result = updateRelationshipAction(mockState, 'rel-1', { description: 'Updated' })

      expect(result.undoStack).toBeUndefined()
    })

    it('should NOT add command to undo stack when only communicationMode changes', () => {
      const result = updateRelationshipAction(mockState, 'rel-1', { communicationMode: 'async' })

      expect(result.undoStack).toBeUndefined()
    })

    it('should clear redo stack when pattern changes', () => {
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: mockRelationship } }]

      const result = updateRelationshipAction(mockState, 'rel-1', { pattern: 'conformist' })

      expect(result.redoStack).toHaveLength(0)
    })

    it('should NOT clear redo stack when only description changes', () => {
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: mockRelationship } }]

      const result = updateRelationshipAction(mockState, 'rel-1', { description: 'Updated' })

      expect(result.redoStack).toBeUndefined()
    })

    it('should preserve other relationships', () => {
      const relationship2: Relationship = {
        id: 'rel-2',
        fromContextId: 'context-2',
        toContextId: 'context-1',
        pattern: 'anti-corruption-layer',
      }
      mockState.projects['project-1'].relationships.push(relationship2)

      const result = updateRelationshipAction(mockState, 'rel-1', { pattern: 'partnership' })

      expect(result.projects?.['project-1'].relationships).toHaveLength(2)
      expect(result.projects?.['project-1'].relationships[1]).toEqual(relationship2)
    })
  })
})
