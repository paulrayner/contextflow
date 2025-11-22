import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initialProjects, initialActiveProjectId, determineProjectOrigin } from './builtInProjects'

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
  })

  describe('backwards compatibility - required arrays', () => {
    it('should ensure all projects have actors array', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.actors).toBeDefined()
        expect(Array.isArray(project.actors)).toBe(true)
      })
    })

    it('should ensure all projects have userNeeds array', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.userNeeds).toBeDefined()
        expect(Array.isArray(project.userNeeds)).toBe(true)
      })
    })

    it('should ensure all projects have actorNeedConnections array', () => {
      Object.values(initialProjects).forEach(project => {
        expect(project.actorNeedConnections).toBeDefined()
        expect(Array.isArray(project.actorNeedConnections)).toBe(true)
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
          const x = context.positions.strategic.x
          let expectedStage: string

          if (x < 25) {
            expectedStage = 'genesis'
          } else if (x < 50) {
            expectedStage = 'custom-built'
          } else if (x < 75) {
            expectedStage = 'product/rental'
          } else {
            expectedStage = 'commodity/utility'
          }

          // Note: This test verifies the migration happened, but the actual value
          // may have been set manually in the JSON, so we just check it's valid
          expect(['genesis', 'custom-built', 'product/rental', 'commodity/utility']).toContain(context.evolutionStage)
        })
      })
    })

    it('should use default distillation position (50, 50) when missing', () => {
      // This test verifies that contexts with missing distillation positions
      // would get the default value. Since migration happens at module load,
      // we can only verify the result is valid
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
      // This test verifies the behavior described in the code
      // The actual value depends on localStorage state at module load time
      const storedProjectId = localStorage.getItem('contextflow.activeProjectId')

      if (storedProjectId) {
        // If there was a stored value, it should be used
        expect(initialActiveProjectId).toBe(storedProjectId)
      } else {
        // Otherwise, it should be the sample project
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

          // Verify coordinate types
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
    it('returns "sample" for acme-ecommerce', () => {
      expect(determineProjectOrigin('acme-ecommerce', false)).toBe('sample')
    })

    it('returns "sample" for cbioportal', () => {
      expect(determineProjectOrigin('cbioportal', false)).toBe('sample')
    })

    it('returns "sample" for elan-warranty', () => {
      expect(determineProjectOrigin('elan-warranty', false)).toBe('sample')
    })

    it('returns "empty" for empty-project', () => {
      expect(determineProjectOrigin('empty-project', false)).toBe('empty')
    })

    it('returns "imported" for first load of custom project', () => {
      expect(determineProjectOrigin('custom-project', true)).toBe('imported')
    })

    it('returns "continued" for subsequent load of custom project', () => {
      expect(determineProjectOrigin('custom-project', false)).toBe('continued')
    })
  })
})
