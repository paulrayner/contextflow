import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateEmptyProject,
  validateProjectName,
  createProjectAction,
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
})
