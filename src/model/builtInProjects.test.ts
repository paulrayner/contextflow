import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initialProjects, initialActiveProjectId, determineProjectOrigin, isBuiltInNewer } from './builtInProjects'
import type { Project } from './types'

function createTestProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [],
    relationships: [],
    repos: [],
    people: [],
    teams: [],
    groups: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: { flowStages: [] },
    ...overrides,
  }
}

describe('builtInProjects', () => {
  describe('initialProjects', () => {
    it('should export an object with project IDs as keys', () => {
      expect(initialProjects).toBeTypeOf('object')
      expect(Object.keys(initialProjects).length).toBeGreaterThan(0)
    })

    it('should include sample project', () => {
      const projects = Object.values(initialProjects)
      const sampleProject = projects.find(p => p.name.includes('ACME') || p.id === 'sample-project')
      expect(sampleProject).toBeDefined()
    })

    it('should include cbioportal project', () => {
      const projects = Object.values(initialProjects)
      const cbioportal = projects.find(p => p.name.toLowerCase().includes('cbioportal'))
      expect(cbioportal).toBeDefined()
    })

    it('should include empty project', () => {
      const projects = Object.values(initialProjects)
      const empty = projects.find(p => p.name.toLowerCase().includes('empty'))
      expect(empty).toBeDefined()
    })

    it('should include elan warranty project', () => {
      const projects = Object.values(initialProjects)
      const elan = projects.find(p => p.name.toLowerCase().includes('elan'))
      expect(elan).toBeDefined()
    })

    it('should have project IDs as keys matching project.id', () => {
      Object.entries(initialProjects).forEach(([key, project]) => {
        expect(key).toBe(project.id)
      })
    })

    it('should have isBuiltIn flag set to true for all projects', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.isBuiltIn).toBe(true)
      })
    })

    it('should generate unique UUIDs for project IDs', () => {
      const ids = Object.keys(initialProjects)
      ids.forEach(id => {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      })
    })
  })

  describe('backwards compatibility - required arrays', () => {
    it('should ensure all projects have users array', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.users).toBeDefined()
        expect(Array.isArray(project.users)).toBe(true)
      })
    })

    it('should ensure all projects have userNeeds array', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.userNeeds).toBeDefined()
        expect(Array.isArray(project.userNeeds)).toBe(true)
      })
    })

    it('should ensure all projects have userNeedConnections array', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.userNeedConnections).toBeDefined()
        expect(Array.isArray(project.userNeedConnections)).toBe(true)
      })
    })

    it('should ensure all projects have needContextConnections array', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.needContextConnections).toBeDefined()
        expect(Array.isArray(project.needContextConnections)).toBe(true)
      })
    })
  })

  describe('migration - distillation and evolution', () => {
    it('should ensure all contexts have distillation positions', () => {
      Object.values(initialProjects).forEach(project => {
        project.contexts.forEach(context => {
          expect(context.positions.distillation).toBeDefined()
          expect(context.positions.distillation.x).toBeTypeOf('number')
          expect(context.positions.distillation.y).toBeTypeOf('number')
        })
      })
    })

    it('should ensure all contexts have evolutionStage', () => {
      Object.values(initialProjects).forEach(project => {
        project.contexts.forEach(context => {
          expect(context.evolutionStage).toBeDefined()
          expect(['genesis', 'custom-built', 'product/rental', 'commodity/utility']).toContain(context.evolutionStage)
        })
      })
    })

    it('should ensure all contexts have strategicClassification', () => {
      Object.values(initialProjects).forEach(project => {
        project.contexts.forEach(context => {
          expect(context.strategicClassification).toBeDefined()
          expect(['core', 'supporting', 'generic']).toContain(context.strategicClassification)
        })
      })
    })

    it('should classify evolutionStage based on strategic position x when missing', () => {
      Object.values(initialProjects).forEach(project => {
        project.contexts.forEach(context => {
          expect(['genesis', 'custom-built', 'product/rental', 'commodity/utility']).toContain(context.evolutionStage)
        })
      })
    })

    it('should use default distillation position (50, 50) when missing', () => {
      Object.values(initialProjects).forEach(project => {
        project.contexts.forEach(context => {
          expect(context.positions.distillation.x).toBeGreaterThanOrEqual(0)
          expect(context.positions.distillation.x).toBeLessThanOrEqual(100)
          expect(context.positions.distillation.y).toBeGreaterThanOrEqual(0)
          expect(context.positions.distillation.y).toBeLessThanOrEqual(100)
        })
      })
    })
  })

  describe('initialActiveProjectId', () => {
    it('should export a string project ID', () => {
      expect(initialActiveProjectId).toBeTypeOf('string')
      expect(initialActiveProjectId.length).toBeGreaterThan(0)
    })

    it('should reference a project that exists in initialProjects', () => {
      expect(initialProjects[initialActiveProjectId]).toBeDefined()
    })

    it('should use localStorage value if available', () => {
      const storedProjectId = localStorage.getItem('contextflow.activeProjectId')

      if (storedProjectId) {
        expect(initialActiveProjectId).toBe(storedProjectId)
      } else {
        expect(initialProjects[initialActiveProjectId]).toBeDefined()
      }
    })
  })

  describe('data integrity', () => {
    it('should have valid project structure', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.id).toBeDefined()
        expect(project.name).toBeDefined()
        expect(project.contexts).toBeDefined()
        expect(Array.isArray(project.contexts)).toBe(true)
        expect(project.relationships).toBeDefined()
        expect(Array.isArray(project.relationships)).toBe(true)
      })
    })

    it('should have contexts with valid position structures', () => {
      Object.values(initialProjects).forEach(project => {
        project.contexts.forEach(context => {
          expect(context.positions).toBeDefined()
          expect(context.positions.flow).toBeDefined()
          expect(context.positions.strategic).toBeDefined()
          expect(context.positions.shared).toBeDefined()
          expect(context.positions.distillation).toBeDefined()

          expect(context.positions.flow.x).toBeTypeOf('number')
          expect(context.positions.strategic.x).toBeTypeOf('number')
          expect(context.positions.shared.y).toBeTypeOf('number')
          expect(context.positions.distillation.x).toBeTypeOf('number')
          expect(context.positions.distillation.y).toBeTypeOf('number')
        })
      })
    })
  })

  describe('determineProjectOrigin', () => {
    it('returns "sample" for built-in project that is not Empty Project', () => {
      const project = createTestProject({ name: 'ACME E-Commerce', isBuiltIn: true })
      expect(determineProjectOrigin(project, false)).toBe('sample')
    })

    it('returns "sample" for cbioportal built-in project', () => {
      const project = createTestProject({ name: 'cBioPortal', isBuiltIn: true })
      expect(determineProjectOrigin(project, false)).toBe('sample')
    })

    it('returns "empty" for Empty Project', () => {
      const project = createTestProject({ name: 'Empty Project', isBuiltIn: true })
      expect(determineProjectOrigin(project, false)).toBe('empty')
    })

    it('returns "imported" for first load of custom project', () => {
      const project = createTestProject({ name: 'My Project', isBuiltIn: false })
      expect(determineProjectOrigin(project, true)).toBe('imported')
    })

    it('returns "continued" for subsequent load of custom project', () => {
      const project = createTestProject({ name: 'My Project', isBuiltIn: false })
      expect(determineProjectOrigin(project, false)).toBe('continued')
    })
  })

  describe('project versioning', () => {
    it('should return true when built-in version is newer than saved', () => {
      const builtInProject = { id: 'test-project', version: 2, name: 'Test' }
      const savedProject = { id: 'test-project', version: 1, name: 'Test' }

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(true)
    })

    it('should return false when versions are equal', () => {
      const builtInProject = { id: 'test-project', version: 2, name: 'Test' }
      const savedProject = { id: 'test-project', version: 2, name: 'Test' }

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(false)
    })

    it('should return false when built-in version is older than saved', () => {
      const builtInProject = { id: 'test-project', version: 1, name: 'Test' }
      const savedProject = { id: 'test-project', version: 2, name: 'Test' }

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(false)
    })

    it('should treat missing version as version 1', () => {
      const builtInProject = { id: 'test-project', version: 2, name: 'Test' }
      const savedProject: { version?: number } = {}

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(true)
    })

    it('should return false when both have no version (both default to 1)', () => {
      const builtInProject = { id: 'test-project', version: 1, name: 'Test' }
      const savedProject: { version?: number } = {}

      expect(isBuiltInNewer(builtInProject, savedProject)).toBe(false)
    })
  })
})
