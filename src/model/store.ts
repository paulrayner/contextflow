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
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const newRelationship = {
      id: `rel-${Date.now()}`,
      fromContextId,
      toContextId,
      pattern,
      description,
    }

    const command: EditorCommand = {
      type: 'addRelationship',
      payload: {
        relationship: newRelationship,
      },
    }

    const updatedProject = {
      ...project,
      relationships: [...project.relationships, newRelationship],
    }

    // Track analytics
    trackEvent('relationship_added', updatedProject, {
      entity_type: 'relationship',
      entity_id: newRelationship.id,
      metadata: {
        pattern,
        from_context_id: fromContextId,
        to_context_id: toContextId
      }
    })

    // Track FTUE milestone: first relationship added
    trackFTUEMilestone('first_relationship_added', updatedProject)

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

  deleteRelationship: (relationshipId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const relationship = project.relationships.find(r => r.id === relationshipId)
    if (!relationship) return state

    const command: EditorCommand = {
      type: 'deleteRelationship',
      payload: {
        relationship,
      },
    }

    const updatedProject = {
      ...project,
      relationships: project.relationships.filter(r => r.id !== relationshipId),
    }

    // Track analytics
    trackEvent('relationship_deleted', project, {
      entity_type: 'relationship',
      entity_id: relationshipId,
      metadata: {
        pattern: relationship.pattern,
        from_context_id: relationship.fromContextId,
        to_context_id: relationship.toContextId
      }
    })

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

  updateRelationship: (relationshipId, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const relationshipIndex = project.relationships.findIndex(r => r.id === relationshipId)
    if (relationshipIndex === -1) return state

    const oldRelationship = project.relationships[relationshipIndex]
    const newRelationship = { ...oldRelationship, ...updates }

    const updatedRelationships = [...project.relationships]
    updatedRelationships[relationshipIndex] = newRelationship

    const updatedProject = {
      ...project,
      relationships: updatedRelationships,
    }

    // Track property changes
    if (updates.pattern && updates.pattern !== oldRelationship.pattern) {
      trackPropertyChange(
        'relationship_pattern_changed',
        updatedProject,
        'relationship',
        relationshipId,
        'pattern',
        oldRelationship.pattern,
        updates.pattern
      )
    }

    if (updates.communicationMode !== undefined && updates.communicationMode !== oldRelationship.communicationMode) {
      trackTextFieldEdit(
        updatedProject,
        'relationship',
        'communicationMode',
        oldRelationship.communicationMode,
        updates.communicationMode,
        'inspector'
      )
    }

    if (updates.description !== undefined && updates.description !== oldRelationship.description) {
      trackTextFieldEdit(
        updatedProject,
        'relationship',
        'description',
        oldRelationship.description,
        updates.description,
        'inspector'
      )
    }

    const patternChanged = updates.pattern !== undefined && updates.pattern !== oldRelationship.pattern

    if (patternChanged) {
      const command: EditorCommand = {
        type: 'updateRelationship',
        payload: {
          relationshipId,
          oldRelationship,
          newRelationship,
        },
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
    } else {
      autosaveProject(projectId, updatedProject)

      return {
        projects: {
          ...state.projects,
          [projectId]: updatedProject,
        },
      }
    }
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
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const newActor: Actor = {
      id: `actor-${Date.now()}`,
      name,
      position: 50,
    }

    const command: EditorCommand = {
      type: 'addActor',
      payload: {
        actor: newActor,
      },
    }

    const updatedProject = {
      ...project,
      actors: [...(project.actors || []), newActor],
    }

    // Track analytics
    trackEvent('actor_added', updatedProject, {
      entity_type: 'actor',
      entity_id: newActor.id
    })

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedActorId: newActor.id,
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  deleteActor: (actorId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const actor = project.actors?.find(a => a.id === actorId)
    if (!actor) return state

    const command: EditorCommand = {
      type: 'deleteActor',
      payload: {
        actor,
      },
    }

    // Also delete any actor connections for this actor
    const updatedActorConnections = (project.actorConnections || []).filter(
      ac => ac.actorId !== actorId
    )

    const updatedProject = {
      ...project,
      actors: project.actors.filter(a => a.id !== actorId),
      actorConnections: updatedActorConnections,
    }

    // Track analytics
    const connectionCount = (project.actorConnections || []).filter(
      ac => ac.actorId === actorId
    ).length
    trackEvent('actor_deleted', project, {
      entity_type: 'actor',
      entity_id: actorId,
      metadata: {
        connection_count: connectionCount
      }
    })

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedActorId: state.selectedActorId === actorId ? null : state.selectedActorId,
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  updateActor: (actorId, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const actorIndex = project.actors?.findIndex(a => a.id === actorId) ?? -1
    if (actorIndex === -1) return state

    const updatedActors = [...(project.actors || [])]
    updatedActors[actorIndex] = {
      ...updatedActors[actorIndex],
      ...updates,
    }

    const updatedProject = {
      ...project,
      actors: updatedActors,
    }

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
    }
  }),

  updateActorPosition: (actorId, newPosition) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const actorIndex = project.actors?.findIndex(a => a.id === actorId) ?? -1
    if (actorIndex === -1) return state

    const actor = project.actors[actorIndex]
    const oldPosition = actor.position

    const updatedActors = [...(project.actors || [])]
    updatedActors[actorIndex] = {
      ...updatedActors[actorIndex],
      position: newPosition,
    }

    const updatedProject = {
      ...project,
      actors: updatedActors,
    }

    // Add to undo stack
    const command: EditorCommand = {
      type: 'moveActor',
      payload: {
        actorId,
        oldPosition,
        newPosition,
      },
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

  setSelectedActor: (actorId) => set({
    selectedActorId: actorId,
    selectedContextId: null,
    selectedContextIds: [],
    selectedGroupId: null,
    selectedRelationshipId: null,
    selectedUserNeedId: null,
  }),

  createActorConnection: (actorId, contextId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const newConnection: ActorConnection = {
      id: `actor-conn-${Date.now()}`,
      actorId,
      contextId,
    }

    const command: EditorCommand = {
      type: 'addActorConnection',
      payload: {
        actorConnection: newConnection,
      },
    }

    const updatedProject = {
      ...project,
      actorConnections: [...(project.actorConnections || []), newConnection],
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

  deleteActorConnection: (connectionId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const connection = project.actorConnections?.find(ac => ac.id === connectionId)
    if (!connection) return state

    const command: EditorCommand = {
      type: 'deleteActorConnection',
      payload: {
        actorConnection: connection,
      },
    }

    const updatedProject = {
      ...project,
      actorConnections: (project.actorConnections || []).filter(ac => ac.id !== connectionId),
    }

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedActorConnectionId: state.selectedActorConnectionId === connectionId ? null : state.selectedActorConnectionId,
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  updateActorConnection: (connectionId, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const connectionIndex = project.actorConnections?.findIndex(ac => ac.id === connectionId) ?? -1
    if (connectionIndex === -1) return state

    const updatedConnections = [...(project.actorConnections || [])]
    updatedConnections[connectionIndex] = {
      ...updatedConnections[connectionIndex],
      ...updates,
    }

    const updatedProject = {
      ...project,
      actorConnections: updatedConnections,
    }

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
    }
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

    const updatedProject = {
      ...project,
      userNeeds: [...(project.userNeeds || []), newUserNeed],
    }

    // Track analytics
    trackEvent('user_need_added', updatedProject, {
      entity_type: 'user_need',
      entity_id: newUserNeed.id
    })

    autosaveProject(projectId, updatedProject)

    useEditorStore.setState({
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedUserNeedId: newUserNeed.id,
    })

    return newUserNeed.id
  },

  deleteUserNeed: (userNeedId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const updatedProject = {
      ...project,
      userNeeds: (project.userNeeds || []).filter(n => n.id !== userNeedId),
      actorNeedConnections: (project.actorNeedConnections || []).filter(c => c.userNeedId !== userNeedId),
      needContextConnections: (project.needContextConnections || []).filter(c => c.userNeedId !== userNeedId),
    }

    // Track analytics
    const actorConnectionCount = (project.actorNeedConnections || []).filter(c => c.userNeedId === userNeedId).length
    const contextConnectionCount = (project.needContextConnections || []).filter(c => c.userNeedId === userNeedId).length
    trackEvent('user_need_deleted', project, {
      entity_type: 'user_need',
      entity_id: userNeedId,
      metadata: {
        actor_connection_count: actorConnectionCount,
        context_connection_count: contextConnectionCount
      }
    })

    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedUserNeedId: state.selectedUserNeedId === userNeedId ? null : state.selectedUserNeedId,
    }
  }),

  updateUserNeed: (userNeedId, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const needIndex = project.userNeeds?.findIndex(n => n.id === userNeedId) ?? -1
    if (needIndex === -1) return state

    const updatedNeeds = [...(project.userNeeds || [])]
    updatedNeeds[needIndex] = {
      ...updatedNeeds[needIndex],
      ...updates,
    }

    const updatedProject = {
      ...project,
      userNeeds: updatedNeeds,
    }

    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
    }
  }),

  updateUserNeedPosition: (userNeedId, newPosition) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const needIndex = project.userNeeds?.findIndex(n => n.id === userNeedId) ?? -1
    if (needIndex === -1) return state

    const updatedNeeds = [...(project.userNeeds || [])]
    const oldPosition = updatedNeeds[needIndex].position

    updatedNeeds[needIndex] = {
      ...updatedNeeds[needIndex],
      position: newPosition,
    }

    const updatedProject = {
      ...project,
      userNeeds: updatedNeeds,
    }

    const command: EditorCommand = {
      type: 'moveUserNeed',
      payload: {
        userNeedId,
        oldPosition,
        newPosition,
      },
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
    const projectId = state.activeProjectId
    if (!projectId) return null

    const project = state.projects[projectId]
    if (!project) return null

    const newConnection: ActorNeedConnection = {
      id: `actor-need-conn-${Date.now()}`,
      actorId,
      userNeedId,
    }

    const command: EditorCommand = {
      type: 'addActorNeedConnection',
      payload: {
        actorNeedConnection: newConnection,
      },
    }

    const updatedProject = {
      ...project,
      actorNeedConnections: [...(project.actorNeedConnections || []), newConnection],
    }

    // Track analytics
    trackEvent('actor_need_connection_created', updatedProject, {
      entity_type: 'actor_need_connection',
      entity_id: newConnection.id,
      metadata: {
        actor_id: actorId,
        user_need_id: userNeedId
      }
    })

    autosaveProject(projectId, updatedProject)

    useEditorStore.setState({
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    })

    return newConnection.id
  },

  deleteActorNeedConnection: (connectionId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const connection = project.actorNeedConnections?.find(c => c.id === connectionId)
    if (!connection) return state

    const command: EditorCommand = {
      type: 'deleteActorNeedConnection',
      payload: {
        actorNeedConnection: connection,
      },
    }

    const updatedProject = {
      ...project,
      actorNeedConnections: (project.actorNeedConnections || []).filter(c => c.id !== connectionId),
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

  updateActorNeedConnection: (connectionId, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const connectionIndex = project.actorNeedConnections?.findIndex(c => c.id === connectionId) ?? -1
    if (connectionIndex === -1) return state

    const updatedConnections = [...(project.actorNeedConnections || [])]
    updatedConnections[connectionIndex] = {
      ...updatedConnections[connectionIndex],
      ...updates,
    }

    const updatedProject = {
      ...project,
      actorNeedConnections: updatedConnections,
    }

    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
    }
  }),

  createNeedContextConnection: (userNeedId, contextId) => {
    const state = useEditorStore.getState()
    const projectId = state.activeProjectId
    if (!projectId) return null

    const project = state.projects[projectId]
    if (!project) return null

    const newConnection: NeedContextConnection = {
      id: `need-context-conn-${Date.now()}`,
      userNeedId,
      contextId,
    }

    const command: EditorCommand = {
      type: 'addNeedContextConnection',
      payload: {
        needContextConnection: newConnection,
      },
    }

    const updatedProject = {
      ...project,
      needContextConnections: [...(project.needContextConnections || []), newConnection],
    }

    // Track analytics
    trackEvent('need_context_connection_created', updatedProject, {
      entity_type: 'need_context_connection',
      entity_id: newConnection.id,
      metadata: {
        user_need_id: userNeedId,
        context_id: contextId
      }
    })

    autosaveProject(projectId, updatedProject)

    useEditorStore.setState({
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    })

    return newConnection.id
  },

  deleteNeedContextConnection: (connectionId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const connection = project.needContextConnections?.find(c => c.id === connectionId)
    if (!connection) return state

    const command: EditorCommand = {
      type: 'deleteNeedContextConnection',
      payload: {
        needContextConnection: connection,
      },
    }

    const updatedProject = {
      ...project,
      needContextConnections: (project.needContextConnections || []).filter(c => c.id !== connectionId),
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

  updateNeedContextConnection: (connectionId, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const connectionIndex = project.needContextConnections?.findIndex(c => c.id === connectionId) ?? -1
    if (connectionIndex === -1) return state

    const updatedConnections = [...(project.needContextConnections || [])]
    updatedConnections[connectionIndex] = {
      ...updatedConnections[connectionIndex],
      ...updates,
    }

    const updatedProject = {
      ...project,
      needContextConnections: updatedConnections,
    }

    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
    }
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
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const currentlyEnabled = project.temporal?.enabled || false

    const updatedProject = {
      ...project,
      temporal: {
        enabled: !currentlyEnabled,
        keyframes: project.temporal?.keyframes || [],
      },
    }

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
    }
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
    const projectId = state.activeProjectId
    if (!projectId) return null

    const project = state.projects[projectId]
    if (!project) return null

    // Validate date format
    const dateRegex = /^\d{4}(-Q[1-4])?$/
    if (!dateRegex.test(date)) {
      console.error('Invalid keyframe date format:', date)
      return null
    }

    // Check for duplicate date
    const existingKeyframes = project.temporal?.keyframes || []
    if (existingKeyframes.some(kf => kf.date === date)) {
      console.error('Duplicate keyframe date:', date)
      return null
    }

    // Warn if keyframe is more than 10 years in the future
    const currentYear = new Date().getFullYear()
    const keyframeYear = parseInt(date.split('-')[0])
    if (keyframeYear - currentYear > 10) {
      console.warn(`Keyframe date ${date} is more than 10 years in the future`)
    }

    // Capture current Strategic View positions for all contexts
    const positions: { [contextId: string]: { x: number; y: number } } = {}
    project.contexts.forEach(context => {
      positions[context.id] = {
        x: context.positions.strategic.x,
        y: context.positions.shared.y,
      }
    })

    // If this is the first keyframe and it's in the future, auto-create a "Now" keyframe
    const keyframesToAdd: TemporalKeyframe[] = []
    const currentYearStr = currentYear.toString()
    const isFirstKeyframe = existingKeyframes.length === 0
    const isFutureKeyframe = keyframeYear > currentYear
    const needsCurrentYearKeyframe = isFirstKeyframe && isFutureKeyframe && date !== currentYearStr

    if (needsCurrentYearKeyframe) {
      // Create implicit "Now" keyframe at current year with current positions
      const nowKeyframe: TemporalKeyframe = {
        id: `keyframe-${Date.now()}-now`,
        date: currentYearStr,
        label: 'Current',
        positions: { ...positions }, // Same positions as we just captured
        activeContextIds: project.contexts.map(c => c.id),
      }
      keyframesToAdd.push(nowKeyframe)
    }

    const newKeyframe: TemporalKeyframe = {
      id: `keyframe-${Date.now()}`,
      date,
      label,
      positions,
      activeContextIds: project.contexts.map(c => c.id),
    }
    keyframesToAdd.push(newKeyframe)

    const updatedKeyframes = [...existingKeyframes, ...keyframesToAdd].sort((a, b) => {
      // Sort by date (simple string comparison works for "YYYY" and "YYYY-QN" formats)
      return a.date.localeCompare(b.date)
    })

    const updatedProject = {
      ...project,
      temporal: {
        enabled: project.temporal?.enabled || true,
        keyframes: updatedKeyframes,
      },
    }

    const command: EditorCommand = {
      type: 'createKeyframe',
      payload: {
        keyframes: keyframesToAdd, // Store all keyframes created (may include implicit "Now" keyframe)
      },
    }

    // Track analytics
    trackEvent('keyframe_created', updatedProject, {
      entity_type: 'keyframe',
      entity_id: newKeyframe.id,
      metadata: {
        date: newKeyframe.date,
        context_count: Object.keys(newKeyframe.positions).length,
        auto_created_now_keyframe: keyframesToAdd.length > 1
      }
    })

    // Autosave
    autosaveProject(projectId, updatedProject)

    set({
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    })

    return newKeyframe.id
  },

  deleteKeyframe: (keyframeId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project || !project.temporal) return state

    const keyframeToDelete = project.temporal.keyframes.find(kf => kf.id === keyframeId)
    if (!keyframeToDelete) return state

    const command: EditorCommand = {
      type: 'deleteKeyframe',
      payload: {
        keyframe: keyframeToDelete,
      },
    }

    const updatedProject = {
      ...project,
      temporal: {
        ...project.temporal,
        keyframes: project.temporal.keyframes.filter(kf => kf.id !== keyframeId),
      },
    }

    // Track analytics
    trackEvent('keyframe_deleted', project, {
      entity_type: 'keyframe',
      entity_id: keyframeId,
      metadata: {
        date: keyframeToDelete.date
      }
    })

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

  updateKeyframe: (keyframeId, updates) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project || !project.temporal) return state

    const oldKeyframe = project.temporal.keyframes.find(kf => kf.id === keyframeId)
    if (!oldKeyframe) return state

    const command: EditorCommand = {
      type: 'updateKeyframe',
      payload: {
        keyframeId,
        oldKeyframeData: { ...oldKeyframe },
        newKeyframeData: updates,
      },
    }

    const updatedKeyframes = project.temporal.keyframes.map(kf =>
      kf.id === keyframeId ? { ...kf, ...updates } : kf
    ).sort((a, b) => a.date.localeCompare(b.date))

    const updatedProject = {
      ...project,
      temporal: {
        ...project.temporal,
        keyframes: updatedKeyframes,
      },
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

  updateKeyframeContextPosition: (keyframeId, contextId, x, y) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project || !project.temporal) return state

    const keyframe = project.temporal.keyframes.find(kf => kf.id === keyframeId)
    if (!keyframe) return state

    const oldPosition = keyframe.positions[contextId]

    const command: EditorCommand = {
      type: 'moveContextInKeyframe',
      payload: {
        keyframeId,
        contextId,
        oldPositions: oldPosition ? {
          flow: { x: 0 },
          strategic: { x: oldPosition.x },
          distillation: { x: 0, y: 0 },
          shared: { y: oldPosition.y }
        } : undefined,
        newPositions: {
          flow: { x: 0 },
          strategic: { x },
          distillation: { x: 0, y: 0 },
          shared: { y }
        },
      },
    }

    const updatedKeyframes = project.temporal.keyframes.map(kf => {
      if (kf.id === keyframeId) {
        return {
          ...kf,
          positions: {
            ...kf.positions,
            [contextId]: { x, y },
          },
        }
      }
      return kf
    })

    const updatedProject = {
      ...project,
      temporal: {
        ...project.temporal,
        keyframes: updatedKeyframes,
      },
    }

    // Track analytics
    trackEvent('keyframe_context_position_changed', updatedProject, {
      entity_type: 'keyframe',
      entity_id: keyframeId,
      metadata: {
        context_id: contextId,
        keyframe_id: keyframeId
      }
    })

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
