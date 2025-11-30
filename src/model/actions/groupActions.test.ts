import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
  removeContextFromGroupAction,
  addContextToGroupAction,
  addContextsToGroupAction
} from './groupActions'
import { createMockState, createMockContext, createMockGroup } from './__testFixtures__/mockState'
import type { Group } from '../types'
import type { EditorState } from '../storeTypes'

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPropertyChange: vi.fn(),
  trackTextFieldEdit: vi.fn(),
  trackFTUEMilestone: vi.fn(),
}))

describe('groupActions', () => {
  let mockState: EditorState

  beforeEach(() => {
    const mockContext = createMockContext({
      id: 'context-1',
      name: 'Test Context',
      evolutionStage: 'custom-built',
    })

    const mockGroup = createMockGroup({
      id: 'group-1',
      label: 'Test Group',
      color: '#3b82f6',
      contextIds: ['context-1'],
    })

    mockState = createMockState({
      id: 'project-1',
      contexts: [mockContext],
      groups: [mockGroup],
    })
    mockState.activeProjectId = 'project-1'
    mockState.projects = {
      'project-1': {
        ...mockState.projects['test-project'],
        id: 'project-1'
      }
    }
  })

  describe('createGroupAction', () => {
    it('should create a new group', () => {
      const result = createGroupAction(mockState, 'New Group', undefined, undefined)

      expect(result.projects?.['project-1'].groups).toHaveLength(2)
      expect(result.projects?.['project-1'].groups[1].label).toBe('New Group')
    })

    it('should use provided color', () => {
      const result = createGroupAction(mockState, 'New Group', '#ff0000', undefined)

      expect(result.projects?.['project-1'].groups[1].color).toBe('#ff0000')
    })

    it('should use default color if not provided', () => {
      const result = createGroupAction(mockState, 'New Group', undefined, undefined)

      expect(result.projects?.['project-1'].groups[1].color).toBe('#3b82f6')
    })

    it('should include selected contexts', () => {
      mockState.selectedContextIds = ['context-1', 'context-2']
      const result = createGroupAction(mockState, 'New Group', undefined, undefined)

      expect(result.projects?.['project-1'].groups[1].contextIds).toEqual(['context-1', 'context-2'])
    })

    it('should select the new group', () => {
      const result = createGroupAction(mockState, 'New Group', undefined, undefined)

      expect(result.selectedGroupId).toBeDefined()
    })

    it('should clear selected contexts after creating group', () => {
      mockState.selectedContextIds = ['context-1']
      const result = createGroupAction(mockState, 'New Group', undefined, undefined)

      expect(result.selectedContextIds).toEqual([])
    })

    it('should add command to undo stack', () => {
      const result = createGroupAction(mockState, 'New Group', undefined, undefined)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('addGroup')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addGroup', payload: { group: createMockGroup() } }]
      const result = createGroupAction(mockState, 'New Group', undefined, undefined)

      expect(result.redoStack).toHaveLength(0)
    })

    it('should include notes if provided', () => {
      const result = createGroupAction(mockState, 'New Group', undefined, 'Test notes')

      expect(result.projects?.['project-1'].groups[1].notes).toBe('Test notes')
    })
  })

  describe('updateGroupAction', () => {
    it('should update group label', () => {
      const result = updateGroupAction(mockState, 'group-1', { label: 'Updated Label' })

      expect(result.projects?.['project-1'].groups[0].label).toBe('Updated Label')
    })

    it('should update group color', () => {
      const result = updateGroupAction(mockState, 'group-1', { color: '#00ff00' })

      expect(result.projects?.['project-1'].groups[0].color).toBe('#00ff00')
    })

    it('should update group notes', () => {
      const result = updateGroupAction(mockState, 'group-1', { notes: 'Updated notes' })

      expect(result.projects?.['project-1'].groups[0].notes).toBe('Updated notes')
    })

    it('should return unchanged state if group not found', () => {
      const result = updateGroupAction(mockState, 'nonexistent', { label: 'Updated' })

      expect(result).toBe(mockState)
    })

    it('should preserve other groups', () => {
      const group2: Group = {
        id: 'group-2',
        label: 'Group 2',
        color: '#ff0000',
        contextIds: [],
      }
      mockState.projects['project-1'].groups.push(group2)

      const result = updateGroupAction(mockState, 'group-1', { label: 'Updated' })

      expect(result.projects?.['project-1'].groups).toHaveLength(2)
      expect(result.projects?.['project-1'].groups[1]).toEqual(group2)
    })
  })

  describe('deleteGroupAction', () => {
    it('should delete a group', () => {
      const result = deleteGroupAction(mockState, 'group-1')

      expect(result.projects?.['project-1'].groups).toHaveLength(0)
    })

    it('should return unchanged state if group not found', () => {
      const result = deleteGroupAction(mockState, 'nonexistent')

      expect(result).toBe(mockState)
    })

    it('should clear selection if deleted group was selected', () => {
      mockState.selectedGroupId = 'group-1'

      const result = deleteGroupAction(mockState, 'group-1')

      expect(result.selectedGroupId).toBeNull()
    })

    it('should preserve selection if different group was selected', () => {
      mockState.selectedGroupId = 'group-2'

      const result = deleteGroupAction(mockState, 'group-1')

      expect(result.selectedGroupId).toBe('group-2')
    })

    it('should add command to undo stack', () => {
      const result = deleteGroupAction(mockState, 'group-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteGroup')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addGroup', payload: { group: createMockGroup() } }]

      const result = deleteGroupAction(mockState, 'group-1')

      expect(result.redoStack).toHaveLength(0)
    })
  })

  describe('removeContextFromGroupAction', () => {
    it('should remove context from group', () => {
      const result = removeContextFromGroupAction(mockState, 'group-1', 'context-1')

      expect(result.projects?.['project-1'].groups[0].contextIds).toHaveLength(0)
    })

    it('should return unchanged state if group not found', () => {
      const result = removeContextFromGroupAction(mockState, 'nonexistent', 'context-1')

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if context not in group', () => {
      const result = removeContextFromGroupAction(mockState, 'group-1', 'context-2')

      expect(result).toBe(mockState)
    })

    it('should preserve other contexts in group', () => {
      mockState.projects['project-1'].groups[0].contextIds = ['context-1', 'context-2']

      const result = removeContextFromGroupAction(mockState, 'group-1', 'context-1')

      expect(result.projects?.['project-1'].groups[0].contextIds).toEqual(['context-2'])
    })

    it('should add command to undo stack', () => {
      const result = removeContextFromGroupAction(mockState, 'group-1', 'context-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('removeFromGroup')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addGroup', payload: { group: createMockGroup() } }]

      const result = removeContextFromGroupAction(mockState, 'group-1', 'context-1')

      expect(result.redoStack).toHaveLength(0)
    })
  })

  describe('addContextToGroupAction', () => {
    beforeEach(() => {
      // Start with empty group
      mockState.projects['project-1'].groups[0].contextIds = []
    })

    it('should add context to group', () => {
      const result = addContextToGroupAction(mockState, 'group-1', 'context-1')

      expect(result.projects?.['project-1'].groups[0].contextIds).toContain('context-1')
    })

    it('should return unchanged state if group not found', () => {
      const result = addContextToGroupAction(mockState, 'nonexistent', 'context-1')

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if context already in group', () => {
      mockState.projects['project-1'].groups[0].contextIds = ['context-1']

      const result = addContextToGroupAction(mockState, 'group-1', 'context-1')

      expect(result).toBe(mockState)
    })

    it('should preserve existing contexts in group', () => {
      mockState.projects['project-1'].groups[0].contextIds = ['context-2']

      const result = addContextToGroupAction(mockState, 'group-1', 'context-1')

      expect(result.projects?.['project-1'].groups[0].contextIds).toEqual(['context-2', 'context-1'])
    })

    it('should add command to undo stack', () => {
      const result = addContextToGroupAction(mockState, 'group-1', 'context-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('addToGroup')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addGroup', payload: { group: createMockGroup() } }]

      const result = addContextToGroupAction(mockState, 'group-1', 'context-1')

      expect(result.redoStack).toHaveLength(0)
    })
  })

  describe('addContextsToGroupAction', () => {
    beforeEach(() => {
      // Start with empty group
      mockState.projects['project-1'].groups[0].contextIds = []
    })

    it('should add multiple contexts to group', () => {
      const result = addContextsToGroupAction(mockState, 'group-1', ['context-1', 'context-2'])

      expect(result.projects?.['project-1'].groups[0].contextIds).toEqual(['context-1', 'context-2'])
    })

    it('should return unchanged state if group not found', () => {
      const result = addContextsToGroupAction(mockState, 'nonexistent', ['context-1'])

      expect(result).toBe(mockState)
    })

    it('should filter out contexts already in group', () => {
      mockState.projects['project-1'].groups[0].contextIds = ['context-1']

      const result = addContextsToGroupAction(mockState, 'group-1', ['context-1', 'context-2'])

      expect(result.projects?.['project-1'].groups[0].contextIds).toEqual(['context-1', 'context-2'])
    })

    it('should return unchanged state if all contexts already in group', () => {
      mockState.projects['project-1'].groups[0].contextIds = ['context-1', 'context-2']

      const result = addContextsToGroupAction(mockState, 'group-1', ['context-1', 'context-2'])

      expect(result).toBe(mockState)
    })

    it('should preserve existing contexts in group', () => {
      mockState.projects['project-1'].groups[0].contextIds = ['context-3']

      const result = addContextsToGroupAction(mockState, 'group-1', ['context-1', 'context-2'])

      expect(result.projects?.['project-1'].groups[0].contextIds).toEqual(['context-3', 'context-1', 'context-2'])
    })

    it('should add command to undo stack', () => {
      const result = addContextsToGroupAction(mockState, 'group-1', ['context-1', 'context-2'])

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('addToGroup')
    })

    it('should clear redo stack', () => {
      mockState.redoStack = [{ type: 'addGroup', payload: { group: createMockGroup() } }]

      const result = addContextsToGroupAction(mockState, 'group-1', ['context-1'])

      expect(result.redoStack).toHaveLength(0)
    })
  })
})
