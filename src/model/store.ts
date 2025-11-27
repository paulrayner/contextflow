import { create } from 'zustand'
import type { Project, BoundedContext, Actor, UserNeed, ActorNeedConnection, NeedContextConnection, TemporalKeyframe } from './types'
import { saveProject, loadProject } from './persistence'
import { config } from '../config'
import { trackEvent, trackPropertyChange, trackTextFieldEdit, trackFTUEMilestone } from '../utils/analytics'
import { classifyFromDistillationPosition, classifyFromStrategicPosition } from './classification'
import type { ViewMode, EditorCommand, EditorState } from './storeTypes'
import { initialProjects, initialActiveProjectId, BUILT_IN_PROJECTS, sampleProject, cbioportal, initializeBuiltInProjects } from './builtInProjects'
import { applyUndo, applyRedo } from './undoRedo'
import { calculateNextStagePosition } from './stagePosition'
import {
  updateContextAction,
  updateContextPositionAction,
  updateMultipleContextPositionsAction,
  addContextAction,
  deleteContextAction
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
  updateRelationshipAction
} from './actions/relationshipActions'
import {
  addActorAction,
  deleteActorAction,
  updateActorAction,
  updateActorPositionAction,
  createActorConnectionAction,
  deleteActorConnectionAction,
  updateActorConnectionAction,
  addUserNeedAction,
  deleteUserNeedAction,
  updateUserNeedAction,
  updateUserNeedPositionAction,
  createActorNeedConnectionAction,
  deleteActorNeedConnectionAction,
  updateActorNeedConnectionAction,
  createNeedContextConnectionAction,
  deleteNeedContextConnectionAction,
  updateNeedContextConnectionAction
} from './actions/actorActions'
import {
  toggleTemporalModeAction,
  addKeyframeAction,
  deleteKeyframeAction,
  updateKeyframeAction,
  updateKeyframeContextPositionAction
} from './actions/temporalActions'
import { autosaveIfNeeded, migrateProject } from './persistence'
import { determineProjectOrigin } from './builtInProjects'
import { calculateKeyframeTransition } from './keyframes'
import { validateStageLabel, validateStagePosition, createSelectionState } from './validation'

export type { ViewMode, EditorCommand, EditorState }

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
  selectedActorId: null,
  selectedUserNeedId: null,
  selectedActorNeedConnectionId: null,
  selectedNeedContextConnectionId: null,
  selectedContextIds: [],

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

  // UI preferences (load from localStorage if available)
  groupOpacity: (() => {
    const stored = localStorage.getItem('contextflow.groupOpacity')
    return stored !== null ? parseFloat(stored) : config.ui.groupOpacity
  })(),

  // Temporal state (defaults to current year)
  temporal: {
    currentDate: new Date().getFullYear().toString(),
    activeKeyframeId: null,
  },

  undoStack: [],
  redoStack: [],

  updateContext: (contextId, updates) => set((state) => {
    const result = updateContextAction(state, contextId, updates)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateContextPosition: (contextId, newPositions) => set((state) => {
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
    const isSelected = state.selectedContextIds.includes(contextId)
    return {
      ...createSelectionState(null, 'context'),
      selectedContextIds: isSelected
        ? state.selectedContextIds.filter(id => id !== contextId)
        : [...state.selectedContextIds, contextId],
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

    return { activeViewMode: mode }
  }),

  setActiveProject: (projectId) => set((state) => {
    if (!state.projects[projectId]) return state

    const project = state.projects[projectId]
    const origin = determineProjectOrigin(projectId, state.activeProjectId === null)

    trackEvent('project_opened', project, {
      project_origin: origin
    })

    localStorage.setItem('contextflow.activeProjectId', projectId)
    return {
      activeProjectId: projectId,
      selectedContextId: null,
      selectedGroupId: null,
      selectedActorId: null,
      selectedUserNeedId: null,
      selectedActorNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
      selectedContextIds: [],
      undoStack: [],
      redoStack: [],
    }
  }),

  addContext: (name) => set((state) => {
    const result = addContextAction(state, name)
    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteContext: (contextId) => set((state) => {
    const result = deleteContextAction(state, contextId)
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
    const result = addRelationshipAction(state, fromContextId, toContextId, pattern, description)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteRelationship: (relationshipId) => set((state) => {
    const result = deleteRelationshipAction(state, relationshipId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateRelationship: (relationshipId, updates) => set((state) => {
    const result = updateRelationshipAction(state, relationshipId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  setSelectedRelationship: (relationshipId) => set({
    selectedRelationshipId: relationshipId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedActorId: null,
    selectedUserNeedId: null,
    selectedActorNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
  }),

  addActor: (name) => set((state) => {
    const result = addActorAction(state, name)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteActor: (actorId) => set((state) => {
    const result = deleteActorAction(state, actorId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateActor: (actorId, updates) => set((state) => {
    const result = updateActorAction(state, actorId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateActorPosition: (actorId, newPosition) => set((state) => {
    const result = updateActorPositionAction(state, actorId, newPosition)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  setSelectedActor: (actorId) => set({
    selectedActorId: actorId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedRelationshipId: null,
    selectedUserNeedId: null,
    selectedActorNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
  }),

  createActorConnection: (actorId, contextId) => set((state) => {
    const result = createActorConnectionAction(state, actorId, contextId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  deleteActorConnection: (connectionId) => set((state) => {
    const result = deleteActorConnectionAction(state, connectionId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateActorConnection: (connectionId, updates) => set((state) => {
    const result = updateActorConnectionAction(state, connectionId, updates)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
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
    selectedRelationshipId: null,
    selectedActorId: null,
    selectedActorNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
  }),

  setSelectedActorNeedConnection: (connectionId) => set({
    selectedActorNeedConnectionId: connectionId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedRelationshipId: null,
    selectedActorId: null,
    selectedUserNeedId: null,
    selectedNeedContextConnectionId: null,
  }),

  setSelectedNeedContextConnection: (connectionId) => set({
    selectedNeedContextConnectionId: connectionId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedRelationshipId: null,
    selectedActorId: null,
    selectedUserNeedId: null,
    selectedActorNeedConnectionId: null,
  }),

  createActorNeedConnection: (actorId, userNeedId) => {
    const state = useEditorStore.getState()
    const { newState, newConnectionId } = createActorNeedConnectionAction(state, actorId, userNeedId)

    autosaveIfNeeded(state.activeProjectId, newState.projects)
    useEditorStore.setState(newState)
    return newConnectionId
  },

  deleteActorNeedConnection: (connectionId) => set((state) => {
    const result = deleteActorNeedConnectionAction(state, connectionId)

    autosaveIfNeeded(state.activeProjectId, result.projects)
    return result
  }),

  updateActorNeedConnection: (connectionId, updates) => set((state) => {
    const result = updateActorNeedConnectionAction(state, connectionId, updates)

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

  setGroupOpacity: (opacity) => {
    localStorage.setItem('contextflow.groupOpacity', String(opacity))
    set({ groupOpacity: opacity })
  },

  updateFlowStage: (index, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const stages = project.viewConfig.flowStages
    if (index < 0 || index >= stages.length) return state

    const oldStage = stages[index]
    const newLabel = updates.label !== undefined ? updates.label : oldStage.label
    const newPosition = updates.position !== undefined ? updates.position : oldStage.position

    if (newLabel !== oldStage.label) {
      validateStageLabel(stages, newLabel, index)
    }

    if (newPosition !== oldStage.position) {
      validateStagePosition(stages, newPosition, index)
    }

    const newStage = { label: newLabel, position: newPosition }
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
          label: newStage.label,
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

  addFlowStage: (label, position?) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const stages = project.viewConfig.flowStages

    // Auto-calculate position if not provided
    const finalPosition = position ?? calculateNextStagePosition(stages)

    validateStageLabel(stages, label)
    validateStagePosition(stages, finalPosition)

    const newStage = { label, position: finalPosition }
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
        label: newStage.label,
        position: newStage.position
      }
    })

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
        label: deletedStage.label,
        position: deletedStage.position
      }
    })

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

  undo: () => set((state) => {
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
      actor_count: migratedProject.actors.length,
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
      selectedActorId: null,
      selectedUserNeedId: null,
      selectedActorNeedConnectionId: null,
      selectedNeedContextConnectionId: null,
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
    selectedActorId: null,
    selectedUserNeedId: null,
    selectedActorNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
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
