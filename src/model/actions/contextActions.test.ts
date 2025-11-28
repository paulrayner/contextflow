import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  updateContextAction,
  updateContextPositionAction,
  updateMultipleContextPositionsAction,
  addContextAction,
  deleteContextAction,
  addContextIssueAction,
  updateContextIssueAction,
  deleteContextIssueAction,
  assignTeamToContextAction,
  unassignTeamFromContextAction
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

  describe('addContextIssueAction', () => {
    it('should add an issue to a context', () => {
      const result = addContextIssueAction(mockState, 'context-1', 'Needs OHS', 'warning')

      const context = result.projects?.['project-1'].contexts[0]
      expect(context?.issues).toHaveLength(1)
      expect(context?.issues?.[0].title).toBe('Needs OHS')
      expect(context?.issues?.[0].severity).toBe('warning')
    })

    it('should generate a unique id for the issue', () => {
      const result = addContextIssueAction(mockState, 'context-1', 'Test Issue', 'info')

      const issue = result.projects?.['project-1'].contexts[0]?.issues?.[0]
      expect(issue?.id).toBeDefined()
      expect(issue?.id).toMatch(/^issue-/)
    })

    it('should default severity to warning if not provided', () => {
      const result = addContextIssueAction(mockState, 'context-1', 'Test Issue')

      expect(result.projects?.['project-1'].contexts[0]?.issues?.[0].severity).toBe('warning')
    })

    it('should append to existing issues', () => {
      mockState.projects['project-1'].contexts[0].issues = [
        { id: 'issue-existing', title: 'Existing', severity: 'info' }
      ]

      const result = addContextIssueAction(mockState, 'context-1', 'New Issue', 'critical')

      expect(result.projects?.['project-1'].contexts[0]?.issues).toHaveLength(2)
      expect(result.projects?.['project-1'].contexts[0]?.issues?.[1].title).toBe('New Issue')
    })

    it('should return unchanged state if context not found', () => {
      const result = addContextIssueAction(mockState, 'nonexistent', 'Test', 'info')

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if project not found', () => {
      const state = { ...mockState, activeProjectId: 'nonexistent' }
      const result = addContextIssueAction(state, 'context-1', 'Test', 'info')

      expect(result).toBe(state)
    })
  })

  describe('updateContextIssueAction', () => {
    beforeEach(() => {
      mockState.projects['project-1'].contexts[0].issues = [
        { id: 'issue-1', title: 'Original Title', description: 'Original desc', severity: 'warning' }
      ]
    })

    it('should update issue title', () => {
      const result = updateContextIssueAction(mockState, 'context-1', 'issue-1', { title: 'Updated Title' })

      expect(result.projects?.['project-1'].contexts[0]?.issues?.[0].title).toBe('Updated Title')
    })

    it('should update issue description', () => {
      const result = updateContextIssueAction(mockState, 'context-1', 'issue-1', { description: 'New description' })

      expect(result.projects?.['project-1'].contexts[0]?.issues?.[0].description).toBe('New description')
    })

    it('should update issue severity', () => {
      const result = updateContextIssueAction(mockState, 'context-1', 'issue-1', { severity: 'critical' })

      expect(result.projects?.['project-1'].contexts[0]?.issues?.[0].severity).toBe('critical')
    })

    it('should preserve other issue fields when updating', () => {
      const result = updateContextIssueAction(mockState, 'context-1', 'issue-1', { title: 'Updated' })

      const issue = result.projects?.['project-1'].contexts[0]?.issues?.[0]
      expect(issue?.description).toBe('Original desc')
      expect(issue?.severity).toBe('warning')
    })

    it('should return unchanged state if issue not found', () => {
      const result = updateContextIssueAction(mockState, 'context-1', 'nonexistent', { title: 'Test' })

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if context not found', () => {
      const result = updateContextIssueAction(mockState, 'nonexistent', 'issue-1', { title: 'Test' })

      expect(result).toBe(mockState)
    })
  })

  describe('deleteContextIssueAction', () => {
    beforeEach(() => {
      mockState.projects['project-1'].contexts[0].issues = [
        { id: 'issue-1', title: 'Issue 1', severity: 'warning' },
        { id: 'issue-2', title: 'Issue 2', severity: 'info' }
      ]
    })

    it('should delete an issue from a context', () => {
      const result = deleteContextIssueAction(mockState, 'context-1', 'issue-1')

      expect(result.projects?.['project-1'].contexts[0]?.issues).toHaveLength(1)
      expect(result.projects?.['project-1'].contexts[0]?.issues?.[0].id).toBe('issue-2')
    })

    it('should return unchanged state if issue not found', () => {
      const result = deleteContextIssueAction(mockState, 'context-1', 'nonexistent')

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if context not found', () => {
      const result = deleteContextIssueAction(mockState, 'nonexistent', 'issue-1')

      expect(result).toBe(mockState)
    })

    it('should handle deleting last issue', () => {
      mockState.projects['project-1'].contexts[0].issues = [
        { id: 'issue-1', title: 'Only Issue', severity: 'warning' }
      ]

      const result = deleteContextIssueAction(mockState, 'context-1', 'issue-1')

      expect(result.projects?.['project-1'].contexts[0]?.issues).toHaveLength(0)
    })
  })

  describe('assignTeamToContextAction', () => {
    beforeEach(() => {
      mockState.projects['project-1'].teams = [
        { id: 'team-1', name: 'Platform Team', topologyType: 'platform' },
        { id: 'team-2', name: 'Customer Experience Squad', topologyType: 'stream-aligned' }
      ]
    })

    it('should assign a team to a context', () => {
      const result = assignTeamToContextAction(mockState, 'context-1', 'team-1')

      expect(result.projects?.['project-1'].contexts[0].teamId).toBe('team-1')
    })

    it('should replace existing team assignment', () => {
      mockState.projects['project-1'].contexts[0].teamId = 'team-1'

      const result = assignTeamToContextAction(mockState, 'context-1', 'team-2')

      expect(result.projects?.['project-1'].contexts[0].teamId).toBe('team-2')
    })

    it('should return unchanged state if context not found', () => {
      const result = assignTeamToContextAction(mockState, 'nonexistent', 'team-1')

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if project not found', () => {
      const state = { ...mockState, activeProjectId: 'nonexistent' }
      const result = assignTeamToContextAction(state, 'context-1', 'team-1')

      expect(result).toBe(state)
    })

    it('should return unchanged state if team not found in project', () => {
      const result = assignTeamToContextAction(mockState, 'context-1', 'nonexistent-team')

      expect(result).toBe(mockState)
    })

    it('should not allow team assignment to external contexts', () => {
      mockState.projects['project-1'].contexts[0].ownership = 'external'

      const result = assignTeamToContextAction(mockState, 'context-1', 'team-1')

      expect(result).toBe(mockState)
    })
  })

  describe('unassignTeamFromContextAction', () => {
    beforeEach(() => {
      mockState.projects['project-1'].contexts[0].teamId = 'team-1'
    })

    it('should remove team assignment from a context', () => {
      const result = unassignTeamFromContextAction(mockState, 'context-1')

      expect(result.projects?.['project-1'].contexts[0].teamId).toBeUndefined()
    })

    it('should return unchanged state if context not found', () => {
      const result = unassignTeamFromContextAction(mockState, 'nonexistent')

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if project not found', () => {
      const state = { ...mockState, activeProjectId: 'nonexistent' }
      const result = unassignTeamFromContextAction(state, 'context-1')

      expect(result).toBe(state)
    })

    it('should work even if no team was assigned', () => {
      delete mockState.projects['project-1'].contexts[0].teamId

      const result = unassignTeamFromContextAction(mockState, 'context-1')

      expect(result.projects?.['project-1'].contexts[0].teamId).toBeUndefined()
    })
  })
})
