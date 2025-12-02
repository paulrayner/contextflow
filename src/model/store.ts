import { create } from 'zustand'
import type { Project, BoundedContext, User, UserNeed, UserNeedConnection, NeedContextConnection, TemporalKeyframe, FlowStageMarker } from './types'
import { saveProject, loadProject } from './persistence'
import { config } from '../config'
import { trackEvent, trackPropertyChange, trackTextFieldEdit, trackFTUEMilestone } from '../utils/analytics'
import { classifyFromDistillationPosition, classifyFromStrategicPosition } from './classification'
import type { ViewMode, EditorCommand, EditorState } from './storeTypes'
import { initialProjects, initialActiveProjectId, BUILT_IN_PROJECTS, sampleProject, cbioportal, initializeBuiltInProjects } from './builtInProjects'
import {
  isCollabModeActive,
  getCollabMutations,
  getCollabUndoRedo,
  initializeCollabMode,
  destroyCollabMode,
} from './sync/useCollabMode'
import { calculateNextStagePosition } from './stagePosition'
import { getGridPosition, needsRedistribution, findFirstUnoccupiedGridPosition, findFirstUnoccupiedFlowPosition } from '../lib/distillationGrid'
import {
  addContextIssueAction,
  updateContextIssueAction,
  deleteContextIssueAction,
  assignTeamToContextAction,
  unassignTeamFromContextAction
} from './actions/contextActions'
import {
  updateTeamAction,
  addTeamAction,
  deleteTeamAction,
} from './actions/teamActions'
import { createProjectAction, deleteProjectAction, renameProjectAction, duplicateProjectAction } from './actions/projectActions'
import {
  addUserAction,
  deleteUserAction,
  updateUserAction,
  updateUserPositionAction,
  addUserNeedAction,
  deleteUserNeedAction,
  updateUserNeedAction,
  updateUserNeedPositionAction,
} from './actions/userActions'
import {
  validateKeyframeDate,
  checkDuplicateKeyframe,
  shouldWarnFarFuture,
  captureContextPositions,
  shouldAutoCreateCurrentKeyframe,
  createCurrentKeyframe,
} from './actions/keyframeHelpers'
import { autosaveIfNeeded, migrateProject, deleteProject as deleteProjectFromDB } from './persistence'
import { determineProjectOrigin } from './builtInProjects'
import { calculateKeyframeTransition } from './keyframes'
import { validateStageName, validateStagePosition, createSelectionState } from './validation'

export type { ViewMode, EditorCommand, EditorState }

function getAllSelectedContextIds(state: EditorState): string[] {
  const singleSelection = state.selectedContextId && !state.selectedContextIds.includes(state.selectedContextId)
    ? [state.selectedContextId]
    : []
  return [...singleSelection, ...state.selectedContextIds]
}

let globalFitViewCallback: (() => void) | null = null

export function setFitViewCallback(callback: () => void) {
  globalFitViewCallback = callback
}

export const useEditorStore = create<EditorState>((set) => ({
  activeProjectId: initialActiveProjectId,
  projects: initialProjects,

  activeViewMode: 'flow',

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

  isDragging: false,

  canvasView: {
    flow: { zoom: 1, panX: 0, panY: 0 },
    strategic: { zoom: 1, panX: 0, panY: 0 },
    distillation: { zoom: 1, panX: 0, panY: 0 },
  },

  // View filters (default to ON, load from localStorage if available)
  showGroups: (() => {
    const stored = localStorage.getItem('contextflow.showGroups')
    return stored !== null ? stored === 'true' : true
  })(),
  showRelationships: (() => {
    const stored = localStorage.getItem('contextflow.showRelationships')
    return stored !== null ? stored === 'true' : true
  })(),
  showIssueLabels: (() => {
    const stored = localStorage.getItem('contextflow.showIssueLabels')
    return stored === 'true'
  })(),
  showTeamLabels: (() => {
    const stored = localStorage.getItem('contextflow.showTeamLabels')
    return stored === 'true'
  })(),

  showHelpTooltips: (() => {
    const stored = localStorage.getItem('contextflow.showHelpTooltips')
    return stored !== null ? stored === 'true' : true
  })(),

  hasSeenWelcome: (() => {
    const stored = localStorage.getItem('contextflow.hasSeenWelcome')
    return stored === 'true'
  })(),

  groupOpacity: (() => {
    const stored = localStorage.getItem('contextflow.groupOpacity')
    return stored !== null ? parseFloat(stored) : config.ui.groupOpacity
  })(),

  colorByMode: (() => {
    const stored = localStorage.getItem('contextflow.colorByMode')
    return stored === 'strategic' ? 'strategic' : 'ownership'
  })() as 'strategic' | 'ownership',

  // Temporal state (defaults to current year)
  temporal: {
    currentDate: new Date().getFullYear().toString(),
    activeKeyframeId: null,
  },

  undoStack: [],
  redoStack: [],

  updateContext: (contextId, updates) => set(() => {
    getCollabMutations().updateContext(contextId, updates)
    return {}
  }),

  updateContextPosition: (contextId, newPositions) => set(() => {
    getCollabMutations().updateContextPosition(contextId, newPositions)
    return {}
  }),

  updateMultipleContextPositions: (positionsMap) => set(() => {
    for (const [contextId, positions] of Object.entries(positionsMap)) {
      getCollabMutations().updateContextPosition(contextId, positions)
    }
    return {}
  }),

  setSelectedContext: (contextId) => set({
    ...createSelectionState(contextId, 'context'),
  }),

  toggleContextSelection: (contextId) => set((state) => {
    const currentSelection = getAllSelectedContextIds(state)
    const isSelected = currentSelection.includes(contextId)

    return {
      ...createSelectionState(null, 'context'),
      selectedContextIds: isSelected
        ? currentSelection.filter(id => id !== contextId)
        : [...currentSelection, contextId],
    }
  }),

  clearContextSelection: () => set({
    ...createSelectionState(null, 'context'),
  }),

  setViewMode: (mode) => set((state) => {
    const projectId = state.activeProjectId
    const project = projectId ? state.projects[projectId] : null

    trackEvent('view_switched', project, {
      from_view: state.activeViewMode,
      to_view: mode
    })

    // Track FTUE milestone: second view discovered
    // Check if user has switched views (different from starting view)
    if (mode !== 'flow') { // flow is the default starting view
      const viewsUsed = ['flow', mode] // User started in flow, now viewing another
      trackFTUEMilestone('second_view_discovered', project, {
        views_used: viewsUsed
      })
    }

    // Redistribute overlapping contexts when switching to distillation view
    if (mode === 'distillation' && project && needsRedistribution(project.contexts)) {
      const redistributedContexts = project.contexts.map((ctx, i) => ({
        ...ctx,
        positions: {
          ...ctx.positions,
          distillation: getGridPosition(i),
        },
        strategicClassification: classifyFromDistillationPosition(
          getGridPosition(i).x,
          getGridPosition(i).y
        ),
      }))

      const updatedProject = { ...project, contexts: redistributedContexts }
      saveProject(updatedProject)

      return {
        activeViewMode: mode,
        projects: { ...state.projects, [projectId!]: updatedProject },
      }
    }

    return { activeViewMode: mode }
  }),

  setActiveProject: (projectId) => set((state) => {
    if (!state.projects[projectId]) return state

    const project = state.projects[projectId]
    const origin = determineProjectOrigin(projectId, state.activeProjectId === null)

    trackEvent('project_opened', project, {
      project_origin: origin
    })

    if (isCollabModeActive()) {
      destroyCollabMode()
      const onProjectChange = (updatedProject: Project): void => {
        useEditorStore.setState((s) => ({
          projects: {
            ...s.projects,
            [updatedProject.id]: updatedProject,
          },
        }))
      }
      initializeCollabMode(project, { onProjectChange })
    }

    localStorage.setItem('contextflow.activeProjectId', projectId)
    return {
      activeProjectId: projectId,
      selectedContextId: null,
      selectedGroupId: null,
      selectedTeamId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedStageIndex: null,
      selectedContextIds: [],
      undoStack: [],
      redoStack: [],
    }
  }),

  createProject: (name) => set((state) => {
    const result = createProjectAction(state, name)
    if (result.activeProjectId && result.projects) {
      localStorage.setItem('contextflow.activeProjectId', result.activeProjectId)
      autosaveIfNeeded(result.activeProjectId, result.projects)
    }
    return result
  }),

  deleteProject: (projectId) => set((state) => {
    const result = deleteProjectAction(state, projectId)
    if (result.activeProjectId) {
      localStorage.setItem('contextflow.activeProjectId', result.activeProjectId)
    }
    deleteProjectFromDB(projectId).catch((err) => {
      console.error('Failed to delete project from IndexedDB:', err)
    })
    return result
  }),

  renameProject: (projectId, newName) => set((state) => {
    const result = renameProjectAction(state, projectId, newName)
    autosaveIfNeeded(projectId, result.projects)
    return result
  }),

  duplicateProject: (projectId) => set((state) => {
    const result = duplicateProjectAction(state, projectId)
    if (result.activeProjectId && result.projects) {
      localStorage.setItem('contextflow.activeProjectId', result.activeProjectId)
      autosaveIfNeeded(result.activeProjectId, result.projects)
    }
    return result
  }),

  addContext: (name) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}

    const flowPos = findFirstUnoccupiedFlowPosition(project.contexts)
    const newContext: BoundedContext = {
      id: `context-${Date.now()}`,
      name,
      positions: {
        flow: { x: flowPos.x },
        strategic: { x: flowPos.x },
        distillation: findFirstUnoccupiedGridPosition(project.contexts),
        shared: { y: flowPos.y },
      },
      strategicClassification: 'supporting',
      evolutionStage: 'custom-built',
    }

    getCollabMutations().addContext(newContext)
    return { selectedContextId: newContext.id }
  }),

  deleteContext: (contextId) => set((state) => {
    getCollabMutations().deleteContext(contextId)
    return state.selectedContextId === contextId ? { selectedContextId: null } : {}
  }),

  addContextIssue: (contextId, title, severity) => set((state) => {
    const result = addContextIssueAction(state, contextId, title, severity)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateContextIssue: (contextId, issueId, updates) => set((state) => {
    const result = updateContextIssueAction(state, contextId, issueId, updates)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteContextIssue: (contextId, issueId) => set((state) => {
    const result = deleteContextIssueAction(state, contextId, issueId)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  assignTeamToContext: (contextId, teamId) => set((state) => {
    const result = assignTeamToContextAction(state, contextId, teamId)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  unassignTeamFromContext: (contextId) => set((state) => {
    const result = unassignTeamFromContextAction(state, contextId)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  assignRepoToContext: (repoId, contextId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const repoIndex = project.repos.findIndex(r => r.id === repoId)
    if (repoIndex === -1) return state

    const repo = project.repos[repoIndex]
    const oldContextId = repo.contextId

    const command: EditorCommand = {
      type: 'assignRepo',
      payload: {
        repoId,
        oldContextId,
        newContextId: contextId,
      },
    }

    const updatedRepos = [...project.repos]
    updatedRepos[repoIndex] = {
      ...repo,
      contextId,
    }

    const updatedProject = {
      ...project,
      repos: updatedRepos,
    }

    autosaveIfNeeded(projectId, { [projectId]: updatedProject })

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  unassignRepo: (repoId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const repoIndex = project.repos.findIndex(r => r.id === repoId)
    if (repoIndex === -1) return state

    const repo = project.repos[repoIndex]
    const oldContextId = repo.contextId

    const command: EditorCommand = {
      type: 'unassignRepo',
      payload: {
        repoId,
        oldContextId,
      },
    }

    const updatedRepos = [...project.repos]
    updatedRepos[repoIndex] = {
      ...repo,
      contextId: undefined,
    }

    const updatedProject = {
      ...project,
      repos: updatedRepos,
    }

    autosaveIfNeeded(projectId, { [projectId]: updatedProject })

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  createGroup: (label, color, notes) => set((state) => {
    const newGroup = {
      id: `group-${Date.now()}`,
      label,
      color: color || '#3b82f6',
      contextIds: state.selectedContextIds,
      notes,
    }
    getCollabMutations().addGroup(newGroup)
    return {
      selectedGroupId: newGroup.id,
      selectedContextIds: [],
    }
  }),

  updateGroup: (groupId, updates) => set(() => {
    getCollabMutations().updateGroup(groupId, updates)
    return {}
  }),

  deleteGroup: (groupId) => set((state) => {
    getCollabMutations().deleteGroup(groupId)
    return state.selectedGroupId === groupId ? { selectedGroupId: null } : {}
  }),

  removeContextFromGroup: (groupId, contextId) => set(() => {
    getCollabMutations().removeContextFromGroup(groupId, contextId)
    return {}
  }),

  addContextToGroup: (groupId, contextId) => set(() => {
    getCollabMutations().addContextToGroup(groupId, contextId)
    return {}
  }),

  addContextsToGroup: (groupId, contextIds) => set(() => {
    getCollabMutations().addContextsToGroup(groupId, contextIds)
    return {}
  }),

  addRelationship: (fromContextId, toContextId, pattern, description) => set(() => {
    const newRelationship = {
      id: `rel-${Date.now()}`,
      fromContextId,
      toContextId,
      pattern,
      description,
    }
    getCollabMutations().addRelationship(newRelationship)
    return {}
  }),

  deleteRelationship: (relationshipId) => set((state) => {
    getCollabMutations().deleteRelationship(relationshipId)
    return state.selectedRelationshipId === relationshipId ? { selectedRelationshipId: null } : {}
  }),

  updateRelationship: (relationshipId, updates) => set(() => {
    getCollabMutations().updateRelationship(relationshipId, updates)
    return {}
  }),

  swapRelationshipDirection: (relationshipId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}
    const rel = project.relationships.find(r => r.id === relationshipId)
    if (!rel) return {}
    getCollabMutations().updateRelationship(relationshipId, {
      fromContextId: rel.toContextId,
      toContextId: rel.fromContextId,
    })
    return {}
  }),

  setSelectedRelationship: (relationshipId) => set({
    selectedRelationshipId: relationshipId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedTeamId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
    selectedStageIndex: null,
  }),

  setSelectedStage: (stageIndex) => set({
    selectedStageIndex: stageIndex,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedTeamId: null,
    selectedRelationshipId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
  }),

  setSelectedTeam: (teamId) => set(teamId === null ? {
    selectedTeamId: null,
  } : {
    selectedTeamId: teamId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedStageIndex: null,
    selectedRelationshipId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
  }),

  updateTeam: (teamId, updates) => set((state) => {
    const result = updateTeamAction(state, teamId, updates)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  addTeam: (name) => set((state) => {
    const result = addTeamAction(state, name)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteTeam: (teamId) => set((state) => {
    const result = deleteTeamAction(state, teamId)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  addUser: (name) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      position: 50,
    }

    getCollabMutations().addUser(newUser)
    return { selectedUserId: newUser.id }
  }),

  deleteUser: (userId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}

    const userNeedConnections = (project.userNeedConnections || []).filter(c => c.userId === userId)
    for (const conn of userNeedConnections) {
      getCollabMutations().deleteUserNeedConnection(conn.id)
    }

    getCollabMutations().deleteUser(userId)
    return state.selectedUserId === userId ? { selectedUserId: null } : {}
  }),

  updateUser: (userId, updates) => set(() => {
    getCollabMutations().updateUser(userId, updates)
    return {}
  }),

  updateUserPosition: (userId, newPosition) => set(() => {
    getCollabMutations().updateUserPosition(userId, newPosition)
    return {}
  }),

  setSelectedUser: (userId) => set({
    selectedUserId: userId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedTeamId: null,
    selectedRelationshipId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
    selectedStageIndex: null,
  }),

  addUserNeed: (name) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null
    const project = state.projects[projectId]
    if (!project) return null

    const newUserNeed: UserNeed = {
      id: `need-${Date.now()}`,
      name,
      position: 50,
      visibility: true,
    }

    getCollabMutations().addUserNeed(newUserNeed)
    useEditorStore.setState({ selectedUserNeedId: newUserNeed.id })
    return newUserNeed.id
  },

  deleteUserNeed: (userNeedId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}
    const project = state.projects[projectId]
    if (!project) return {}

    const userNeedConnections = (project.userNeedConnections || []).filter(c => c.userNeedId === userNeedId)
    const needContextConnections = (project.needContextConnections || []).filter(c => c.userNeedId === userNeedId)

    for (const conn of userNeedConnections) {
      getCollabMutations().deleteUserNeedConnection(conn.id)
    }
    for (const conn of needContextConnections) {
      getCollabMutations().deleteNeedContextConnection(conn.id)
    }

    getCollabMutations().deleteUserNeed(userNeedId)
    return state.selectedUserNeedId === userNeedId ? { selectedUserNeedId: null } : {}
  }),

  updateUserNeed: (userNeedId, updates) => set(() => {
    getCollabMutations().updateUserNeed(userNeedId, updates)
    return {}
  }),

  updateUserNeedPosition: (userNeedId, newPosition) => set(() => {
    getCollabMutations().updateUserNeedPosition(userNeedId, newPosition)
    return {}
  }),

  setSelectedUserNeed: (userNeedId) => set({
    selectedUserNeedId: userNeedId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedTeamId: null,
    selectedRelationshipId: null,
    selectedUserId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
    selectedStageIndex: null,
  }),

  setSelectedUserNeedConnection: (connectionId) => set({
    selectedUserNeedConnectionId: connectionId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedTeamId: null,
    selectedRelationshipId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedNeedContextConnectionId: null,
    selectedStageIndex: null,
  }),

  setSelectedNeedContextConnection: (connectionId) => set({
    selectedNeedContextConnectionId: connectionId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedTeamId: null,
    selectedRelationshipId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedStageIndex: null,
  }),

  createUserNeedConnection: (userId, userNeedId) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null
    const project = state.projects[projectId]
    if (!project) return null

    const newConnection = {
      id: `user-need-conn-${Date.now()}`,
      userId,
      userNeedId,
    }

    getCollabMutations().addUserNeedConnection(newConnection)

    trackEvent('user_need_connection_created', project, {
      entity_type: 'user_need_connection',
      entity_id: newConnection.id,
      metadata: {
        user_id: userId,
        user_need_id: userNeedId
      }
    })

    return newConnection.id
  },

  deleteUserNeedConnection: (connectionId) => set(() => {
    getCollabMutations().deleteUserNeedConnection(connectionId)
    return {}
  }),

  updateUserNeedConnection: (connectionId, updates) => set(() => {
    getCollabMutations().updateUserNeedConnection(connectionId, updates)
    return {}
  }),

  createNeedContextConnection: (userNeedId, contextId) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null
    const project = state.projects[projectId]
    if (!project) return null

    const newConnection = {
      id: `need-context-conn-${Date.now()}`,
      userNeedId,
      contextId,
    }

    getCollabMutations().addNeedContextConnection(newConnection)

    trackEvent('need_context_connection_created', project, {
      entity_type: 'need_context_connection',
      entity_id: newConnection.id,
      metadata: {
        user_need_id: userNeedId,
        context_id: contextId
      }
    })

    return newConnection.id
  },

  deleteNeedContextConnection: (connectionId) => set(() => {
    getCollabMutations().deleteNeedContextConnection(connectionId)
    return {}
  }),

  updateNeedContextConnection: (connectionId, updates) => set(() => {
    getCollabMutations().updateNeedContextConnection(connectionId, updates)
    return {}
  }),

  toggleShowGroups: () => set((state) => {
    const newValue = !state.showGroups
    localStorage.setItem('contextflow.showGroups', String(newValue))
    return { showGroups: newValue }
  }),

  toggleShowRelationships: () => set((state) => {
    const newValue = !state.showRelationships
    localStorage.setItem('contextflow.showRelationships', String(newValue))
    return { showRelationships: newValue }
  }),

  toggleIssueLabels: () => set((state) => {
    const newValue = !state.showIssueLabels
    localStorage.setItem('contextflow.showIssueLabels', String(newValue))
    return { showIssueLabels: newValue }
  }),

  toggleTeamLabels: () => set((state) => {
    const newValue = !state.showTeamLabels
    localStorage.setItem('contextflow.showTeamLabels', String(newValue))
    return { showTeamLabels: newValue }
  }),

  toggleHelpTooltips: () => set((state) => {
    const newValue = !state.showHelpTooltips
    localStorage.setItem('contextflow.showHelpTooltips', String(newValue))
    return { showHelpTooltips: newValue }
  }),

  dismissWelcome: () => set(() => {
    localStorage.setItem('contextflow.hasSeenWelcome', 'true')
    return { hasSeenWelcome: true }
  }),

  resetWelcome: () => set(() => {
    localStorage.setItem('contextflow.hasSeenWelcome', 'false')
    return { hasSeenWelcome: false }
  }),

  setGroupOpacity: (opacity) => {
    localStorage.setItem('contextflow.groupOpacity', String(opacity))
    set({ groupOpacity: opacity })
  },

  setColorByMode: (mode) => {
    localStorage.setItem('contextflow.colorByMode', mode)
    set({ colorByMode: mode })
  },

  setDragging: (isDragging) => set({ isDragging }),

  updateFlowStage: (index, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    const stages = project.viewConfig.flowStages
    if (index < 0 || index >= stages.length) return {}

    const oldStage = stages[index]
    const newName = updates.name !== undefined ? updates.name : oldStage.name
    const newPosition = updates.position !== undefined ? updates.position : oldStage.position

    if (newName !== oldStage.name) {
      validateStageName(stages, newName, index)
    }

    if (newPosition !== oldStage.position) {
      validateStagePosition(stages, newPosition, index)
    }

    // Track analytics - track position changes (moves)
    if (newPosition !== oldStage.position) {
      trackEvent('flow_stage_moved', project, {
        entity_type: 'flow_stage',
        metadata: {
          name: newName,
          old_position: oldStage.position,
          new_position: newPosition
        }
      })
    }

    getCollabMutations().updateFlowStage(index, updates)
    return {}
  }),

  addFlowStage: (name, position?) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    const stages = project.viewConfig.flowStages

    // Auto-calculate position if not provided
    const finalPosition = position ?? calculateNextStagePosition(stages)

    validateStageName(stages, name)
    validateStagePosition(stages, finalPosition)

    const newStage: FlowStageMarker = { name, position: finalPosition }

    trackEvent('flow_stage_created', project, {
      entity_type: 'flow_stage',
      metadata: {
        name: newStage.name,
        position: newStage.position
      }
    })

    getCollabMutations().addFlowStage(newStage)

    // Auto-select the new stage (it's added at the end, so index is length)
    const newStageIndex = stages.length

    return {
      selectedStageIndex: newStageIndex,
      selectedContextId: null,
      selectedContextIds: [],
      selectedGroupId: null,
      selectedRelationshipId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
    }
  }),

  deleteFlowStage: (index) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    const stages = project.viewConfig.flowStages
    if (index < 0 || index >= stages.length) return {}

    const deletedStage = stages[index]

    trackEvent('flow_stage_deleted', project, {
      entity_type: 'flow_stage',
      metadata: {
        name: deletedStage.name,
        position: deletedStage.position
      }
    })

    getCollabMutations().deleteFlowStage(index)

    // Clear selection if deleted stage was selected, or adjust index if needed
    let newSelectedStageIndex = state.selectedStageIndex
    if (state.selectedStageIndex !== null) {
      if (state.selectedStageIndex === index) {
        newSelectedStageIndex = null
      } else if (state.selectedStageIndex > index) {
        newSelectedStageIndex = state.selectedStageIndex - 1
      }
    }

    return {
      selectedStageIndex: newSelectedStageIndex,
    }
  }),

  undo: () => set(() => {
    getCollabUndoRedo().undo()
    return {}
  }),

  redo: () => set(() => {
    getCollabUndoRedo().redo()
    return {}
  }),

  fitToMap: () => {
    if (globalFitViewCallback) {
      globalFitViewCallback()
    }
  },

  exportProject: () => {},

  importProject: (project) => set((state) => {
    const migratedProject = migrateProject(project)
    const fileSize = JSON.stringify(migratedProject).length / 1024
    trackEvent('project_imported', migratedProject, {
      file_size_kb: Math.round(fileSize),
      context_count: migratedProject.contexts.length,
      relationship_count: migratedProject.relationships.length,
      group_count: migratedProject.groups.length,
      keyframe_count: migratedProject.temporal?.keyframes.length || 0,
      user_count: migratedProject.users.length,
      need_count: migratedProject.userNeeds.length
    })

    autosaveIfNeeded(migratedProject.id, { [migratedProject.id]: migratedProject })

    return {
      projects: {
        ...state.projects,
        [migratedProject.id]: migratedProject,
      },
      activeProjectId: migratedProject.id,
      selectedContextId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedStageIndex: null,
    }
  }),

  reset: () => set({
    activeProjectId: sampleProject.id,
    projects: {
      [sampleProject.id]: sampleProject,
      [cbioportal.id]: cbioportal,
    },
    activeViewMode: 'flow',
    selectedContextId: null,
    selectedRelationshipId: null,
    selectedGroupId: null,
    selectedTeamId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
    selectedStageIndex: null,
    selectedContextIds: [],
    undoStack: [],
    redoStack: [],
  }),

  // Temporal actions
  toggleTemporalMode: () => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    const currentlyEnabled = project.temporal?.enabled || false
    getCollabMutations().toggleTemporal(!currentlyEnabled)

    return {}
  }),

  setCurrentDate: (date) => set((state) => ({
    temporal: {
      ...state.temporal,
      currentDate: date,
    },
  })),

  setActiveKeyframe: (keyframeId) => set((state) => {
    const transition = calculateKeyframeTransition(
      keyframeId,
      state.temporal.activeKeyframeId,
      state.showGroups,
      state.showRelationships,
      state.temporal.savedShowGroups,
      state.temporal.savedShowRelationships
    )

    return {
      temporal: {
        ...state.temporal,
        ...transition,
      },
      ...(transition.showGroups !== undefined && { showGroups: transition.showGroups }),
      ...(transition.showRelationships !== undefined && { showRelationships: transition.showRelationships }),
    }
  }),

  addKeyframe: (date, label) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null

    const project = state.projects[projectId]
    if (!project) return null

    const validation = validateKeyframeDate(date)
    if (!validation.valid) {
      console.error(validation.error)
      return null
    }

    const existingKeyframes = project.temporal?.keyframes || []
    if (checkDuplicateKeyframe(date, existingKeyframes)) {
      console.error('Duplicate keyframe date:', date)
      return null
    }

    const farFutureCheck = shouldWarnFarFuture(date)
    if (farFutureCheck.shouldWarn) {
      console.warn(farFutureCheck.message)
    }

    const currentYear = new Date().getFullYear()
    const keyframeYear = parseInt(date.split('-')[0])
    const positions = captureContextPositions(project.contexts)

    if (shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)) {
      const nowKeyframe = createCurrentKeyframe(currentYear, positions, project.contexts.map(c => c.id))
      getCollabMutations().addKeyframe(nowKeyframe)
    }

    const newKeyframe: TemporalKeyframe = {
      id: `keyframe-${Date.now()}`,
      date,
      label,
      positions,
      activeContextIds: project.contexts.map(c => c.id),
    }
    getCollabMutations().addKeyframe(newKeyframe)

    trackEvent('keyframe_created', project, {
      entity_type: 'keyframe',
      entity_id: newKeyframe.id,
      metadata: {
        date: newKeyframe.date,
        context_count: Object.keys(newKeyframe.positions).length,
        auto_created_now_keyframe: shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)
      }
    })

    return newKeyframe.id
  },

  deleteKeyframe: (keyframeId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project || !project.temporal) return {}

    const keyframeToDelete = project.temporal.keyframes.find(kf => kf.id === keyframeId)
    if (!keyframeToDelete) return {}

    getCollabMutations().deleteKeyframe(keyframeId)

    trackEvent('keyframe_deleted', project, {
      entity_type: 'keyframe',
      entity_id: keyframeId,
      metadata: {
        date: keyframeToDelete.date
      }
    })

    return {}
  }),

  updateKeyframe: (keyframeId, updates) => set(() => {
    getCollabMutations().updateKeyframe(keyframeId, updates)
    return {}
  }),

  updateKeyframeContextPosition: (keyframeId, contextId, x, y) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return {}

    const project = state.projects[projectId]
    if (!project) return {}

    getCollabMutations().updateKeyframeContextPosition(keyframeId, contextId, { x, y })

    trackEvent('keyframe_context_position_changed', project, {
      entity_type: 'keyframe',
      entity_id: keyframeId,
      metadata: {
        context_id: contextId,
        keyframe_id: keyframeId
      }
    })

    return {}
  }),
}))

initializeBuiltInProjects(useEditorStore.setState)
