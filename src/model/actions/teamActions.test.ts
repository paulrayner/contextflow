import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  setSelectedTeamAction,
  updateTeamAction,
  addTeamAction,
  deleteTeamAction,
} from './teamActions'
import { createMockState } from './__testFixtures__/mockState'
import type { EditorState } from '../storeTypes'
import type { Team } from '../types'

describe('teamActions', () => {
  let mockState: EditorState

  beforeEach(() => {
    mockState = createMockState()
    mockState.projects['test-project'].teams = [
      { id: 'team-1', name: 'Platform Team', topologyType: 'platform' },
      { id: 'team-2', name: 'Customer Experience Squad', topologyType: 'stream-aligned' }
    ]
  })

  describe('setSelectedTeamAction', () => {
    it('should set selected team ID', () => {
      const result = setSelectedTeamAction(mockState, 'team-1')

      expect(result.selectedTeamId).toBe('team-1')
    })

    it('should clear selected team when null is passed', () => {
      mockState.selectedTeamId = 'team-1'
      const result = setSelectedTeamAction(mockState, null)

      expect(result.selectedTeamId).toBeNull()
    })

    it('should clear other selections when selecting a team', () => {
      mockState.selectedContextId = 'ctx-1'
      mockState.selectedRelationshipId = 'rel-1'
      mockState.selectedGroupId = 'group-1'

      const result = setSelectedTeamAction(mockState, 'team-1')

      expect(result.selectedTeamId).toBe('team-1')
      expect(result.selectedContextId).toBeNull()
      expect(result.selectedRelationshipId).toBeNull()
      expect(result.selectedGroupId).toBeNull()
    })

    it('should not clear other selections when deselecting team', () => {
      mockState.selectedTeamId = 'team-1'

      const result = setSelectedTeamAction(mockState, null)

      expect(result.selectedTeamId).toBeNull()
      expect(result.selectedContextId).toBeUndefined()
    })
  })

  describe('updateTeamAction', () => {
    it('should update team name', () => {
      const result = updateTeamAction(mockState, 'team-1', { name: 'New Platform Name' })

      const updatedTeam = result.projects?.['test-project'].teams?.find(t => t.id === 'team-1')
      expect(updatedTeam?.name).toBe('New Platform Name')
    })

    it('should preserve other team properties when updating name', () => {
      const result = updateTeamAction(mockState, 'team-1', { name: 'New Name' })

      const updatedTeam = result.projects?.['test-project'].teams?.find(t => t.id === 'team-1')
      expect(updatedTeam?.topologyType).toBe('platform')
    })

    it('should not modify other teams', () => {
      const result = updateTeamAction(mockState, 'team-1', { name: 'New Name' })

      const otherTeam = result.projects?.['test-project'].teams?.find(t => t.id === 'team-2')
      expect(otherTeam?.name).toBe('Customer Experience Squad')
    })

    it('should return unchanged state if team not found', () => {
      const result = updateTeamAction(mockState, 'nonexistent', { name: 'New Name' })

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if project not found', () => {
      const state = { ...mockState, activeProjectId: 'nonexistent' }
      const result = updateTeamAction(state, 'team-1', { name: 'New Name' })

      expect(result).toBe(state)
    })

    it('should return unchanged state if no active project', () => {
      const state = { ...mockState, activeProjectId: null }
      const result = updateTeamAction(state, 'team-1', { name: 'New Name' })

      expect(result).toBe(state)
    })

    it('should update jiraBoard', () => {
      const result = updateTeamAction(mockState, 'team-1', { jiraBoard: 'https://jira.example.com/board/123' })

      const updatedTeam = result.projects?.['test-project'].teams?.find(t => t.id === 'team-1')
      expect(updatedTeam?.jiraBoard).toBe('https://jira.example.com/board/123')
      expect(updatedTeam?.name).toBe('Platform Team')
    })

    it('should update topologyType', () => {
      const result = updateTeamAction(mockState, 'team-1', { topologyType: 'enabling' })

      const updatedTeam = result.projects?.['test-project'].teams?.find(t => t.id === 'team-1')
      expect(updatedTeam?.topologyType).toBe('enabling')
      expect(updatedTeam?.name).toBe('Platform Team')
    })

    it('should update multiple properties at once', () => {
      const result = updateTeamAction(mockState, 'team-1', {
        name: 'Updated Team',
        jiraBoard: 'https://jira.example.com',
        topologyType: 'complicated-subsystem'
      })

      const updatedTeam = result.projects?.['test-project'].teams?.find(t => t.id === 'team-1')
      expect(updatedTeam?.name).toBe('Updated Team')
      expect(updatedTeam?.jiraBoard).toBe('https://jira.example.com')
      expect(updatedTeam?.topologyType).toBe('complicated-subsystem')
    })

    it('should clear jiraBoard when set to empty string', () => {
      mockState.projects['test-project'].teams![0].jiraBoard = 'https://old-jira.com'
      const result = updateTeamAction(mockState, 'team-1', { jiraBoard: '' })

      const updatedTeam = result.projects?.['test-project'].teams?.find(t => t.id === 'team-1')
      expect(updatedTeam?.jiraBoard).toBe('')
    })
  })

  describe('addTeamAction', () => {
    it('should add a new team with given name', () => {
      const result = addTeamAction(mockState, 'New Team')

      const teams = result.projects?.['test-project'].teams
      expect(teams).toHaveLength(3)
      expect(teams?.[2].name).toBe('New Team')
    })

    it('should generate a unique team ID', () => {
      const result = addTeamAction(mockState, 'New Team')

      const newTeam = result.projects?.['test-project'].teams?.[2]
      expect(newTeam?.id).toBeDefined()
      expect(newTeam?.id).toContain('team-')
    })

    it('should default topologyType to stream-aligned', () => {
      const result = addTeamAction(mockState, 'New Team')

      const newTeam = result.projects?.['test-project'].teams?.[2]
      expect(newTeam?.topologyType).toBe('stream-aligned')
    })

    it('should select the newly created team', () => {
      const result = addTeamAction(mockState, 'New Team')

      expect(result.selectedTeamId).toBeDefined()
      const newTeam = result.projects?.['test-project'].teams?.[2]
      expect(result.selectedTeamId).toBe(newTeam?.id)
    })

    it('should return the new team ID', () => {
      const result = addTeamAction(mockState, 'New Team')

      expect(result.newTeamId).toBeDefined()
    })

    it('should return unchanged state if no active project', () => {
      const state = { ...mockState, activeProjectId: null }
      const result = addTeamAction(state, 'New Team')

      expect(result).toBe(state)
    })

    it('should handle empty teams array', () => {
      mockState.projects['test-project'].teams = []
      const result = addTeamAction(mockState, 'New Team')

      const teams = result.projects?.['test-project'].teams
      expect(teams).toHaveLength(1)
      expect(teams?.[0].name).toBe('New Team')
    })
  })

  describe('deleteTeamAction', () => {
    it('should delete a team from the teams array', () => {
      const result = deleteTeamAction(mockState, 'team-1')

      const teams = result.projects?.['test-project'].teams
      expect(teams).toHaveLength(1)
      expect(teams?.find(t => t.id === 'team-1')).toBeUndefined()
      expect(teams?.find(t => t.id === 'team-2')).toBeDefined()
    })

    it('should unassign team from contexts that reference it', () => {
      // Add a context with team-1 assigned
      mockState.projects['test-project'].contexts = [
        {
          id: 'ctx-1',
          name: 'Test Context',
          positions: { flow: { x: 50 }, strategic: { x: 50 }, distillation: { x: 50, y: 50 }, shared: { y: 50 } },
          evolutionStage: 'custom-built',
          strategicClassification: 'supporting',
          teamId: 'team-1',
        },
        {
          id: 'ctx-2',
          name: 'Another Context',
          positions: { flow: { x: 60 }, strategic: { x: 60 }, distillation: { x: 60, y: 60 }, shared: { y: 60 } },
          evolutionStage: 'custom-built',
          strategicClassification: 'supporting',
          teamId: 'team-2',
        },
      ]

      const result = deleteTeamAction(mockState, 'team-1')

      const contexts = result.projects?.['test-project'].contexts
      const ctx1 = contexts?.find(c => c.id === 'ctx-1')
      const ctx2 = contexts?.find(c => c.id === 'ctx-2')

      expect(ctx1?.teamId).toBeUndefined()
      expect(ctx2?.teamId).toBe('team-2')
    })

    it('should clear selection if deleted team was selected', () => {
      mockState.selectedTeamId = 'team-1'
      const result = deleteTeamAction(mockState, 'team-1')

      expect(result.selectedTeamId).toBeNull()
    })

    it('should not affect selection if different team was selected', () => {
      mockState.selectedTeamId = 'team-2'
      const result = deleteTeamAction(mockState, 'team-1')

      expect(result.selectedTeamId).toBeUndefined()
    })

    it('should return unchanged state if team not found', () => {
      const result = deleteTeamAction(mockState, 'nonexistent')

      expect(result).toBe(mockState)
    })

    it('should return unchanged state if no active project', () => {
      const state = { ...mockState, activeProjectId: null }
      const result = deleteTeamAction(state, 'team-1')

      expect(result).toBe(state)
    })

    it('should return unchanged state if project not found', () => {
      const state = { ...mockState, activeProjectId: 'nonexistent' }
      const result = deleteTeamAction(state, 'team-1')

      expect(result).toBe(state)
    })
  })
})
