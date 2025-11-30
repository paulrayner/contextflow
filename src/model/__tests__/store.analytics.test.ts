import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useEditorStore } from '../store'
import * as analytics from '../../utils/analytics'

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

      // Switch to cbioportal sample project
      const cbioportalId = 'cbioportal'
      state.setActiveProject(cbioportalId)

      const project = state.projects[cbioportalId]

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        project,
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with sample origin for acme-ecommerce', () => {
      const state = useEditorStore.getState()

      state.setActiveProject('acme-ecommerce')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with sample origin for elan-warranty', () => {
      const state = useEditorStore.getState()

      state.setActiveProject('elan-warranty')

      expect(trackEventSpy).toHaveBeenCalledWith(
        'project_opened',
        expect.any(Object),
        {
          project_origin: 'sample'
        }
      )
    })

    it('tracks project_opened with empty origin for empty-project', () => {
      const state = useEditorStore.getState()

      state.setActiveProject('empty-project')

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

      // First open acme-ecommerce (will be 'sample')
      state.setActiveProject('acme-ecommerce')
      trackEventSpy.mockClear()

      // Then switch to cbioportal (still 'sample' since it's a built-in sample)
      state.setActiveProject('cbioportal')

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

      state.setActiveProject('cbioportal')

      // Get fresh state after update
      const updatedState = useEditorStore.getState()
      expect(updatedState.activeProjectId).toBe('cbioportal')
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
