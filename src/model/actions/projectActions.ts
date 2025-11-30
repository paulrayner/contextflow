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

export function generateUniqueProjectName(
  baseName: string,
  existingNames: string[]
): string {
  if (!existingNames.includes(baseName)) {
    return baseName
  }

  const copyName = `${baseName} (Copy)`
  if (!existingNames.includes(copyName)) {
    return copyName
  }

  let counter = 2
  while (existingNames.includes(`${baseName} (Copy ${counter})`)) {
    counter++
  }
  return `${baseName} (Copy ${counter})`
}

interface IdMappings {
  contexts: Record<string, string>
  groups: Record<string, string>
  users: Record<string, string>
  userNeeds: Record<string, string>
  teams: Record<string, string>
}

function buildIdMappings(project: Project): IdMappings {
  const buildMapping = <T extends { id: string }>(items: T[] | undefined): Record<string, string> => {
    const mapping: Record<string, string> = {}
    ;(items || []).forEach((item) => {
      mapping[item.id] = crypto.randomUUID()
    })
    return mapping
  }

  return {
    contexts: buildMapping(project.contexts),
    groups: buildMapping(project.groups),
    users: buildMapping(project.users),
    userNeeds: buildMapping(project.userNeeds),
    teams: buildMapping(project.teams),
  }
}

function duplicateContexts(project: Project, mappings: IdMappings) {
  return project.contexts.map((ctx) => ({
    ...ctx,
    id: mappings.contexts[ctx.id],
    teamId: ctx.teamId ? mappings.teams[ctx.teamId] : undefined,
  }))
}

function duplicateRelationships(project: Project, mappings: IdMappings) {
  return project.relationships.map((rel) => ({
    ...rel,
    id: crypto.randomUUID(),
    fromContextId: mappings.contexts[rel.fromContextId] || rel.fromContextId,
    toContextId: mappings.contexts[rel.toContextId] || rel.toContextId,
  }))
}

function duplicateGroups(project: Project, mappings: IdMappings) {
  return project.groups.map((group) => ({
    ...group,
    id: mappings.groups[group.id],
    contextIds: group.contextIds.map((id) => mappings.contexts[id] || id),
  }))
}

function duplicateUsers(project: Project, mappings: IdMappings) {
  return project.users.map((user) => ({
    ...user,
    id: mappings.users[user.id],
  }))
}

function duplicateUserNeeds(project: Project, mappings: IdMappings) {
  return project.userNeeds.map((need) => ({
    ...need,
    id: mappings.userNeeds[need.id],
  }))
}

function duplicateUserNeedConnections(project: Project, mappings: IdMappings) {
  return project.userNeedConnections.map((conn) => ({
    ...conn,
    id: crypto.randomUUID(),
    userId: mappings.users[conn.userId] || conn.userId,
    userNeedId: mappings.userNeeds[conn.userNeedId] || conn.userNeedId,
  }))
}

function duplicateNeedContextConnections(project: Project, mappings: IdMappings) {
  return project.needContextConnections.map((conn) => ({
    ...conn,
    id: crypto.randomUUID(),
    userNeedId: mappings.userNeeds[conn.userNeedId] || conn.userNeedId,
    contextId: mappings.contexts[conn.contextId] || conn.contextId,
  }))
}

function duplicateTeams(project: Project, mappings: IdMappings) {
  return project.teams.map((team) => ({
    ...team,
    id: mappings.teams[team.id],
  }))
}

function duplicateKeyframes(project: Project, mappings: IdMappings) {
  return (project.temporalKeyframes || []).map((keyframe) => ({
    ...keyframe,
    id: crypto.randomUUID(),
    contextPositions: Object.fromEntries(
      Object.entries(keyframe.contextPositions || {}).map(([ctxId, pos]) => [
        mappings.contexts[ctxId] || ctxId,
        pos,
      ])
    ),
  }))
}

function duplicateViewConfig(project: Project) {
  return {
    ...project.viewConfig,
    flowStages: project.viewConfig.flowStages.map((stage) => ({ ...stage })),
  }
}

function createClearedSelectionState(): Partial<EditorState> {
  return {
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

export function duplicateProjectAction(
  state: EditorState,
  projectId: string
): Partial<EditorState> {
  const sourceProject = state.projects[projectId]
  if (!sourceProject) {
    throw new Error('Project not found')
  }

  const existingNames = Object.values(state.projects).map((p) => p.name)
  const newName = generateUniqueProjectName(sourceProject.name, existingNames)
  const now = new Date().toISOString()
  const newProjectId = crypto.randomUUID()
  const mappings = buildIdMappings(sourceProject)

  const newProject: Project = {
    ...sourceProject,
    id: newProjectId,
    name: newName,
    createdAt: now,
    updatedAt: now,
    contexts: duplicateContexts(sourceProject, mappings),
    relationships: duplicateRelationships(sourceProject, mappings),
    groups: duplicateGroups(sourceProject, mappings),
    users: duplicateUsers(sourceProject, mappings),
    userNeeds: duplicateUserNeeds(sourceProject, mappings),
    userNeedConnections: duplicateUserNeedConnections(sourceProject, mappings),
    needContextConnections: duplicateNeedContextConnections(sourceProject, mappings),
    teams: duplicateTeams(sourceProject, mappings),
    temporalKeyframes: duplicateKeyframes(sourceProject, mappings),
    repos: sourceProject.repos.map((repo) => ({ ...repo })),
    people: sourceProject.people.map((person) => ({ ...person })),
    viewConfig: duplicateViewConfig(sourceProject),
  }

  return {
    projects: {
      ...state.projects,
      [newProjectId]: newProject,
    },
    activeProjectId: newProjectId,
    ...createClearedSelectionState(),
  }
}
