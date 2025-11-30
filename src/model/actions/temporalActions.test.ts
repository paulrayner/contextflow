import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toggleTemporalModeAction,
  addKeyframeAction,
  deleteKeyframeAction,
  updateKeyframeAction,
  updateKeyframeContextPositionAction,
} from './temporalActions'
import type { Project } from '../types'
import { createMockState } from './__testFixtures__/mockState'

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
}))

describe('temporalActions', () => {
  let consoleErrorSpy: any
  let consoleWarnSpy: any

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  describe('toggleTemporalModeAction', () => {
    it('should enable temporal mode when disabled', () => {
      const state = createMockState()
      const result = toggleTemporalModeAction(state)

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.temporal?.enabled).toBe(true)
    })

    it('should disable temporal mode when enabled', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [],
        },
      })
      const result = toggleTemporalModeAction(state)

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.temporal?.enabled).toBe(false)
    })

    it('should preserve existing keyframes', () => {
      const keyframes = [
        {
          id: 'kf-1',
          date: '2024',
          label: 'Now',
          positions: {},
          activeContextIds: []
        }
      ]
      const state = createMockState({
        temporal: {
          enabled: false,
          keyframes,
        },
      })
      const result = toggleTemporalModeAction(state)

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes).toEqual(keyframes)
    })

    it('should return unchanged state if no active project', () => {
      const state = createMockState()
      state.activeProjectId = null
      const result = toggleTemporalModeAction(state)

      expect(result).toBe(state)
    })
  })

  describe('addKeyframeAction', () => {
    it('should add a new keyframe with captured context positions', () => {
      const state = createMockState({
        contexts: [
          {
            id: 'ctx-1',
            name: 'Context 1',
            positions: {
              flow: { x: 0 },
              strategic: { x: 50 },
              distillation: { x: 50, y: 50 },
              shared: { y: 100 }
            },
            evolutionStage: 'custom-built',
            strategicClassification: 'core'
          },
          {
            id: 'ctx-2',
            name: 'Context 2',
            positions: {
              flow: { x: 100 },
              strategic: { x: 75 },
              distillation: { x: 75, y: 75 },
              shared: { y: 200 }
            },
            evolutionStage: 'product/rental',
            strategicClassification: 'supporting'
          }
        ]
      })
      const { newState, newKeyframeId } = addKeyframeAction(state, '2025', 'Future')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes).toHaveLength(1)
      expect(updatedProject?.temporal?.keyframes[0].date).toBe('2025')
      expect(updatedProject?.temporal?.keyframes[0].label).toBe('Future')
      expect(newKeyframeId).toBe(updatedProject?.temporal?.keyframes[0].id)
    })

    it('should capture strategic positions from contexts', () => {
      const state = createMockState({
        contexts: [
          {
            id: 'ctx-1',
            name: 'Context 1',
            positions: {
              flow: { x: 0 },
              strategic: { x: 50 },
              distillation: { x: 50, y: 50 },
              shared: { y: 100 }
            },
            evolutionStage: 'custom-built',
            strategicClassification: 'core'
          },
          {
            id: 'ctx-2',
            name: 'Context 2',
            positions: {
              flow: { x: 100 },
              strategic: { x: 75 },
              distillation: { x: 75, y: 75 },
              shared: { y: 200 }
            },
            evolutionStage: 'product/rental',
            strategicClassification: 'supporting'
          }
        ]
      })
      const { newState } = addKeyframeAction(state, '2025', 'Future')

      const updatedProject = newState.projects?.['test-project']
      const keyframe = updatedProject?.temporal?.keyframes[0]
      expect(keyframe?.positions['ctx-1']).toEqual({ x: 50, y: 100 })
      expect(keyframe?.positions['ctx-2']).toEqual({ x: 75, y: 200 })
    })

    it('should auto-create "Current" keyframe when first keyframe is in future', () => {
      const state = createMockState()
      const { newState } = addKeyframeAction(state, '2030', 'Far Future')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes).toHaveLength(2)
      expect(updatedProject?.temporal?.keyframes[0].label).toBe('Current')
      expect(updatedProject?.temporal?.keyframes[0].date).toBe(new Date().getFullYear().toString())
      expect(updatedProject?.temporal?.keyframes[1].label).toBe('Far Future')
    })

    it('should NOT auto-create "Current" keyframe when first keyframe is current year', () => {
      const state = createMockState()
      const currentYear = new Date().getFullYear().toString()
      const { newState } = addKeyframeAction(state, currentYear, 'Now')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes).toHaveLength(1)
      expect(updatedProject?.temporal?.keyframes[0].label).toBe('Now')
    })

    it('should NOT auto-create "Current" keyframe when adding second keyframe', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-1',
              date: '2024',
              label: 'Now',
              positions: {},
              activeContextIds: []
            }
          ],
        },
      })
      const { newState } = addKeyframeAction(state, '2030', 'Far Future')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes).toHaveLength(2)
      expect(updatedProject?.temporal?.keyframes[0].date).toBe('2024')
      expect(updatedProject?.temporal?.keyframes[1].date).toBe('2030')
    })

    it('should sort keyframes by date', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-2',
              date: '2026',
              label: 'Later',
              positions: {},
              activeContextIds: []
            }
          ],
        },
      })
      const { newState } = addKeyframeAction(state, '2025', 'Earlier')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes[0].date).toBe('2025')
      expect(updatedProject?.temporal?.keyframes[1].date).toBe('2026')
    })

    it('should handle quarterly dates (YYYY-QN format)', () => {
      const state = createMockState()
      const { newState } = addKeyframeAction(state, '2025-Q2', 'Q2 2025')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes).toHaveLength(1)
      expect(updatedProject?.temporal?.keyframes[0].date).toBe('2025-Q2')
    })

    it('should reject invalid date format', () => {
      const state = createMockState()
      const { newKeyframeId } = addKeyframeAction(state, 'invalid-date', 'Bad Date')

      expect(newKeyframeId).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid keyframe date format: invalid-date')
    })

    it('should reject duplicate dates', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-1',
              date: '2025',
              label: 'Existing',
              positions: {},
              activeContextIds: []
            }
          ],
        },
      })
      const { newKeyframeId } = addKeyframeAction(state, '2025', 'Duplicate')

      expect(newKeyframeId).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Duplicate keyframe date:', '2025')
    })

    it('should warn when keyframe is more than 10 years in future', () => {
      const state = createMockState()
      const farFuture = (new Date().getFullYear() + 15).toString()
      addKeyframeAction(state, farFuture, 'Very Far')

      expect(consoleWarnSpy).toHaveBeenCalledWith(`Keyframe date ${farFuture} is more than 10 years in the future`)
    })

    it('should add to undo stack', () => {
      const state = createMockState()
      const { newState } = addKeyframeAction(state, '2025', 'Future')

      expect(newState.undoStack).toHaveLength(1)
      expect(newState.undoStack?.[0].type).toBe('createKeyframe')
    })

    it('should clear redo stack', () => {
      const state = createMockState()
      state.redoStack = [{ type: 'createKeyframe', payload: { keyframes: [] } }]
      const { newState } = addKeyframeAction(state, '2025', 'Future')

      expect(newState.redoStack).toEqual([])
    })

    it('should enable temporal mode if not already enabled', () => {
      const state = createMockState()
      const { newState } = addKeyframeAction(state, '2025', 'Future')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.temporal?.enabled).toBe(true)
    })

    it('should return null if no active project', () => {
      const state = createMockState()
      state.activeProjectId = null
      const { newKeyframeId } = addKeyframeAction(state, '2025', 'Future')

      expect(newKeyframeId).toBeNull()
    })
  })

  describe('deleteKeyframeAction', () => {
    it('should delete a keyframe', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-1',
              date: '2025',
              label: 'Future',
              positions: {},
              activeContextIds: []
            }
          ],
        },
      })
      const result = deleteKeyframeAction(state, 'kf-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes).toHaveLength(0)
    })

    it('should add to undo stack with deleted keyframe data', () => {
      const keyframe = {
        id: 'kf-1',
        date: '2025',
        label: 'Future',
        positions: {},
        activeContextIds: []
      }
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [keyframe],
        },
      })
      const result = deleteKeyframeAction(state, 'kf-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteKeyframe')
      expect(result.undoStack?.[0].payload.keyframe).toEqual(keyframe)
    })

    it('should return unchanged state if keyframe not found', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [],
        },
      })
      const result = deleteKeyframeAction(state, 'nonexistent')

      expect(result).toBe(state)
    })

    it('should return unchanged state if project has no temporal config', () => {
      const state = createMockState()
      const result = deleteKeyframeAction(state, 'kf-1')

      expect(result).toBe(state)
    })
  })

  describe('updateKeyframeAction', () => {
    it('should update keyframe label', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-1',
              date: '2025',
              label: 'Old Label',
              positions: {},
              activeContextIds: []
            }
          ],
        },
      })
      const result = updateKeyframeAction(state, 'kf-1', { label: 'New Label' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes[0].label).toBe('New Label')
    })

    it('should update keyframe date and re-sort', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-1',
              date: '2025',
              label: 'First',
              positions: {},
              activeContextIds: []
            },
            {
              id: 'kf-2',
              date: '2026',
              label: 'Second',
              positions: {},
              activeContextIds: []
            }
          ],
        },
      })
      const result = updateKeyframeAction(state, 'kf-2', { date: '2024' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.temporal?.keyframes[0].id).toBe('kf-2')
      expect(updatedProject?.temporal?.keyframes[0].date).toBe('2024')
      expect(updatedProject?.temporal?.keyframes[1].id).toBe('kf-1')
    })

    it('should add to undo stack with old and new data', () => {
      const oldKeyframe = {
        id: 'kf-1',
        date: '2025',
        label: 'Old Label',
        positions: {},
        activeContextIds: []
      }
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [oldKeyframe],
        },
      })
      const updates = { label: 'New Label' }
      const result = updateKeyframeAction(state, 'kf-1', updates)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('updateKeyframe')
      expect(result.undoStack?.[0].payload.oldKeyframeData).toEqual(oldKeyframe)
      expect(result.undoStack?.[0].payload.newKeyframeData).toEqual(updates)
    })

    it('should return unchanged state if keyframe not found', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [],
        },
      })
      const result = updateKeyframeAction(state, 'nonexistent', { label: 'Test' })

      expect(result).toBe(state)
    })
  })

  describe('updateKeyframeContextPositionAction', () => {
    it('should update context position in keyframe', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-1',
              date: '2025',
              label: 'Future',
              positions: {
                'ctx-1': { x: 50, y: 100 }
              },
              activeContextIds: ['ctx-1']
            }
          ],
        },
      })
      const result = updateKeyframeContextPositionAction(state, 'kf-1', 'ctx-1', 75, 150)

      const updatedProject = result.projects?.['test-project']
      const keyframe = updatedProject?.temporal?.keyframes[0]
      expect(keyframe?.positions['ctx-1']).toEqual({ x: 75, y: 150 })
    })

    it('should add context position if not already in keyframe', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-1',
              date: '2025',
              label: 'Future',
              positions: {},
              activeContextIds: []
            }
          ],
        },
      })
      const result = updateKeyframeContextPositionAction(state, 'kf-1', 'ctx-new', 25, 50)

      const updatedProject = result.projects?.['test-project']
      const keyframe = updatedProject?.temporal?.keyframes[0]
      expect(keyframe?.positions['ctx-new']).toEqual({ x: 25, y: 50 })
    })

    it('should add to undo stack with old and new positions', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [
            {
              id: 'kf-1',
              date: '2025',
              label: 'Future',
              positions: {
                'ctx-1': { x: 50, y: 100 }
              },
              activeContextIds: ['ctx-1']
            }
          ],
        },
      })
      const result = updateKeyframeContextPositionAction(state, 'kf-1', 'ctx-1', 75, 150)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('moveContextInKeyframe')
      expect(result.undoStack?.[0].payload.oldPositions).toBeDefined()
      expect(result.undoStack?.[0].payload.newPositions).toBeDefined()
    })

    it('should return unchanged state if keyframe not found', () => {
      const state = createMockState({
        temporal: {
          enabled: true,
          keyframes: [],
        },
      })
      const result = updateKeyframeContextPositionAction(state, 'nonexistent', 'ctx-1', 25, 50)

      expect(result).toBe(state)
    })
  })
})
