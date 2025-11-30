import type { Project } from '../types'
import type { EditorState } from '../storeTypes'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateProjectName(name: string): ValidationResult {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Project name cannot be empty' }
  }
  return { valid: true }
}

export function generateEmptyProject(name: string): Project {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
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
    viewConfig: {
      flowStages: [],
    },
  }
}

export function createProjectAction(
  state: EditorState,
  name: string
): Partial<EditorState> {
  const validation = validateProjectName(name)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const newProject = generateEmptyProject(name)

  return {
    projects: {
      ...state.projects,
      [newProject.id]: newProject,
    },
    activeProjectId: newProject.id,
    selectedContextId: null,
    selectedRelationshipId: null,
    selectedGroupId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
    selectedStageIndex: null,
    selectedTeamId: null,
    selectedContextIds: [],
    undoStack: [],
    redoStack: [],
  }
}

export interface DeleteValidationResult {
  canDelete: boolean
  reason?: string
}

export function canDeleteProject(
  state: EditorState,
  projectId: string
): DeleteValidationResult {
  if (!state.projects[projectId]) {
    return { canDelete: false, reason: 'Project not found' }
  }

  const projectCount = Object.keys(state.projects).length
  if (projectCount <= 1) {
    return { canDelete: false, reason: 'Must have at least one project' }
  }

  return { canDelete: true }
}

export function selectNextProjectAfterDelete(
  state: EditorState,
  deletedProjectId: string
): string | null {
  const remainingProjects = Object.values(state.projects).filter(
    (p) => p.id !== deletedProjectId
  )

  if (remainingProjects.length === 0) {
    return null
  }

  const sorted = remainingProjects.sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return bTime - aTime
  })

  return sorted[0].id
}

export function deleteProjectAction(
  state: EditorState,
  projectId: string
): Partial<EditorState> {
  const validation = canDeleteProject(state, projectId)
  if (!validation.canDelete) {
    throw new Error(validation.reason)
  }

  const { [projectId]: deleted, ...remainingProjects } = state.projects
  const isDeletingActiveProject = state.activeProjectId === projectId

  const nextProjectId = isDeletingActiveProject
    ? selectNextProjectAfterDelete(state, projectId)
    : state.activeProjectId

  const result: Partial<EditorState> = {
    projects: remainingProjects,
    activeProjectId: nextProjectId,
  }

  if (isDeletingActiveProject) {
    result.selectedContextId = null
    result.selectedRelationshipId = null
    result.selectedGroupId = null
    result.selectedUserId = null
    result.selectedUserNeedId = null
    result.selectedUserNeedConnectionId = null
    result.selectedNeedContextConnectionId = null
    result.selectedStageIndex = null
    result.selectedTeamId = null
    result.selectedContextIds = []
    result.undoStack = []
    result.redoStack = []
  }

  return result
}

export function renameProjectAction(
  state: EditorState,
  projectId: string,
  newName: string
): Partial<EditorState> {
  const validation = validateProjectName(newName)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const project = state.projects[projectId]
  if (!project) {
    throw new Error('Project not found')
  }

  const updatedProject = {
    ...project,
    name: newName.trim(),
    updatedAt: new Date().toISOString(),
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}
