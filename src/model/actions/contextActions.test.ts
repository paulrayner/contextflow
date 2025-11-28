import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  updateContextAction,
  updateContextPositionAction,
  updateMultipleContextPositionsAction,
  addContextAction,
  deleteContextAction
} from './contextActions'
import { createMockState, createMockContext } from './__testFixtures__/mockState'
import type { EditorState } from '../storeTypes'

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPropertyChange: vi.fn(),
  trackTextFieldEdit: vi.fn(),
  trackFTUEMilestone: vi.fn(),
}))

describe('contextActions', () => {
  let mockState: EditorState

  beforeEach(() => {
    const mockContext = createMockContext({
      id: 'context-1',
      name: 'Test Context',
      evolutionStage: 'custom-built',
    })

    mockState = createMockState({
      id: 'project-1',
      contexts: [mockContext],
      viewConfig: {
        flowStages: [
          { name: 'Stage 1', position: 25 },
          { name: 'Stage 2', position: 75 },
        ],
      },
    })
    mockState.activeProjectId = 'project-1'
    mockState.projects = {
      'project-1': {
        ...mockState.projects['test-project'],
        id: 'project-1'
      }
    }
  })

  describe('updateContextAction', () => {
    it('should update context name', () => {
      const result = updateContextAction(mockState, 'context-1', { name: 'Updated Name' })

      expect(result.projects?.['project-1'].contexts[0].name).toBe('Updated Name')
    })

    it('should update context strategicClassification', () => {
      const result = updateContextAction(mockState, 'context-1', { strategicClassification: 'core' })

      expect(result.projects?.['project-1'].contexts[0].strategicClassification).toBe('core')
    })

    it('should return unchanged state if project not found', () => {
      const state = { ...mockState, activeProjectId: 'nonexistent' }
      const result = updateContextAction(state, 'context-1', { name: 'Updated' })

      expect(result).toBe(state)
    })

    it('should return unchanged state if context not found', () => {
      const result = updateContextAction(mockState, 'nonexistent', { name: 'Updated' })

      expect(result).toBe(mockState)
    })

    it('should preserve other contexts', () => {
      const context2: BoundedContext = {
        id: 'context-2',
        name: 'Context 2',
        positions: {
          flow: { x: 30 },
          strategic: { x: 30 },
          distillation: { x: 30, y: 30 },
          shared: { y: 30 },
        },
        strategicClassification: 'generic',
        evolutionStage: 'product',
      }
      mockState.projects['project-1'].contexts.push(context2)

      const result = updateContextAction(mockState, 'context-1', { name: 'Updated' })

      expect(result.projects?.['project-1'].contexts).toHaveLength(2)
      expect(result.projects?.['project-1'].contexts[1]).toEqual(context2)
    })
  })

  describe('updateContextPositionAction', () => {
    it('should update context positions', () => {
      const newPositions: BoundedContext['positions'] = {
        flow: { x: 60 },
        strategic: { x: 60 },
        distillation: { x: 60, y: 60 },
        shared: { y: 60 },
      }

      const result = updateContextPositionAction(mockState, 'context-1', newPositions)

      expect(result.projects?.['project-1'].contexts[0].positions).toEqual(newPositions)
    })

    it('should auto-classify based on distillation position (core domain)', () => {
      const newPositions: BoundedContext['positions'] = {
        flow: { x: 50 },
        strategic: { x: 50 },
        distillation: { x: 70, y: 60 }, // High differentiation, high complexity = core
        shared: { y: 60 },
      }

      const result = updateContextPositionAction(mockState, 'context-1', newPositions)

      expect(result.projects?.['project-1'].contexts[0].strategicClassification).toBe('core')
    })

    it('should auto-classify based on distillation position (generic)', () => {
      const newPositions: BoundedContext['positions'] = {
        flow: { x: 50 },
        strategic: { x: 50 },
        distillation: { x: 20, y: 50 }, // Low differentiation = generic
        shared: { y: 50 },
      }

      const result = updateContextPositionAction(mockState, 'context-1', newPositions)

      expect(result.projects?.['project-1'].contexts[0].strategicClassification).toBe('generic')
    })

    it('should auto-classify evolution stage based on strategic position', () => {
      const newPositions: BoundedContext['positions'] = {
        flow: { x: 50 },
        strategic: { x: 10 }, // Left area = genesis
        distillation: { x: 50, y: 50 },
        shared: { y: 50 },
      }

      const result = updateContextPositionAction(mockState, 'context-1', newPositions)

      expect(result.projects?.['project-1'].contexts[0].evolutionStage).toBe('genesis')
    })

    it('should add command to undo stack', () => {
      const newPositions: BoundedContext['positions'] = {
        flow: { x: 60 },
        strategic: { x: 60 },
        distillation: { x: 60, y: 60 },
        shared: { y: 60 },
      }

      const result = updateContextPositionAction(mockState, 'context-1', newPositions)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('moveContext')
      expect(result.command).toBeDefined()
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addContext', payload: { context: createMockContext() } }]

      const newPositions: BoundedContext['positions'] = {
        flow: { x: 60 },
        strategic: { x: 60 },
        distillation: { x: 60, y: 60 },
        shared: { y: 60 },
      }

      const result = updateContextPositionAction(mockState, 'context-1', newPositions)

      expect(result.redoStack).toHaveLength(0)
    })
  })

  describe('updateMultipleContextPositionsAction', () => {
    beforeEach(() => {
      const context2: BoundedContext = {
        id: 'context-2',
        name: 'Context 2',
        positions: {
          flow: { x: 30 },
          strategic: { x: 30 },
          distillation: { x: 30, y: 30 },
          shared: { y: 30 },
        },
        strategicClassification: 'generic',
        evolutionStage: 'product',
      }
      mockState.projects['project-1'].contexts.push(context2)
    })

    it('should update multiple context positions', () => {
      const positionsMap = {
        'context-1': {
          flow: { x: 60 },
          strategic: { x: 60 },
          distillation: { x: 60, y: 60 },
          shared: { y: 60 },
        },
        'context-2': {
          flow: { x: 70 },
          strategic: { x: 70 },
          distillation: { x: 70, y: 70 },
          shared: { y: 70 },
        },
      }

      const result = updateMultipleContextPositionsAction(mockState, positionsMap)

      expect(result.projects?.['project-1'].contexts[0].positions).toEqual(positionsMap['context-1'])
      expect(result.projects?.['project-1'].contexts[1].positions).toEqual(positionsMap['context-2'])
    })

    it('should auto-classify updated contexts', () => {
      const positionsMap = {
        'context-1': {
          flow: { x: 50 },
          strategic: { x: 10 }, // genesis
          distillation: { x: 70, y: 60 }, // core (high differentiation, high complexity)
          shared: { y: 60 },
        },
      }

      const result = updateMultipleContextPositionsAction(mockState, positionsMap)

      expect(result.projects?.['project-1'].contexts[0].strategicClassification).toBe('core')
      expect(result.projects?.['project-1'].contexts[0].evolutionStage).toBe('genesis')
    })

    it('should preserve contexts not in positionsMap', () => {
      const positionsMap = {
        'context-1': {
          flow: { x: 60 },
          strategic: { x: 60 },
          distillation: { x: 60, y: 60 },
          shared: { y: 60 },
        },
      }

      const context2OriginalPositions = mockState.projects['project-1'].contexts[1].positions

      const result = updateMultipleContextPositionsAction(mockState, positionsMap)

      expect(result.projects?.['project-1'].contexts[1].positions).toEqual(context2OriginalPositions)
    })

    it('should add command to undo stack with moveContextGroup type', () => {
      const positionsMap = {
        'context-1': {
          flow: { x: 60 },
          strategic: { x: 60 },
          distillation: { x: 60, y: 60 },
          shared: { y: 60 },
        },
      }

      const result = updateMultipleContextPositionsAction(mockState, positionsMap)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('moveContextGroup')
    })
  })

  describe('addContextAction', () => {
    it('should add a new context', () => {
      const result = addContextAction(mockState, 'New Context')

      expect(result.projects?.['project-1'].contexts).toHaveLength(2)
      expect(result.projects?.['project-1'].contexts[1].name).toBe('New Context')
    })

    it('should set default positions with grid-based distillation position', () => {
      const result = addContextAction(mockState, 'New Context')

      const newContext = result.projects?.['project-1'].contexts[1]
      // Second context gets next unoccupied grid position (index 1)
      // Flow/strategic grid: x = round(30 + 0.5 * 13.33) = 37, y = 30
      expect(newContext?.positions.flow.x).toBe(37)
      expect(newContext?.positions.strategic.x).toBe(37)
      // Distillation grid: x = round(35 + 0.5 * 10) = 40, y = 30
      expect(newContext?.positions.distillation.x).toBe(40)
      expect(newContext?.positions.distillation.y).toBe(30)
      expect(newContext?.positions.shared.y).toBe(30)
    })

    it('should set default strategic classification to supporting', () => {
      const result = addContextAction(mockState, 'New Context')

      expect(result.projects?.['project-1'].contexts[1].strategicClassification).toBe('supporting')
    })

    it('should set default evolution stage to custom-built', () => {
      const result = addContextAction(mockState, 'New Context')

      expect(result.projects?.['project-1'].contexts[1].evolutionStage).toBe('custom-built')
    })

    it('should select the new context', () => {
      const result = addContextAction(mockState, 'New Context')

      expect(result.selectedContextId).toBeDefined()
      expect(result.selectedContextId).toBe(result.newContext?.id)
    })

    it('should add command to undo stack', () => {
      const result = addContextAction(mockState, 'New Context')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('addContext')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addContext', payload: { context: createMockContext() } }]

      const result = addContextAction(mockState, 'New Context')

      expect(result.redoStack).toHaveLength(0)
    })

    it('should return newContext in result', () => {
      const result = addContextAction(mockState, 'New Context')

      expect(result.newContext).toBeDefined()
      expect(result.newContext?.name).toBe('New Context')
    })
  })

  describe('deleteContextAction', () => {
    it('should delete a context', () => {
      const result = deleteContextAction(mockState, 'context-1')

      expect(result.projects?.['project-1'].contexts).toHaveLength(0)
    })

    it('should return unchanged state if context not found', () => {
      const result = deleteContextAction(mockState, 'nonexistent')

      expect(result).toBe(mockState)
    })

    it('should remove context from temporal keyframes', () => {
      mockState.projects['project-1'].temporal = {
        enabled: true,
        keyframes: [
          {
            id: 'kf-1',
            date: '2025',
            label: 'Future',
            activeContextIds: ['context-1', 'context-2'],
            positions: {
              'context-1': { x: 50, y: 50 },
              'context-2': { x: 60, y: 60 },
            },
          },
        ],
      }

      const result = deleteContextAction(mockState, 'context-1')

      expect(result.projects?.['project-1'].temporal?.keyframes[0].activeContextIds).toEqual(['context-2'])
      expect(result.projects?.['project-1'].temporal?.keyframes[0].positions).toEqual({
        'context-2': { x: 60, y: 60 },
      })
    })

    it('should clear selection if deleted context was selected', () => {
      mockState.selectedContextId = 'context-1'

      const result = deleteContextAction(mockState, 'context-1')

      expect(result.selectedContextId).toBeNull()
    })

    it('should preserve selection if different context was selected', () => {
      mockState.selectedContextId = 'context-2'

      const result = deleteContextAction(mockState, 'context-1')

      expect(result.selectedContextId).toBe('context-2')
    })

    it('should add command to undo stack', () => {
      const result = deleteContextAction(mockState, 'context-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteContext')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addContext', payload: { context: createMockContext() } }]

      const result = deleteContextAction(mockState, 'context-1')

      expect(result.redoStack).toHaveLength(0)
    })
  })
})
