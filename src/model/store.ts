import { create } from 'zustand'
import type { Project, BoundedContext, Actor, UserNeed, ActorNeedConnection, NeedContextConnection, TemporalKeyframe } from './types'
import { saveProject, loadProject } from './persistence'
import { config } from '../config'
import { trackEvent, trackPropertyChange, trackTextFieldEdit, trackFTUEMilestone } from '../utils/analytics'
import { classifyFromDistillationPosition, classifyFromStrategicPosition } from './classification'
import type { ViewMode, EditorCommand, EditorState } from './storeTypes'
import { initialProjects, initialActiveProjectId, BUILT_IN_PROJECTS, sampleProject, cbioportal } from './builtInProjects'
import { applyUndo, applyRedo } from './undoRedo'
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

export type { ViewMode, EditorCommand, EditorState }

// Helper to auto-save project after state changes
function autosaveProject(projectId: string, project: Project) {
  saveProject(project).catch((err) => {
    console.error('Failed to autosave project:', err)
  })
}

// Global callback for fitToMap - will be set by CanvasArea component
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

  // Actions
  updateContext: (contextId, updates) => set((state) => {
    const result = updateContextAction(state, contextId, updates)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateContextPosition: (contextId, newPositions) => set((state) => {
    const result = updateContextPositionAction(state, contextId, newPositions)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateMultipleContextPositions: (positionsMap) => set((state) => {
    const result = updateMultipleContextPositionsAction(state, positionsMap)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  setSelectedContext: (contextId) => set({
    selectedContextId: contextId,
    selectedContextIds: [], // clear multi-select when single-selecting
    selectedGroupId: null, // clear group selection
    selectedRelationshipId: null, // clear relationship selection
  }),

  toggleContextSelection: (contextId) => set((state) => {
    const isSelected = state.selectedContextIds.includes(contextId)
    return {
      selectedContextId: null, // clear single selection
      selectedGroupId: null, // clear group selection
      selectedRelationshipId: null, // clear relationship selection
      selectedContextIds: isSelected
        ? state.selectedContextIds.filter(id => id !== contextId)
        : [...state.selectedContextIds, contextId],
    }
  }),

  clearContextSelection: () => set({
    selectedContextIds: [],
    selectedContextId: null,
    selectedGroupId: null,
    selectedRelationshipId: null,
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

    // Determine project origin
    let origin: 'sample' | 'empty' | 'imported' | 'continued' = 'continued'
    if (projectId === 'acme-ecommerce' || projectId === 'cbioportal' || projectId === 'elan-warranty') {
      origin = 'sample'
    } else if (projectId === 'empty-project') {
      origin = 'empty'
    } else if (state.activeProjectId === null) {
      // First time loading this project
      origin = 'imported'
    }

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
      selectedContextIds: [],
      undoStack: [],
      redoStack: [],
    }
  }),

  addContext: (name) => set((state) => {
    const result = addContextAction(state, name)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  deleteContext: (contextId) => set((state) => {
    const result = deleteContextAction(state, contextId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

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

    // Autosave
    autosaveProject(projectId, updatedProject)

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

    // Autosave
    autosaveProject(projectId, updatedProject)

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

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateGroup: (groupId, updates) => set((state) => {
    const result = updateGroupAction(state, groupId, updates)

    // Autosave (text edits are not undoable per SPEC pattern)
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  deleteGroup: (groupId) => set((state) => {
    const result = deleteGroupAction(state, groupId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  removeContextFromGroup: (groupId, contextId) => set((state) => {
    const result = removeContextFromGroupAction(state, groupId, contextId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  addContextToGroup: (groupId, contextId) => set((state) => {
    const result = addContextToGroupAction(state, groupId, contextId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  addContextsToGroup: (groupId, contextIds) => set((state) => {
    const result = addContextsToGroupAction(state, groupId, contextIds)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  addRelationship: (fromContextId, toContextId, pattern, description) => set((state) => {
    const result = addRelationshipAction(state, fromContextId, toContextId, pattern, description)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  deleteRelationship: (relationshipId) => set((state) => {
    const result = deleteRelationshipAction(state, relationshipId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateRelationship: (relationshipId, updates) => set((state) => {
    const result = updateRelationshipAction(state, relationshipId, updates)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  setSelectedRelationship: (relationshipId) => set({
    selectedRelationshipId: relationshipId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedActorId: null,
    selectedUserNeedId: null,
  }),

  addActor: (name) => set((state) => {
    const result = addActorAction(state, name)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  deleteActor: (actorId) => set((state) => {
    const result = deleteActorAction(state, actorId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateActor: (actorId, updates) => set((state) => {
    const result = updateActorAction(state, actorId, updates)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateActorPosition: (actorId, newPosition) => set((state) => {
    const result = updateActorPositionAction(state, actorId, newPosition)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  setSelectedActor: (actorId) => set({
    selectedActorId: actorId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedRelationshipId: null,
    selectedUserNeedId: null,
  }),

  createActorConnection: (actorId, contextId) => set((state) => {
    const result = createActorConnectionAction(state, actorId, contextId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  deleteActorConnection: (connectionId) => set((state) => {
    const result = deleteActorConnectionAction(state, connectionId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateActorConnection: (connectionId, updates) => set((state) => {
    const result = updateActorConnectionAction(state, connectionId, updates)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  addUserNeed: (name) => {
    const state = useEditorStore.getState()
    const { newState, newUserNeedId } = addUserNeedAction(state, name)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && newState.projects) {
      autosaveProject(projectId, newState.projects[projectId])
    }

    useEditorStore.setState(newState)

    return newUserNeedId
  },

  deleteUserNeed: (userNeedId) => set((state) => {
    const result = deleteUserNeedAction(state, userNeedId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateUserNeed: (userNeedId, updates) => set((state) => {
    const result = updateUserNeedAction(state, userNeedId, updates)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateUserNeedPosition: (userNeedId, newPosition) => set((state) => {
    const result = updateUserNeedPositionAction(state, userNeedId, newPosition)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  setSelectedUserNeed: (userNeedId) => set({
    selectedUserNeedId: userNeedId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedRelationshipId: null,
    selectedActorId: null,
  }),

  createActorNeedConnection: (actorId, userNeedId) => {
    const state = useEditorStore.getState()
    const { newState, newConnectionId } = createActorNeedConnectionAction(state, actorId, userNeedId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && newState.projects) {
      autosaveProject(projectId, newState.projects[projectId])
    }

    useEditorStore.setState(newState)

    return newConnectionId
  },

  deleteActorNeedConnection: (connectionId) => set((state) => {
    const result = deleteActorNeedConnectionAction(state, connectionId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateActorNeedConnection: (connectionId, updates) => set((state) => {
    const result = updateActorNeedConnectionAction(state, connectionId, updates)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  createNeedContextConnection: (userNeedId, contextId) => {
    const state = useEditorStore.getState()
    const { newState, newConnectionId } = createNeedContextConnectionAction(state, userNeedId, contextId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && newState.projects) {
      autosaveProject(projectId, newState.projects[projectId])
    }

    useEditorStore.setState(newState)

    return newConnectionId
  },

  deleteNeedContextConnection: (connectionId) => set((state) => {
    const result = deleteNeedContextConnectionAction(state, connectionId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateNeedContextConnection: (connectionId, updates) => set((state) => {
    const result = updateNeedContextConnectionAction(state, connectionId, updates)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

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
      const isDuplicate = stages.some((s, i) => i !== index && s.label === newLabel)
      if (isDuplicate) {
        throw new Error('Stage label must be unique')
      }
    }

    if (newPosition !== oldStage.position) {
      const isDuplicate = stages.some((s, i) => i !== index && s.position === newPosition)
      if (isDuplicate) {
        throw new Error('Stage position must be unique')
      }
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

    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  addFlowStage: (label, position) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const stages = project.viewConfig.flowStages

    const labelExists = stages.some(s => s.label === label)
    if (labelExists) {
      throw new Error('Stage label must be unique')
    }

    const positionExists = stages.some(s => s.position === position)
    if (positionExists) {
      throw new Error('Stage position must be unique')
    }

    const newStage = { label, position }
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

    // Track analytics
    trackEvent('flow_stage_created', updatedProject, {
      entity_type: 'flow_stage',
      metadata: {
        label: newStage.label,
        position: newStage.position
      }
    })

    autosaveProject(projectId, updatedProject)

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

    // Track analytics
    trackEvent('flow_stage_deleted', project, {
      entity_type: 'flow_stage',
      metadata: {
        label: deletedStage.label,
        position: deletedStage.position
      }
    })

    autosaveProject(projectId, updatedProject)

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
    autosaveProject(projectId, updatedProject)

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
    autosaveProject(projectId, updatedProject)

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
    // Ensure backwards compatibility with projects that don't have actors/actorConnections
    if (!project.actors) project.actors = []
    if (!project.actorConnections) project.actorConnections = []

    // Migrate contexts to include distillation position and evolution stage if missing
    project.contexts = project.contexts.map(context => {
      const needsDistillation = !context.positions.distillation
      const needsEvolution = !context.evolutionStage

      if (needsDistillation || needsEvolution) {
        return {
          ...context,
          positions: {
            ...context.positions,
            distillation: context.positions.distillation || { x: 50, y: 50 },
          },
          strategicClassification: context.strategicClassification || 'supporting',
          evolutionStage: context.evolutionStage || classifyFromStrategicPosition(context.positions.strategic.x),
        }
      }
      return context
    })

    // Track analytics
    const fileSize = JSON.stringify(project).length / 1024 // KB
    trackEvent('project_imported', project, {
      file_size_kb: Math.round(fileSize),
      context_count: project.contexts.length,
      relationship_count: project.relationships.length,
      group_count: project.groups.length,
      keyframe_count: project.temporal?.keyframes.length || 0,
      actor_count: project.actors.length,
      need_count: project.userNeeds.length
    })

    // Autosave imported project
    autosaveProject(project.id, project)

    return {
      projects: {
        ...state.projects,
        [project.id]: project,
      },
      activeProjectId: project.id,
      selectedContextId: null,
      selectedActorId: null,
      selectedUserNeedId: null,
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
    selectedContextIds: [],
    undoStack: [],
    redoStack: [],
  }),

  // Temporal actions
  toggleTemporalMode: () => set((state) => {
    const result = toggleTemporalModeAction(state)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  setCurrentDate: (date) => set((state) => ({
    temporal: {
      ...state.temporal,
      currentDate: date,
    },
  })),

  setActiveKeyframe: (keyframeId) => set((state) => {
    // When entering keyframe mode (locking), save current visibility and hide both
    // When exiting keyframe mode (unlocking), restore previous visibility
    if (keyframeId && !state.temporal.activeKeyframeId) {
      // Entering keyframe mode - save state and hide
      return {
        temporal: {
          ...state.temporal,
          activeKeyframeId: keyframeId,
          savedShowGroups: state.showGroups,
          savedShowRelationships: state.showRelationships,
        },
        showGroups: false,
        showRelationships: false,
      }
    } else if (!keyframeId && state.temporal.activeKeyframeId) {
      // Exiting keyframe mode - restore state
      return {
        temporal: {
          ...state.temporal,
          activeKeyframeId: keyframeId,
        },
        showGroups: state.temporal.savedShowGroups ?? state.showGroups,
        showRelationships: state.temporal.savedShowRelationships ?? state.showRelationships,
      }
    } else {
      // Just switching between keyframes or redundant call
      return {
        temporal: {
          ...state.temporal,
          activeKeyframeId: keyframeId,
        },
      }
    }
  }),

  addKeyframe: (date, label) => {
    const state = useEditorStore.getState()
    const { newState, newKeyframeId } = addKeyframeAction(state, date, label)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && newState.projects) {
      autosaveProject(projectId, newState.projects[projectId])
    }

    useEditorStore.setState(newState)

    return newKeyframeId
  },

  deleteKeyframe: (keyframeId) => set((state) => {
    const result = deleteKeyframeAction(state, keyframeId)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateKeyframe: (keyframeId, updates) => set((state) => {
    const result = updateKeyframeAction(state, keyframeId, updates)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),

  updateKeyframeContextPosition: (keyframeId, contextId, x, y) => set((state) => {
    const result = updateKeyframeContextPositionAction(state, keyframeId, contextId, x, y)

    // Autosave
    const projectId = state.activeProjectId
    if (projectId && result.projects) {
      autosaveProject(projectId, result.projects[projectId])
    }

    return result
  }),
}))

// Load saved projects from IndexedDB on startup
Promise.all(
  BUILT_IN_PROJECTS.map(project => loadProject(project.id))
).then((savedProjects) => {
  const projects: Record<string, Project> = {}

  // For each built-in project, use saved version if available, otherwise use the default
  BUILT_IN_PROJECTS.forEach((defaultProject, index) => {
    const savedProject = savedProjects[index]
    if (savedProject) {
      projects[savedProject.id] = savedProject
    } else {
      projects[defaultProject.id] = defaultProject
    }
  })

  useEditorStore.setState({ projects })
}).catch(err => {
  console.error('Failed to load projects from IndexedDB:', err)
})
