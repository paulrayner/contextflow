import type { EditorState } from '../storeTypes'
import type { Team } from '../types'

export function setSelectedTeamAction(
  state: EditorState,
  teamId: string | null
): Partial<EditorState> {
  if (teamId === null) {
    return {
      selectedTeamId: null,
    }
  }

  return {
    selectedTeamId: teamId,
    selectedContextId: null,
    selectedRelationshipId: null,
    selectedGroupId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedStageIndex: null,
  }
}

export function updateTeamAction(
  state: EditorState,
  teamId: string,
  updates: Partial<Team>
): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const teams = project.teams || []
  const teamIndex = teams.findIndex(t => t.id === teamId)
  if (teamIndex === -1) return state

  const updatedTeams = [...teams]
  updatedTeams[teamIndex] = {
    ...updatedTeams[teamIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    teams: updatedTeams,
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}

export function addTeamAction(
  state: EditorState,
  name: string
): Partial<EditorState> & { newTeamId?: string } {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const newTeam: Team = {
    id: `team-${Date.now()}`,
    name,
    topologyType: 'stream-aligned',
  }

  const teams = project.teams || []
  const updatedProject = {
    ...project,
    teams: [...teams, newTeam],
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedTeamId: newTeam.id,
    selectedContextId: null,
    selectedGroupId: null,
    selectedRelationshipId: null,
    selectedStageIndex: null,
    newTeamId: newTeam.id,
  }
}

export function deleteTeamAction(
  state: EditorState,
  teamId: string
): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const teams = project.teams || []
  const teamIndex = teams.findIndex(t => t.id === teamId)
  if (teamIndex === -1) return state

  const updatedTeams = teams.filter(t => t.id !== teamId)

  const updatedContexts = project.contexts.map(ctx => {
    if (ctx.teamId === teamId) {
      const { teamId: _, ...rest } = ctx
      return rest
    }
    return ctx
  })

  const updatedProject = {
    ...project,
    teams: updatedTeams,
    contexts: updatedContexts,
  }

  const result: Partial<EditorState> = {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }

  if (state.selectedTeamId === teamId) {
    result.selectedTeamId = null
  }

  return result
}
