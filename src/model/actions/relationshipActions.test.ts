import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  addRelationshipAction,
  deleteRelationshipAction,
  updateRelationshipAction,
  swapRelationshipDirectionAction
} from './relationshipActions'
import { createMockState, createMockContext, createMockRelationship } from './__testFixtures__/mockState'
import type { EditorState } from '../storeTypes'
import type { Relationship } from '../types'

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPropertyChange: vi.fn(),
  trackTextFieldEdit: vi.fn(),
  trackFTUEMilestone: vi.fn(),
}))

describe('relationshipActions', () => {
  let mockState: EditorState

  beforeEach(() => {
    const mockContext1 = createMockContext({
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
    })

    const mockContext2 = createMockContext({
      id: 'context-2',
      name: 'Context 2',
      positions: {
        flow: { x: 70 },
        strategic: { x: 70 },
        distillation: { x: 70, y: 70 },
        shared: { y: 70 },
      },
      strategicClassification: 'supporting',
      evolutionStage: 'product/rental',
    })

    const mockRelationship = createMockRelationship({
      id: 'rel-1',
      fromContextId: 'context-1',
      toContextId: 'context-2',
    })

    mockState = createMockState({
      id: 'project-1',
      contexts: [mockContext1, mockContext2],
      relationships: [mockRelationship],
    })
    mockState.activeProjectId = 'project-1'
    mockState.projects = {
      'project-1': {
        ...mockState.projects['test-project'],
        id: 'project-1'
      }
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
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: createMockRelationship() } }]

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
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: createMockRelationship() } }]

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
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: createMockRelationship() } }]

      const result = updateRelationshipAction(mockState, 'rel-1', { pattern: 'conformist' })

      expect(result.redoStack).toHaveLength(0)
    })

    it('should NOT clear redo stack when only description changes', () => {
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: createMockRelationship() } }]

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

  describe('swapRelationshipDirectionAction', () => {
    it('should swap fromContextId and toContextId', () => {
      const result = swapRelationshipDirectionAction(mockState, 'rel-1')

      const relationship = result.projects?.['project-1'].relationships[0]
      expect(relationship?.fromContextId).toBe('context-2')
      expect(relationship?.toContextId).toBe('context-1')
    })

    it('should preserve other relationship properties', () => {
      mockState.projects['project-1'].relationships[0] = {
        ...mockState.projects['project-1'].relationships[0],
        description: 'Test description',
        communicationMode: 'REST API',
      }

      const result = swapRelationshipDirectionAction(mockState, 'rel-1')

      const relationship = result.projects?.['project-1'].relationships[0]
      expect(relationship?.pattern).toBe('customer-supplier')
      expect(relationship?.description).toBe('Test description')
      expect(relationship?.communicationMode).toBe('REST API')
    })

    it('should add command to undo stack', () => {
      const result = swapRelationshipDirectionAction(mockState, 'rel-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('updateRelationship')
    })

    it('should store old and new relationship in undo command', () => {
      const result = swapRelationshipDirectionAction(mockState, 'rel-1')

      const command = result.undoStack?.[0]
      expect(command?.payload.oldRelationship.fromContextId).toBe('context-1')
      expect(command?.payload.oldRelationship.toContextId).toBe('context-2')
      expect(command?.payload.newRelationship.fromContextId).toBe('context-2')
      expect(command?.payload.newRelationship.toContextId).toBe('context-1')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addRelationship', payload: { relationship: createMockRelationship() } }]

      const result = swapRelationshipDirectionAction(mockState, 'rel-1')

      expect(result.redoStack).toHaveLength(0)
    })

    it('should return unchanged state if relationship not found', () => {
      const result = swapRelationshipDirectionAction(mockState, 'nonexistent')

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if no active project', () => {
      const state = { ...mockState, activeProjectId: null }
      const result = swapRelationshipDirectionAction(state, 'rel-1')

      expect(result).toBe(state)
    })

    it('should preserve other relationships', () => {
      const relationship2: Relationship = {
        id: 'rel-2',
        fromContextId: 'context-2',
        toContextId: 'context-1',
        pattern: 'anti-corruption-layer',
      }
      mockState.projects['project-1'].relationships.push(relationship2)

      const result = swapRelationshipDirectionAction(mockState, 'rel-1')

      expect(result.projects?.['project-1'].relationships).toHaveLength(2)
      expect(result.projects?.['project-1'].relationships[1]).toEqual(relationship2)
    })
  })
})
