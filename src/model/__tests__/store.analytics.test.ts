import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useEditorStore } from '../store'
import * as analytics from '../../utils/analytics'

function findProjectByName(projects: Record<string, { name: string }>, name: string): string | undefined {
  return Object.keys(projects).find(id => projects[id].name === name)
}

describe('store analytics integration', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trackEventSpy: any

  beforeEach(() => {
    // Reset store to initial state
    useEditorStore.setState(useEditorStore.getInitialState())

    // Mock trackEvent
    trackEventSpy = vi.spyOn(analytics, 'trackEvent')
    trackEventSpy.mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('setViewMode', () => {
    it('tracks view_switched event with from and to views', () => {
      const state = useEditorStore.getState()

      // Initial view is 'flow'
      expect(state.activeViewMode).toBe('flow')

      // Switch to strategic view
      state.setViewMode('strategic')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_switched',
        expect.any(Object), // project
        {
          from_view: 'flow',
          to_view: 'strategic'
        }
      )
    })

    it('tracks view_switched event when switching to distillation', () => {
      const state = useEditorStore.getState()

      // Switch to distillation view
      state.setViewMode('distillation')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_switched',
        expect.any(Object),
        {
          from_view: 'flow',
          to_view: 'distillation'
        }
      )
    })

    it('includes project metadata in view_switched event', () => {
      const state = useEditorStore.getState()
      const projectId = state.activeProjectId
      const project = projectId ? state.projects[projectId] : null

      state.setViewMode('strategic')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'view_switched',
        project,
        expect.any(Object)
      )
    })
  })

  describe('setActiveProject', () => {
    it('tracks project_opened event with sample origin for built-in projects', () => {
      const state = useEditorStore.getState()

      const cbioportalId = findProjectByName(state.projects, 'cBioPortal Demo Map')
      expect(cbioportalId).toBeDefined()

      state.setActiveProject(cbioportalId!)

      const project = state.projects[cbioportalId!]

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        project,
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with sample origin for ACME E-Commerce Platform', () => {
      const state = useEditorStore.getState()

      const acmeId = findProjectByName(state.projects, 'ACME E-Commerce Platform')
      expect(acmeId).toBeDefined()

      state.setActiveProject(acmeId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with sample origin for Elan Extended Warranty', () => {
      const state = useEditorStore.getState()

      const elanId = findProjectByName(state.projects, 'Elan Extended Warranty')
      expect(elanId).toBeDefined()

      state.setActiveProject(elanId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with empty origin for Empty Project', () => {
      const state = useEditorStore.getState()

      const emptyId = findProjectByName(state.projects, 'Empty Project')
      expect(emptyId).toBeDefined()

      state.setActiveProject(emptyId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'empty'
        }
      )
    })

    it('tracks project_opened with sample origin when switching between sample projects', () => {
      const state = useEditorStore.getState()

      const acmeId = findProjectByName(state.projects, 'ACME E-Commerce Platform')
      const cbioportalId = findProjectByName(state.projects, 'cBioPortal Demo Map')
      expect(acmeId).toBeDefined()
      expect(cbioportalId).toBeDefined()

      // First open ACME (will be 'sample')
      state.setActiveProject(acmeId!)
      trackEventSpy.mockClear()

      // Then switch to cbioportal (still 'sample' since it's a built-in sample)
      state.setActiveProject(cbioportalId!)

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'sample'
        }
      )
    })

    it('does not track event for non-existent project', () => {
      const state = useEditorStore.getState()

      state.setActiveProject('non-existent-project-id')

      expect(trackEventSpy).not.toHaveBeenCalled()
    })
  })

  describe('project lifecycle', () => {
    it('setActiveProject updates activeProjectId', () => {
      const state = useEditorStore.getState()

      const cbioportalId = findProjectByName(state.projects, 'cBioPortal Demo Map')
      expect(cbioportalId).toBeDefined()

      state.setActiveProject(cbioportalId!)

      // Get fresh state after update
      const updatedState = useEditorStore.getState()
      expect(updatedState.activeProjectId).toBe(cbioportalId)
    })

    it('setViewMode updates activeViewMode', () => {
      const state = useEditorStore.getState()

      state.setViewMode('strategic')

      // Get fresh state after update
      const updatedState = useEditorStore.getState()
      expect(updatedState.activeViewMode).toBe('strategic')
    })
  })
})
