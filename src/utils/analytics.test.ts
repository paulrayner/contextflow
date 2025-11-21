import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getDeploymentContext,
  hashProjectId,
  isAnalyticsEnabled,
  getProjectMetadata,
  trackEvent
} from './analytics'
import type { Project } from '../model/types'

describe('analytics', () => {
  describe('getDeploymentContext', () => {
    let originalLocation: Location

    beforeEach(() => {
      originalLocation = window.location
      // @ts-ignore
      delete window.location
    })

    afterEach(() => {
      window.location = originalLocation
    })

    it('returns "hosted_demo" for contextflow.virtualgenius.com', () => {
      // @ts-ignore
      window.location = { hostname: 'contextflow.virtualgenius.com' }
      expect(getDeploymentContext()).toBe('hosted_demo')
    })

    it('returns "localhost" for localhost', () => {
      // @ts-ignore
      window.location = { hostname: 'localhost' }
      expect(getDeploymentContext()).toBe('localhost')
    })

    it('returns "localhost" for 127.0.0.1', () => {
      // @ts-ignore
      window.location = { hostname: '127.0.0.1' }
      expect(getDeploymentContext()).toBe('localhost')
    })

    it('returns "self_hosted" for other domains', () => {
      // @ts-ignore
      window.location = { hostname: 'my-company.com' }
      expect(getDeploymentContext()).toBe('self_hosted')
    })
  })

  describe('hashProjectId', () => {
    it('returns consistent hash for same input', () => {
      const id = 'test-project-123'
      const hash1 = hashProjectId(id)
      const hash2 = hashProjectId(id)
      expect(hash1).toBe(hash2)
    })

    it('returns different hashes for different inputs', () => {
      const hash1 = hashProjectId('project-a')
      const hash2 = hashProjectId('project-b')
      expect(hash1).not.toBe(hash2)
    })

    it('returns hash with proj_ prefix', () => {
      const hash = hashProjectId('test-project')
      expect(hash).toMatch(/^proj_[a-z0-9]+$/)
    })

    it('returns hash of fixed length (8 chars after prefix)', () => {
      const hash = hashProjectId('test-project')
      expect(hash.length).toBe(13) // 'proj_' (5) + 8 chars
    })
  })

  describe('isAnalyticsEnabled', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('returns true when developer mode is not set', () => {
      expect(isAnalyticsEnabled()).toBe(true)
    })

    it('returns false when developer mode is enabled', () => {
      localStorage.setItem('contextflow.developer_mode', 'true')
      expect(isAnalyticsEnabled()).toBe(false)
    })

    it('returns true when developer mode is explicitly disabled', () => {
      localStorage.setItem('contextflow.developer_mode', 'false')
      expect(isAnalyticsEnabled()).toBe(true)
    })
  })

  describe('getProjectMetadata', () => {
    it('returns null when no project provided', () => {
      expect(getProjectMetadata(null)).toBeNull()
    })

    it('extracts basic project metrics', () => {
      const project: Project = {
        id: 'test-project-123',
        name: 'Test Project',
        contexts: [{} as any, {} as any, {} as any], // 3 contexts
        relationships: [{} as any, {} as any], // 2 relationships
        groups: [{} as any], // 1 group
        repos: [
          { id: '1', name: 'repo1', contextId: 'ctx1', teamIds: [], contributors: [] },
          { id: '2', name: 'repo2', contextId: undefined, teamIds: [], contributors: [] },
          { id: '3', name: 'repo3', contextId: 'ctx2', remoteUrl: 'https://github.com/test/repo', teamIds: [], contributors: [] }
        ],
        people: [{} as any, {} as any],
        teams: [{} as any],
        actors: [],
        userNeeds: [],
        actorNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [{} as any, {} as any] }
      }

      const metadata = getProjectMetadata(project)

      expect(metadata).toEqual({
        project_id: expect.stringMatching(/^proj_[a-z0-9]+$/),
        context_count: 3,
        relationship_count: 2,
        group_count: 1,
        repo_count: 3,
        repo_assignment_count: 2,
        repo_with_url_count: 1,
        person_count: 2,
        team_count: 1,
        contributor_count: 0,
        has_temporal: false,
        keyframe_count: 0,
        actor_count: 0,
        need_count: 0,
        actor_need_connection_count: 0,
        need_context_connection_count: 0,
        flow_stage_marker_count: 2
      })
    })

    it('counts contributors across all repos', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        contexts: [],
        relationships: [],
        groups: [],
        repos: [
          { id: '1', name: 'r1', teamIds: [], contributors: [{ personId: 'p1' }, { personId: 'p2' }] },
          { id: '2', name: 'r2', teamIds: [], contributors: [{ personId: 'p3' }] }
        ],
        people: [],
        teams: [],
        actors: [],
        userNeeds: [],
        actorNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [] }
      }

      const metadata = getProjectMetadata(project)
      expect(metadata?.contributor_count).toBe(3)
    })

    it('handles temporal enabled with keyframes', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        contexts: [],
        relationships: [],
        groups: [],
        repos: [],
        people: [],
        teams: [],
        actors: [],
        userNeeds: [],
        actorNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [] },
        temporal: {
          enabled: true,
          keyframes: [{} as any, {} as any, {} as any]
        }
      }

      const metadata = getProjectMetadata(project)
      expect(metadata?.has_temporal).toBe(true)
      expect(metadata?.keyframe_count).toBe(3)
    })

    it('handles temporal disabled', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        contexts: [],
        relationships: [],
        groups: [],
        repos: [],
        people: [],
        teams: [],
        actors: [],
        userNeeds: [],
        actorNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [] },
        temporal: {
          enabled: false,
          keyframes: [{} as any]
        }
      }

      const metadata = getProjectMetadata(project)
      expect(metadata?.has_temporal).toBe(false)
    })

    it('counts actors and needs', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        contexts: [],
        relationships: [],
        groups: [],
        repos: [],
        people: [],
        teams: [],
        actors: [{} as any, {} as any],
        userNeeds: [{} as any, {} as any, {} as any],
        actorNeedConnections: [{} as any],
        needContextConnections: [{} as any, {} as any],
        viewConfig: { flowStages: [] }
      }

      const metadata = getProjectMetadata(project)
      expect(metadata?.actor_count).toBe(2)
      expect(metadata?.need_count).toBe(3)
      expect(metadata?.actor_need_connection_count).toBe(1)
      expect(metadata?.need_context_connection_count).toBe(2)
    })
  })

  describe('trackEvent', () => {
    let saEventMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      localStorage.clear()
      saEventMock = vi.fn()
      // @ts-ignore
      window.sa_event = saEventMock
      // @ts-ignore
      window.location = { hostname: 'localhost' }
    })

    afterEach(() => {
      localStorage.clear()
      // @ts-ignore
      delete window.sa_event
    })

    it('does not call sa_event when developer mode is enabled', () => {
      localStorage.setItem('contextflow.developer_mode', 'true')
      trackEvent('test_event', null, {})
      expect(saEventMock).not.toHaveBeenCalled()
    })

    it('calls sa_event with event name and metadata', () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test',
        contexts: [{} as any],
        relationships: [],
        groups: [],
        repos: [],
        people: [],
        teams: [],
        actors: [],
        userNeeds: [],
        actorNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [] }
      }

      trackEvent('test_event', project, { custom: 'value' })

      expect(saEventMock).toHaveBeenCalledWith('test_event', {
        deployment: 'localhost',
        app_version: '0.2.0',
        project_id: expect.stringMatching(/^proj_[a-z0-9]+$/),
        context_count: 1,
        relationship_count: 0,
        group_count: 0,
        repo_count: 0,
        repo_assignment_count: 0,
        repo_with_url_count: 0,
        person_count: 0,
        team_count: 0,
        contributor_count: 0,
        has_temporal: false,
        keyframe_count: 0,
        actor_count: 0,
        need_count: 0,
        actor_need_connection_count: 0,
        need_context_connection_count: 0,
        flow_stage_marker_count: 0,
        custom: 'value'
      })
    })

    it('handles null project gracefully', () => {
      trackEvent('test_event', null, { custom: 'value' })

      expect(saEventMock).toHaveBeenCalledWith('test_event', {
        deployment: 'localhost',
        app_version: '0.2.0',
        custom: 'value'
      })
    })

    it('handles sa_event not being defined (silent failure)', () => {
      // @ts-ignore
      delete window.sa_event

      // Should not throw
      expect(() => trackEvent('test_event', null, {})).not.toThrow()
    })

    it('handles sa_event throwing error (silent failure)', () => {
      // @ts-ignore
      window.sa_event = vi.fn(() => {
        throw new Error('Network error')
      })

      // Should not throw
      expect(() => trackEvent('test_event', null, {})).not.toThrow()
    })
  })
})
