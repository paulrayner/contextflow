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
