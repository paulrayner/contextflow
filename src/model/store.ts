import { create } from 'zustand'
import type { Project, BoundedContext, User, UserNeed, UserNeedConnection, NeedContextConnection, TemporalKeyframe, FlowStageMarker } from './types'
import { saveProject, loadProject } from './persistence'
import { config } from '../config'
import { trackEvent, trackPropertyChange, trackTextFieldEdit, trackFTUEMilestone } from '../utils/analytics'
import { classifyFromDistillationPosition, classifyFromStrategicPosition } from './classification'
import type { ViewMode, EditorCommand, EditorState } from './storeTypes'
import { initialProjects, initialActiveProjectId, BUILT_IN_PROJECTS, sampleProject, cbioportal, initializeBuiltInProjects } from './builtInProjects'
import { applyUndo, applyRedo } from './undoRedo'
import {
  isCollabModeActive,
  getCollabMutations,
  getCollabUndoRedo,
  initializeCollabMode,
  destroyCollabMode,
} from './sync/useCollabMode'
import { calculateNextStagePosition } from './stagePosition'
import { getGridPosition, needsRedistribution } from '../lib/distillationGrid'
import {
  updateContextAction,
  updateContextPositionAction,
  updateMultipleContextPositionsAction,
  addContextAction,
  deleteContextAction,
  addContextIssueAction,
  updateContextIssueAction,
  deleteContextIssueAction,
  assignTeamToContextAction,
  unassignTeamFromContextAction
} from './actions/contextActions'
import {
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
  removeContextFromGroupAction,
  addContextToGroupAction,
  addContextsToGroupAction
} from './actions/groupActions'
import {
  addRelationshipAction,
  deleteRelationshipAction,
  updateRelationshipAction,
  swapRelationshipDirectionAction
} from './actions/relationshipActions'
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
  createUserNeedConnectionAction,
  deleteUserNeedConnectionAction,
  updateUserNeedConnectionAction,
  createNeedContextConnectionAction,
  deleteNeedContextConnectionAction,
  updateNeedContextConnectionAction
} from './actions/userActions'
import {
  toggleTemporalModeAction,
  addKeyframeAction,
  deleteKeyframeAction,
  updateKeyframeAction,
  updateKeyframeContextPositionAction
} from './actions/temporalActions'
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

  updateContext: (contextId, updates) => set((state) => {
    if (isCollabModeActive()) {
      getCollabMutations().updateContext(contextId, updates)
      return {}
    }
    const result = updateContextAction(state, contextId, updates)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateContextPosition: (contextId, newPositions) => set((state) => {
    if (isCollabModeActive()) {
      getCollabMutations().updateContextPosition(contextId, newPositions)
      return {}
    }
    const result = updateContextPositionAction(state, contextId, newPositions)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateMultipleContextPositions: (positionsMap) => set((state) => {
    const result = updateMultipleContextPositionsAction(state, positionsMap)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
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
    if (isCollabModeActive()) {
      const result = addContextAction(state, name)
      if (result.newContext) {
        getCollabMutations().addContext(result.newContext)
      }
      return { selectedContextId: result.selectedContextId }
    }
    const result = addContextAction(state, name)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteContext: (contextId) => set((state) => {
    if (isCollabModeActive()) {
      getCollabMutations().deleteContext(contextId)
      return state.selectedContextId === contextId ? { selectedContextId: null } : {}
    }
    const result = deleteContextAction(state, contextId)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
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
    const result = createGroupAction(state, label, color, notes)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateGroup: (groupId, updates) => set((state) => {
    const result = updateGroupAction(state, groupId, updates)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteGroup: (groupId) => set((state) => {
    const result = deleteGroupAction(state, groupId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  removeContextFromGroup: (groupId, contextId) => set((state) => {
    const result = removeContextFromGroupAction(state, groupId, contextId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  addContextToGroup: (groupId, contextId) => set((state) => {
    const result = addContextToGroupAction(state, groupId, contextId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  addContextsToGroup: (groupId, contextIds) => set((state) => {
    const result = addContextsToGroupAction(state, groupId, contextIds)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  addRelationship: (fromContextId, toContextId, pattern, description) => set((state) => {
    if (isCollabModeActive()) {
      const newRelationship = {
        id: `rel-${Date.now()}`,
        fromContextId,
        toContextId,
        pattern,
        description,
      }
      getCollabMutations().addRelationship(newRelationship)
      return {}
    }
    const result = addRelationshipAction(state, fromContextId, toContextId, pattern, description)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteRelationship: (relationshipId) => set((state) => {
    if (isCollabModeActive()) {
      getCollabMutations().deleteRelationship(relationshipId)
      return state.selectedRelationshipId === relationshipId ? { selectedRelationshipId: null } : {}
    }
    const result = deleteRelationshipAction(state, relationshipId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateRelationship: (relationshipId, updates) => set((state) => {
    if (isCollabModeActive()) {
      getCollabMutations().updateRelationship(relationshipId, updates)
      return {}
    }
    const result = updateRelationshipAction(state, relationshipId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  swapRelationshipDirection: (relationshipId) => set((state) => {
    if (isCollabModeActive()) {
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
    }
    const result = swapRelationshipDirectionAction(state, relationshipId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
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
    const result = addUserAction(state, name)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteUser: (userId) => set((state) => {
    const result = deleteUserAction(state, userId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateUser: (userId, updates) => set((state) => {
    const result = updateUserAction(state, userId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateUserPosition: (userId, newPosition) => set((state) => {
    const result = updateUserPositionAction(state, userId, newPosition)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
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
    const { newState, newUserNeedId } = addUserNeedAction(state, name)
    autosaveIfNeeded(state.activeProjectId, newState.projects)
    useEditorStore.setState(newState)
    return newUserNeedId
  },

  deleteUserNeed: (userNeedId) => set((state) => {
    const result = deleteUserNeedAction(state, userNeedId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateUserNeed: (userNeedId, updates) => set((state) => {
    const result = updateUserNeedAction(state, userNeedId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateUserNeedPosition: (userNeedId, newPosition) => set((state) => {
    const result = updateUserNeedPositionAction(state, userNeedId, newPosition)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
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
    const { newState, newConnectionId } = createUserNeedConnectionAction(state, userId, userNeedId)

    autosaveIfNeeded(state.activeProjectId, newState.projects)
    useEditorStore.setState(newState)
    return newConnectionId
  },

  deleteUserNeedConnection: (connectionId) => set((state) => {
    const result = deleteUserNeedConnectionAction(state, connectionId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateUserNeedConnection: (connectionId, updates) => set((state) => {
    const result = updateUserNeedConnectionAction(state, connectionId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  createNeedContextConnection: (userNeedId, contextId) => {
    const state = useEditorStore.getState()
    const { newState, newConnectionId } = createNeedContextConnectionAction(state, userNeedId, contextId)

    autosaveIfNeeded(state.activeProjectId, newState.projects)
    useEditorStore.setState(newState)
    return newConnectionId
  },

  deleteNeedContextConnection: (connectionId) => set((state) => {
    const result = deleteNeedContextConnectionAction(state, connectionId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateNeedContextConnection: (connectionId, updates) => set((state) => {
    const result = updateNeedContextConnectionAction(state, connectionId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
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
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const stages = project.viewConfig.flowStages
    if (index < 0 || index >= stages.length) return state

    const oldStage = stages[index]
    const newName = updates.name !== undefined ? updates.name : oldStage.name
    const newPosition = updates.position !== undefined ? updates.position : oldStage.position

    if (newName !== oldStage.name) {
      validateStageName(stages, newName, index)
    }

    if (newPosition !== oldStage.position) {
      validateStagePosition(stages, newPosition, index)
    }

    const newStage: FlowStageMarker = {
      name: newName,
      position: newPosition,
      description: updates.description !== undefined ? updates.description : oldStage.description,
      owner: updates.owner !== undefined ? updates.owner : oldStage.owner,
      notes: updates.notes !== undefined ? updates.notes : oldStage.notes,
    }
    const updatedStages = [...stages]
    updatedStages[index] = newStage

    const updatedProject = {
      ...project,
      viewConfig: {
        ...project.viewConfig,
        flowStages: updatedStages,
      },
    }

    const command: EditorCommand = {
      type: 'updateFlowStage',
      payload: {
        flowStageIndex: index,
        oldFlowStage: oldStage,
        newFlowStage: newStage,
      },
    }

    // Track analytics - track position changes (moves)
    if (newPosition !== oldStage.position) {
      trackEvent('flow_stage_moved', updatedProject, {
        entity_type: 'flow_stage',
        metadata: {
          name: newStage.name,
          old_position: oldStage.position,
          new_position: newPosition
        }
      })
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

  addFlowStage: (name, position?) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const stages = project.viewConfig.flowStages

    // Auto-calculate position if not provided
    const finalPosition = position ?? calculateNextStagePosition(stages)

    validateStageName(stages, name)
    validateStagePosition(stages, finalPosition)

    const newStage: FlowStageMarker = { name, position: finalPosition }
    const updatedStages = [...stages, newStage]

    const updatedProject = {
      ...project,
      viewConfig: {
        ...project.viewConfig,
        flowStages: updatedStages,
      },
    }

    const command: EditorCommand = {
      type: 'addFlowStage',
      payload: {
        flowStage: newStage,
      },
    }

    trackEvent('flow_stage_created', updatedProject, {
      entity_type: 'flow_stage',
      metadata: {
        name: newStage.name,
        position: newStage.position
      }
    })

    autosaveIfNeeded(projectId, { [projectId]: updatedProject })

    // Auto-select the new stage (it's added at the end, so index is length - 1)
    const newStageIndex = updatedStages.length - 1

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedStageIndex: newStageIndex,
      selectedContextId: null,
      selectedContextIds: [],
      selectedGroupId: null,
      selectedRelationshipId: null,
      selectedUserId: null,
      selectedUserNeedId: null,
      selectedUserNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  deleteFlowStage: (index) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const stages = project.viewConfig.flowStages
    if (index < 0 || index >= stages.length) return state

    const deletedStage = stages[index]
    const updatedStages = stages.filter((_, i) => i !== index)

    const updatedProject = {
      ...project,
      viewConfig: {
        ...project.viewConfig,
        flowStages: updatedStages,
      },
    }

    const command: EditorCommand = {
      type: 'deleteFlowStage',
      payload: {
        flowStageIndex: index,
        flowStage: deletedStage,
      },
    }

    trackEvent('flow_stage_deleted', project, {
      entity_type: 'flow_stage',
      metadata: {
        name: deletedStage.name,
        position: deletedStage.position
      }
    })

    autosaveIfNeeded(projectId, { [projectId]: updatedProject })

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
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedStageIndex: newSelectedStageIndex,
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  undo: () => set((state) => {
    if (isCollabModeActive()) {
      getCollabUndoRedo().undo()
      return {}
    }

    if (state.undoStack.length === 0) return state

    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const command = state.undoStack[state.undoStack.length - 1]
    const newUndoStack = state.undoStack.slice(0, -1)

    // Track undo usage
    trackEvent('undo_used', project, {
      action_undone: command.type
    })

    const updatedProject = applyUndo(project, command)

    // Autosave
    autosaveIfNeeded(projectId, { [projectId]: updatedProject })

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: newUndoStack,
      redoStack: [...state.redoStack, command],
    }
  }),

  redo: () => set((state) => {
    if (isCollabModeActive()) {
      getCollabUndoRedo().redo()
      return {}
    }

    if (state.redoStack.length === 0) return state

    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const command = state.redoStack[state.redoStack.length - 1]
    const newRedoStack = state.redoStack.slice(0, -1)

    // Track redo usage
    trackEvent('redo_used', project, {
      action_redone: command.type
    })

    const updatedProject = applyRedo(project, command)

    // Autosave
    autosaveIfNeeded(projectId, { [projectId]: updatedProject })

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: newRedoStack,
    }
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
    const result = toggleTemporalModeAction(state)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
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
    const { newState, newKeyframeId } = addKeyframeAction(state, date, label)

    autosaveIfNeeded(state.activeProjectId, newState.projects)
    useEditorStore.setState(newState)
    return newKeyframeId
  },

  deleteKeyframe: (keyframeId) => set((state) => {
    const result = deleteKeyframeAction(state, keyframeId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateKeyframe: (keyframeId, updates) => set((state) => {
    const result = updateKeyframeAction(state, keyframeId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateKeyframeContextPosition: (keyframeId, contextId, x, y) => set((state) => {
    const result = updateKeyframeContextPositionAction(state, keyframeId, contextId, x, y)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),
}))

initializeBuiltInProjects(useEditorStore.setState)
