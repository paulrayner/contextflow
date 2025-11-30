import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateEmptyProject,
  validateProjectName,
  createProjectAction,
  canDeleteProject,
  selectNextProjectAfterDelete,
  deleteProjectAction,
  renameProjectAction,
  generateUniqueProjectName,
  duplicateProjectAction,
} from './projectActions'
import { createMockState } from './__testFixtures__/mockState'
import type { EditorState } from '../storeTypes'

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
})

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
  trackPropertyChange: vi.fn(),
  trackTextFieldEdit: vi.fn(),
  trackFTUEMilestone: vi.fn(),
}))

describe('projectActions', () => {
  describe('generateEmptyProject', () => {
    it('should return a valid project structure', () => {
      const project = generateEmptyProject('My Project')

      expect(project.name).toBe('My Project')
      expect(project.id).toBeDefined()
      expect(project.contexts).toEqual([])
      expect(project.relationships).toEqual([])
      expect(project.repos).toEqual([])
      expect(project.people).toEqual([])
      expect(project.teams).toEqual([])
      expect(project.groups).toEqual([])
      expect(project.users).toEqual([])
      expect(project.userNeeds).toEqual([])
      expect(project.userNeedConnections).toEqual([])
      expect(project.needContextConnections).toEqual([])
      expect(project.viewConfig.flowStages).toEqual([])
    })

    it('should generate unique IDs for each call', () => {
      const project1 = generateEmptyProject('Project 1')
      const project2 = generateEmptyProject('Project 2')

      expect(project1.id).not.toBe(project2.id)
    })

    it('should set createdAt and updatedAt timestamps', () => {
      const before = new Date().toISOString()
      const project = generateEmptyProject('Test')
      const after = new Date().toISOString()

      expect(project.createdAt).toBeDefined()
      expect(project.updatedAt).toBeDefined()
      expect(project.createdAt).toBe(project.updatedAt)
      expect(project.createdAt! >= before).toBe(true)
      expect(project.createdAt! <= after).toBe(true)
    })

    it('should trim the project name', () => {
      const project = generateEmptyProject('  My Project  ')

      expect(project.name).toBe('My Project')
    })
  })

  describe('validateProjectName', () => {
    it('should reject empty string', () => {
      const result = validateProjectName('')

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject whitespace only', () => {
      const result = validateProjectName('   ')

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should accept valid names', () => {
      const result = validateProjectName('My Project')

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept names with leading/trailing whitespace (will be trimmed)', () => {
      const result = validateProjectName('  Valid Name  ')

      expect(result.valid).toBe(true)
    })

    it('should accept single character names', () => {
      const result = validateProjectName('A')

      expect(result.valid).toBe(true)
    })
  })

  describe('createProjectAction', () => {
    let mockState: EditorState

    beforeEach(() => {
      mockState = createMockState({
        id: 'existing-project',
        name: 'Existing Project',
      })
    })

    it('should add new project to state', () => {
      const result = createProjectAction(mockState, 'New Project')

      expect(Object.keys(result.projects!)).toHaveLength(2)
      const newProject = Object.values(result.projects!).find(p => p.name === 'New Project')
      expect(newProject).toBeDefined()
    })

    it('should set new project as active', () => {
      const result = createProjectAction(mockState, 'New Project')

      const newProject = Object.values(result.projects!).find(p => p.name === 'New Project')
      expect(result.activeProjectId).toBe(newProject!.id)
    })

    it('should clear all selections', () => {
      mockState.selectedContextId = 'some-context'
      mockState.selectedGroupId = 'some-group'
      mockState.selectedRelationshipId = 'some-rel'

      const result = createProjectAction(mockState, 'New Project')

      expect(result.selectedContextId).toBeNull()
      expect(result.selectedGroupId).toBeNull()
      expect(result.selectedRelationshipId).toBeNull()
      expect(result.selectedContextIds).toEqual([])
    })

    it('should clear undo/redo stacks', () => {
      mockState.undoStack = [{ type: 'addContext', payload: {} }]
      mockState.redoStack = [{ type: 'deleteContext', payload: {} }]

      const result = createProjectAction(mockState, 'New Project')

      expect(result.undoStack).toEqual([])
      expect(result.redoStack).toEqual([])
    })

    it('should throw for empty name', () => {
      expect(() => createProjectAction(mockState, '')).toThrow()
    })

    it('should throw for whitespace-only name', () => {
      expect(() => createProjectAction(mockState, '   ')).toThrow()
    })

    it('should preserve existing projects', () => {
      const result = createProjectAction(mockState, 'New Project')

      expect(result.projects!['test-project']).toBeDefined()
      expect(result.projects!['test-project'].name).toBe('Existing Project')
    })
  })

  describe('canDeleteProject', () => {
    it('should return false when only one project exists', () => {
      const state = createMockState()

      const result = canDeleteProject(state, 'test-project')

      expect(result.canDelete).toBe(false)
      expect(result.reason).toContain('at least one project')
    })

    it('should return true when multiple projects exist', () => {
      const state = createMockState()
      state.projects['another-project'] = generateEmptyProject('Another Project')

      const result = canDeleteProject(state, 'test-project')

      expect(result.canDelete).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should return false for non-existent project', () => {
      const state = createMockState()

      const result = canDeleteProject(state, 'non-existent')

      expect(result.canDelete).toBe(false)
      expect(result.reason).toContain('not found')
    })
  })

  describe('selectNextProjectAfterDelete', () => {
    it('should return null when no other projects exist', () => {
      const state = createMockState()

      const result = selectNextProjectAfterDelete(state, 'test-project')

      expect(result).toBeNull()
    })

    it('should return another project when available', () => {
      const state = createMockState()
      const anotherProject = generateEmptyProject('Another Project')
      state.projects[anotherProject.id] = anotherProject

      const result = selectNextProjectAfterDelete(state, 'test-project')

      expect(result).toBe(anotherProject.id)
    })

    it('should prefer most recently modified project', () => {
      const state = createMockState()
      const olderProject = generateEmptyProject('Older Project')
      olderProject.updatedAt = '2024-01-01T00:00:00.000Z'
      const newerProject = generateEmptyProject('Newer Project')
      newerProject.updatedAt = '2024-12-01T00:00:00.000Z'
      state.projects[olderProject.id] = olderProject
      state.projects[newerProject.id] = newerProject

      const result = selectNextProjectAfterDelete(state, 'test-project')

      expect(result).toBe(newerProject.id)
    })
  })

  describe('deleteProjectAction', () => {
    let mockState: EditorState

    beforeEach(() => {
      mockState = createMockState()
      const anotherProject = generateEmptyProject('Another Project')
      mockState.projects[anotherProject.id] = anotherProject
    })

    it('should remove the project from state', () => {
      const result = deleteProjectAction(mockState, 'test-project')

      expect(result.projects!['test-project']).toBeUndefined()
    })

    it('should switch to another project if deleting active project', () => {
      mockState.activeProjectId = 'test-project'

      const result = deleteProjectAction(mockState, 'test-project')

      expect(result.activeProjectId).not.toBe('test-project')
      expect(result.activeProjectId).toBeDefined()
    })

    it('should keep active project if deleting non-active project', () => {
      mockState.activeProjectId = 'test-project'
      const otherProject = generateEmptyProject('Other')
      mockState.projects[otherProject.id] = otherProject

      const result = deleteProjectAction(mockState, otherProject.id)

      expect(result.activeProjectId).toBe('test-project')
    })

    it('should clear selections when deleting active project', () => {
      mockState.activeProjectId = 'test-project'
      mockState.selectedContextId = 'some-context'
      mockState.selectedGroupId = 'some-group'

      const result = deleteProjectAction(mockState, 'test-project')

      expect(result.selectedContextId).toBeNull()
      expect(result.selectedGroupId).toBeNull()
    })

    it('should throw when trying to delete last project', () => {
      const singleProjectState = createMockState()

      expect(() => deleteProjectAction(singleProjectState, 'test-project')).toThrow()
    })

    it('should throw for non-existent project', () => {
      expect(() => deleteProjectAction(mockState, 'non-existent')).toThrow()
    })

    it('should clear undo/redo stacks when deleting active project', () => {
      mockState.activeProjectId = 'test-project'
      mockState.undoStack = [{ type: 'addContext', payload: {} }]
      mockState.redoStack = [{ type: 'deleteContext', payload: {} }]

      const result = deleteProjectAction(mockState, 'test-project')

      expect(result.undoStack).toEqual([])
      expect(result.redoStack).toEqual([])
    })
  })

  describe('renameProjectAction', () => {
    let mockState: EditorState

    beforeEach(() => {
      mockState = createMockState({
        name: 'Original Name',
      })
    })

    it('should update the project name', () => {
      const result = renameProjectAction(mockState, 'test-project', 'New Name')

      expect(result.projects!['test-project'].name).toBe('New Name')
    })

    it('should update the updatedAt timestamp', () => {
      const originalUpdatedAt = mockState.projects['test-project'].updatedAt
      const result = renameProjectAction(mockState, 'test-project', 'New Name')

      expect(result.projects!['test-project'].updatedAt).not.toBe(originalUpdatedAt)
    })

    it('should trim the new name', () => {
      const result = renameProjectAction(mockState, 'test-project', '  New Name  ')

      expect(result.projects!['test-project'].name).toBe('New Name')
    })

    it('should throw for empty name', () => {
      expect(() => renameProjectAction(mockState, 'test-project', '')).toThrow()
    })

    it('should throw for whitespace-only name', () => {
      expect(() => renameProjectAction(mockState, 'test-project', '   ')).toThrow()
    })

    it('should throw for non-existent project', () => {
      expect(() => renameProjectAction(mockState, 'non-existent', 'New Name')).toThrow()
    })

    it('should preserve other project fields', () => {
      const originalProject = mockState.projects['test-project']
      const result = renameProjectAction(mockState, 'test-project', 'New Name')
      const updatedProject = result.projects!['test-project']

      expect(updatedProject.id).toBe(originalProject.id)
      expect(updatedProject.contexts).toBe(originalProject.contexts)
      expect(updatedProject.relationships).toBe(originalProject.relationships)
      expect(updatedProject.createdAt).toBe(originalProject.createdAt)
    })
  })

  describe('generateUniqueProjectName', () => {
    it('should return original name if no duplicates exist', () => {
      const existingNames = ['Project A', 'Project B']

      const result = generateUniqueProjectName('New Project', existingNames)

      expect(result).toBe('New Project')
    })

    it('should add (Copy) suffix if name exists', () => {
      const existingNames = ['My Project', 'Other Project']

      const result = generateUniqueProjectName('My Project', existingNames)

      expect(result).toBe('My Project (Copy)')
    })

    it('should increment number if (Copy) already exists', () => {
      const existingNames = ['My Project', 'My Project (Copy)']

      const result = generateUniqueProjectName('My Project', existingNames)

      expect(result).toBe('My Project (Copy 2)')
    })

    it('should find next available number', () => {
      const existingNames = ['My Project', 'My Project (Copy)', 'My Project (Copy 2)', 'My Project (Copy 3)']

      const result = generateUniqueProjectName('My Project', existingNames)

      expect(result).toBe('My Project (Copy 4)')
    })

    it('should handle name that already ends with (Copy)', () => {
      const existingNames = ['Test (Copy)', 'Test (Copy) (Copy)']

      const result = generateUniqueProjectName('Test (Copy)', existingNames)

      expect(result).toBe('Test (Copy) (Copy 2)')
    })
  })

  describe('duplicateProjectAction', () => {
    let mockState: EditorState

    beforeEach(() => {
      mockState = createMockState({
        name: 'Original Project',
      })
      // Add some content to the project
      mockState.projects['test-project'].contexts = [
        {
          id: 'ctx-1',
          name: 'Context 1',
          strategicClassification: 'core',
          positions: { flow: { x: 100 }, strategic: { x: 200 }, shared: { y: 50 } },
        } as any,
      ]
      mockState.projects['test-project'].relationships = [
        { id: 'rel-1', fromContextId: 'ctx-1', toContextId: 'ctx-2', pattern: 'customer-supplier' } as any,
      ]
    })

    it('should create a new project with duplicated content', () => {
      const result = duplicateProjectAction(mockState, 'test-project')

      expect(Object.keys(result.projects!)).toHaveLength(2)
      const duplicatedProject = Object.values(result.projects!).find(p => p.name === 'Original Project (Copy)')
      expect(duplicatedProject).toBeDefined()
    })

    it('should generate new IDs for the duplicated project', () => {
      const result = duplicateProjectAction(mockState, 'test-project')

      const duplicatedProject = Object.values(result.projects!).find(p => p.name === 'Original Project (Copy)')
      expect(duplicatedProject!.id).not.toBe('test-project')
    })

    it('should deep copy contexts with new IDs', () => {
      const result = duplicateProjectAction(mockState, 'test-project')

      const duplicatedProject = Object.values(result.projects!).find(p => p.name === 'Original Project (Copy)')
      expect(duplicatedProject!.contexts).toHaveLength(1)
      expect(duplicatedProject!.contexts[0].id).not.toBe('ctx-1')
      expect(duplicatedProject!.contexts[0].name).toBe('Context 1')
    })

    it('should update relationship references to new context IDs', () => {
      // Add a second context that the relationship points to
      mockState.projects['test-project'].contexts.push({
        id: 'ctx-2',
        name: 'Context 2',
        strategicClassification: 'supporting',
        positions: { flow: { x: 300 }, strategic: { x: 400 }, shared: { y: 100 } },
      } as any)

      const result = duplicateProjectAction(mockState, 'test-project')

      const duplicatedProject = Object.values(result.projects!).find(p => p.name === 'Original Project (Copy)')
      const dupRelationship = duplicatedProject!.relationships[0]

      // Relationship should have new ID and reference the new context IDs
      expect(dupRelationship.id).not.toBe('rel-1')
      expect(dupRelationship.fromContextId).not.toBe('ctx-1')
      expect(dupRelationship.toContextId).not.toBe('ctx-2')
    })

    it('should set the duplicated project as active', () => {
      const result = duplicateProjectAction(mockState, 'test-project')

      const duplicatedProject = Object.values(result.projects!).find(p => p.name === 'Original Project (Copy)')
      expect(result.activeProjectId).toBe(duplicatedProject!.id)
    })

    it('should clear all selections', () => {
      mockState.selectedContextId = 'some-context'
      mockState.selectedGroupId = 'some-group'

      const result = duplicateProjectAction(mockState, 'test-project')

      expect(result.selectedContextId).toBeNull()
      expect(result.selectedGroupId).toBeNull()
      expect(result.selectedContextIds).toEqual([])
    })

    it('should clear undo/redo stacks', () => {
      mockState.undoStack = [{ type: 'addContext', payload: {} }]
      mockState.redoStack = [{ type: 'deleteContext', payload: {} }]

      const result = duplicateProjectAction(mockState, 'test-project')

      expect(result.undoStack).toEqual([])
      expect(result.redoStack).toEqual([])
    })

    it('should throw for non-existent project', () => {
      expect(() => duplicateProjectAction(mockState, 'non-existent')).toThrow('Project not found')
    })

    it('should set new timestamps', () => {
      const originalProject = mockState.projects['test-project']
      originalProject.createdAt = '2024-01-01T00:00:00.000Z'
      originalProject.updatedAt = '2024-01-01T00:00:00.000Z'

      const result = duplicateProjectAction(mockState, 'test-project')

      const duplicatedProject = Object.values(result.projects!).find(p => p.name === 'Original Project (Copy)')
      expect(duplicatedProject!.createdAt).not.toBe('2024-01-01T00:00:00.000Z')
      expect(duplicatedProject!.updatedAt).not.toBe('2024-01-01T00:00:00.000Z')
    })

    it('should handle unique name generation when copy already exists', () => {
      // Add a project that would conflict with the default copy name
      const existingCopy = generateEmptyProject('Original Project (Copy)')
      mockState.projects[existingCopy.id] = existingCopy

      const result = duplicateProjectAction(mockState, 'test-project')

      const duplicatedProject = Object.values(result.projects!).find(
        p => p.name !== 'Original Project' && p.name !== 'Original Project (Copy)'
      )
      expect(duplicatedProject!.name).toBe('Original Project (Copy 2)')
    })
  })
})
