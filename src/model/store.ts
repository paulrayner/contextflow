import { create } from 'zustand'
import type { Project, BoundedContext, Actor, ActorConnection, TemporalKeyframe } from './types'
import demoProject from '../../examples/sample.project.json'
import cbioportalProject from '../../examples/cbioportal.project.json'
import { saveProject, loadProject } from './persistence'
import { config } from '../config'

export type ViewMode = 'flow' | 'strategic' | 'distillation'

// Classification logic based on distillation position
export function classifyFromDistillationPosition(x: number, y: number): 'core' | 'supporting' | 'generic' {
  // x = Business Differentiation (0-100, horizontal)
  // y = Model Complexity (0-100, vertical)

  if (x < 33) {
    // Low differentiation (left column)
    return 'generic'
  } else if (x >= 67 && y >= 50) {
    // High differentiation, high complexity (top-right)
    return 'core'
  } else {
    // Everything else (middle + bottom-right)
    return 'supporting'
  }
}

// Evolution classification based on strategic position (Wardley evolution axis)
export function classifyFromStrategicPosition(x: number): 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility' {
  // x = Evolution (0-100, horizontal on Strategic View)
  // Divide into 4 equal zones matching Wardley evolution stages

  if (x < 25) {
    return 'genesis'
  } else if (x < 50) {
    return 'custom-built'
  } else if (x < 75) {
    return 'product/rental'
  } else {
    return 'commodity/utility'
  }
}

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

interface EditorCommand {
  type: 'moveContext' | 'moveContextGroup' | 'addContext' | 'deleteContext' | 'assignRepo' | 'unassignRepo' | 'addGroup' | 'deleteGroup' | 'removeFromGroup' | 'addRelationship' | 'deleteRelationship' | 'updateRelationship' | 'addActor' | 'deleteActor' | 'moveActor' | 'addActorConnection' | 'deleteActorConnection' | 'createKeyframe' | 'deleteKeyframe' | 'moveContextInKeyframe' | 'updateKeyframe' | 'updateFlowStage' | 'addFlowStage' | 'deleteFlowStage'
  payload: {
    contextId?: string
    contextIds?: string[]
    oldPositions?: BoundedContext['positions']
    newPositions?: BoundedContext['positions']
    positionsMap?: Record<string, { old: BoundedContext['positions'], new: BoundedContext['positions'] }>
    context?: BoundedContext
    repoId?: string
    oldContextId?: string
    newContextId?: string
    group?: any
    groupId?: string
    relationship?: any
    relationshipId?: string
    actor?: Actor
    actorId?: string
    oldPosition?: number
    newPosition?: number
    actorConnection?: ActorConnection
    actorConnectionId?: string
    keyframe?: TemporalKeyframe
    keyframes?: TemporalKeyframe[] // For commands that create multiple keyframes
    keyframeId?: string
    oldKeyframeData?: Partial<TemporalKeyframe>
    newKeyframeData?: Partial<TemporalKeyframe>
    flowStageIndex?: number
    flowStage?: { label: string; position: number }
    oldFlowStage?: { label: string; position: number }
    newFlowStage?: { label: string; position: number }
    oldRelationship?: any
    newRelationship?: any
  }
}

interface EditorState {
  activeProjectId: string | null
  projects: Record<string, Project>

  activeViewMode: ViewMode

  selectedContextId: string | null
  selectedRelationshipId: string | null
  selectedGroupId: string | null
  selectedActorId: string | null
  selectedActorConnectionId: string | null
  selectedContextIds: string[] // for multi-select

  canvasView: {
    flow: { zoom: number; panX: number; panY: number }
    strategic: { zoom: number; panX: number; panY: number }
    distillation: { zoom: number; panX: number; panY: number }
  }

  // View filters
  showGroups: boolean
  showRelationships: boolean

  // UI preferences
  groupOpacity: number

  // Temporal state
  temporal: {
    currentDate: string | null // Current slider position ("2027" or "2027-Q2")
    activeKeyframeId: string | null // Currently locked keyframe for editing
    savedShowGroups?: boolean // Saved group visibility when entering keyframe mode
    savedShowRelationships?: boolean // Saved relationship visibility when entering keyframe mode
  }

  undoStack: EditorCommand[]
  redoStack: EditorCommand[]

  // Temporal actions
  toggleTemporalMode: () => void
  setCurrentDate: (date: string | null) => void
  setActiveKeyframe: (keyframeId: string | null) => void
  addKeyframe: (date: string, label?: string) => string | null
  deleteKeyframe: (keyframeId: string) => void
  updateKeyframe: (keyframeId: string, updates: Partial<TemporalKeyframe>) => void
  updateKeyframeContextPosition: (keyframeId: string, contextId: string, x: number, y: number) => void

  // Actions
  updateContext: (contextId: string, updates: Partial<BoundedContext>) => void
  updateContextPosition: (contextId: string, newPositions: BoundedContext['positions']) => void
  updateMultipleContextPositions: (positionsMap: Record<string, BoundedContext['positions']>) => void
  setSelectedContext: (contextId: string | null) => void
  toggleContextSelection: (contextId: string) => void
  clearContextSelection: () => void
  setViewMode: (mode: ViewMode) => void
  setActiveProject: (projectId: string) => void
  addContext: (name: string) => void
  deleteContext: (contextId: string) => void
  assignRepoToContext: (repoId: string, contextId: string) => void
  unassignRepo: (repoId: string) => void
  createGroup: (label: string, color?: string, notes?: string) => void
  deleteGroup: (groupId: string) => void
  removeContextFromGroup: (groupId: string, contextId: string) => void
  addRelationship: (fromContextId: string, toContextId: string, pattern: string, description?: string) => void
  deleteRelationship: (relationshipId: string) => void
  updateRelationship: (relationshipId: string, updates: Partial<{ pattern: string; communicationMode: string; description: string }>) => void
  setSelectedRelationship: (relationshipId: string | null) => void
  addActor: (name: string) => void
  deleteActor: (actorId: string) => void
  updateActor: (actorId: string, updates: Partial<Actor>) => void
  updateActorPosition: (actorId: string, newPosition: number) => void
  setSelectedActor: (actorId: string | null) => void
  createActorConnection: (actorId: string, contextId: string) => void
  deleteActorConnection: (connectionId: string) => void
  updateActorConnection: (connectionId: string, updates: Partial<ActorConnection>) => void
  toggleShowGroups: () => void
  toggleShowRelationships: () => void
  setGroupOpacity: (opacity: number) => void
  updateFlowStage: (index: number, updates: Partial<{ label: string; position: number }>) => void
  addFlowStage: (label: string, position: number) => void
  deleteFlowStage: (index: number) => void
  undo: () => void
  redo: () => void
  fitToMap: () => void
  exportProject: () => void
  importProject: (project: Project) => void
  reset: () => void
}

// Basic initialization with both demo and cbioportal projects in memory
// Both projects will be saved to IndexedDB on first load
const sampleProject = demoProject as Project
const cbioportal = cbioportalProject as Project

// Ensure projects have actors and actorConnections arrays (for backwards compatibility)
if (!sampleProject.actors) sampleProject.actors = []
if (!sampleProject.actorConnections) sampleProject.actorConnections = []
if (!cbioportal.actors) cbioportal.actors = []
if (!cbioportal.actorConnections) cbioportal.actorConnections = []

// Migrate contexts to include distillation position and evolution stage if missing
sampleProject.contexts = sampleProject.contexts.map(context => {
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

cbioportal.contexts = cbioportal.contexts.map(context => {
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

// Save both projects to IndexedDB asynchronously
saveProject(sampleProject).catch((err) => {
  console.error('Failed to save sample project:', err)
})
saveProject(cbioportal).catch((err) => {
  console.error('Failed to save cbioportal project:', err)
})

// Get last active project from localStorage, or default to sample
const storedProjectId = localStorage.getItem('contextflow.activeProjectId')
const initialActiveProjectId = storedProjectId || sampleProject.id

export const useEditorStore = create<EditorState>((set) => ({
  activeProjectId: initialActiveProjectId,
  projects: {
    [sampleProject.id]: sampleProject,
    [cbioportal.id]: cbioportal,
  },

  activeViewMode: 'flow',

  selectedContextId: null,
  selectedRelationshipId: null,
  selectedGroupId: null,
  selectedActorId: null,
  selectedActorConnectionId: null,
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
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const contextIndex = project.contexts.findIndex(c => c.id === contextId)
    if (contextIndex === -1) return state

    const updatedContexts = [...project.contexts]
    updatedContexts[contextIndex] = {
      ...updatedContexts[contextIndex],
      ...updates,
    }

    const updatedProject = {
      ...project,
      contexts: updatedContexts,
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

  updateContextPosition: (contextId, newPositions) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const contextIndex = project.contexts.findIndex(c => c.id === contextId)
    if (contextIndex === -1) return state

    const oldContext = project.contexts[contextIndex]
    const oldPositions = oldContext.positions

    // Auto-classify based on distillation position
    const newClassification = classifyFromDistillationPosition(
      newPositions.distillation.x,
      newPositions.distillation.y
    )

    // Auto-classify evolution based on strategic position
    const newEvolution = classifyFromStrategicPosition(newPositions.strategic.x)

    const updatedContexts = [...project.contexts]
    updatedContexts[contextIndex] = {
      ...updatedContexts[contextIndex],
      positions: newPositions,
      strategicClassification: newClassification,
      evolutionStage: newEvolution,
    }

    const updatedProject = {
      ...project,
      contexts: updatedContexts,
    }

    // Add to undo stack
    const command: EditorCommand = {
      type: 'moveContext',
      payload: {
        contextId,
        oldPositions,
        newPositions,
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
      redoStack: [], // Clear redo stack on new action
    }
  }),

  updateMultipleContextPositions: (positionsMap) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    // Build map of old positions for undo
    const oldPositionsMap: Record<string, { old: BoundedContext['positions'], new: BoundedContext['positions'] }> = {}

    // Update all contexts
    const updatedContexts = project.contexts.map(context => {
      const newPositions = positionsMap[context.id]
      if (newPositions) {
        oldPositionsMap[context.id] = {
          old: context.positions,
          new: newPositions
        }

        // Auto-classify based on new positions
        const newClassification = classifyFromDistillationPosition(
          newPositions.distillation.x,
          newPositions.distillation.y
        )
        const newEvolution = classifyFromStrategicPosition(newPositions.strategic.x)

        return {
          ...context,
          positions: newPositions,
          strategicClassification: newClassification,
          evolutionStage: newEvolution,
        }
      }
      return context
    })

    const updatedProject = {
      ...project,
      contexts: updatedContexts,
    }

    // Add to undo stack
    const command: EditorCommand = {
      type: 'moveContextGroup',
      payload: {
        positionsMap: oldPositionsMap,
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
      redoStack: [], // Clear redo stack on new action
    }
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

  setViewMode: (mode) => set({ activeViewMode: mode }),

  setActiveProject: (projectId) => set((state) => {
    if (!state.projects[projectId]) return state
    localStorage.setItem('contextflow.activeProjectId', projectId)
    return {
      activeProjectId: projectId,
      selectedContextId: null,
      selectedGroupId: null,
      selectedActorId: null,
      selectedActorConnectionId: null,
      selectedContextIds: [],
      undoStack: [],
      redoStack: [],
    }
  }),

  addContext: (name) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const newContext: BoundedContext = {
      id: `context-${Date.now()}`,
      name,
      positions: {
        flow: { x: 50 },
        strategic: { x: 50 },
        distillation: { x: 50, y: 50 },
        shared: { y: 50 },
      },
      strategicClassification: 'supporting', // Default to supporting (middle of distillation map)
    }

    const command: EditorCommand = {
      type: 'addContext',
      payload: {
        context: newContext,
      },
    }

    const updatedProject = {
      ...project,
      contexts: [...project.contexts, newContext],
    }

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedContextId: newContext.id,
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  deleteContext: (contextId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const contextToDelete = project.contexts.find(c => c.id === contextId)
    if (!contextToDelete) return state

    const command: EditorCommand = {
      type: 'deleteContext',
      payload: {
        context: contextToDelete,
      },
    }

    // Remove deleted context from all keyframes
    let updatedTemporal = project.temporal
    if (project.temporal) {
      const updatedKeyframes = project.temporal.keyframes.map(kf => ({
        ...kf,
        activeContextIds: kf.activeContextIds.filter(id => id !== contextId),
        positions: Object.fromEntries(
          Object.entries(kf.positions).filter(([id]) => id !== contextId)
        ),
      }))
      updatedTemporal = {
        ...project.temporal,
        keyframes: updatedKeyframes,
      }
    }

    const updatedProject = {
      ...project,
      contexts: project.contexts.filter(c => c.id !== contextId),
      temporal: updatedTemporal,
    }

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedContextId: state.selectedContextId === contextId ? null : state.selectedContextId,
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
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
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const newGroup = {
      id: `group-${Date.now()}`,
      label,
      color: color || '#3b82f6',
      contextIds: state.selectedContextIds,
      notes,
    }

    const command: EditorCommand = {
      type: 'addGroup',
      payload: {
        group: newGroup,
      },
    }

    const updatedProject = {
      ...project,
      groups: [...project.groups, newGroup],
    }

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedGroupId: newGroup.id,
      selectedContextIds: [], // clear multi-select after creating group
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  deleteGroup: (groupId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const groupToDelete = project.groups.find(g => g.id === groupId)
    if (!groupToDelete) return state

    const command: EditorCommand = {
      type: 'deleteGroup',
      payload: {
        group: groupToDelete,
      },
    }

    const updatedProject = {
      ...project,
      groups: project.groups.filter(g => g.id !== groupId),
    }

    // Autosave
    autosaveProject(projectId, updatedProject)

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedGroupId: state.selectedGroupId === groupId ? null : state.selectedGroupId,
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  }),

  removeContextFromGroup: (groupId, contextId) => set((state) => {
    const projectId = state.activeProjectId
    if (!projectId) return state

    const project = state.projects[projectId]
    if (!project) return state

    const group = project.groups.find(g => g.id === groupId)
    if (!group) return state

    // Don't do anything if context isn't in the group
    if (!group.contextIds.includes(contextId)) return state

    const command: EditorCommand = {
      type: 'removeFromGroup',
      payload: {
        groupId,
        contextId,
      },
    }

    const updatedGroup = {
      ...group,
      contextIds: group.contextIds.filter(id => id !== contextId),
    }

    const updatedProject = {
      ...project,
      groups: project.groups.map(g => g.id === groupId ? updatedGroup : g),
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

    let newContexts = project.contexts
    let newRepos = project.repos
    let newGroups = project.groups
    let newRelationships = project.relationships
    let newActors = project.actors || []
    let newActorConnections = project.actorConnections || []

    if (command.type === 'moveContext' && command.payload.contextId && command.payload.oldPositions) {
      const contextIndex = newContexts.findIndex(c => c.id === command.payload.contextId)
      if (contextIndex !== -1) {
        newContexts = [...newContexts]
        newContexts[contextIndex] = {
          ...newContexts[contextIndex],
          positions: command.payload.oldPositions,
        }
      }
    } else if (command.type === 'moveContextGroup' && command.payload.positionsMap) {
      // Restore old positions for all moved contexts
      newContexts = newContexts.map(context => {
        const positionData = command.payload.positionsMap?.[context.id]
        if (positionData) {
          return {
            ...context,
            positions: positionData.old
          }
        }
        return context
      })
    } else if (command.type === 'addContext' && command.payload.context) {
      newContexts = newContexts.filter(c => c.id !== command.payload.context?.id)
    } else if (command.type === 'deleteContext' && command.payload.context) {
      newContexts = [...newContexts, command.payload.context]
    } else if (command.type === 'assignRepo' && command.payload.repoId) {
      const repoIndex = newRepos.findIndex(r => r.id === command.payload.repoId)
      if (repoIndex !== -1) {
        newRepos = [...newRepos]
        newRepos[repoIndex] = {
          ...newRepos[repoIndex],
          contextId: command.payload.oldContextId,
        }
      }
    } else if (command.type === 'unassignRepo' && command.payload.repoId) {
      const repoIndex = newRepos.findIndex(r => r.id === command.payload.repoId)
      if (repoIndex !== -1) {
        newRepos = [...newRepos]
        newRepos[repoIndex] = {
          ...newRepos[repoIndex],
          contextId: command.payload.oldContextId,
        }
      }
    } else if (command.type === 'addGroup' && command.payload.group) {
      newGroups = newGroups.filter(g => g.id !== command.payload.group?.id)
    } else if (command.type === 'deleteGroup' && command.payload.group) {
      newGroups = [...newGroups, command.payload.group]
    } else if (command.type === 'removeFromGroup' && command.payload.groupId && command.payload.contextId) {
      // Re-add the context to the group
      const groupIndex = newGroups.findIndex(g => g.id === command.payload.groupId)
      if (groupIndex !== -1) {
        newGroups = [...newGroups]
        newGroups[groupIndex] = {
          ...newGroups[groupIndex],
          contextIds: [...newGroups[groupIndex].contextIds, command.payload.contextId],
        }
      }
    } else if (command.type === 'addRelationship' && command.payload.relationship) {
      newRelationships = newRelationships.filter(r => r.id !== command.payload.relationship?.id)
    } else if (command.type === 'deleteRelationship' && command.payload.relationship) {
      newRelationships = [...newRelationships, command.payload.relationship]
    } else if (command.type === 'updateRelationship' && command.payload.relationshipId && command.payload.oldRelationship) {
      const relIndex = newRelationships.findIndex(r => r.id === command.payload.relationshipId)
      if (relIndex !== -1) {
        newRelationships = [...newRelationships]
        newRelationships[relIndex] = command.payload.oldRelationship
      }
    } else if (command.type === 'addActor' && command.payload.actor) {
      newActors = newActors.filter(a => a.id !== command.payload.actor?.id)
    } else if (command.type === 'deleteActor' && command.payload.actor) {
      newActors = [...newActors, command.payload.actor]
    } else if (command.type === 'moveActor' && command.payload.actorId && command.payload.oldPosition !== undefined) {
      const actorIndex = newActors.findIndex(a => a.id === command.payload.actorId)
      if (actorIndex !== -1) {
        newActors = [...newActors]
        newActors[actorIndex] = {
          ...newActors[actorIndex],
          position: command.payload.oldPosition,
        }
      }
    } else if (command.type === 'addActorConnection' && command.payload.actorConnection) {
      newActorConnections = newActorConnections.filter(ac => ac.id !== command.payload.actorConnection?.id)
    } else if (command.type === 'deleteActorConnection' && command.payload.actorConnection) {
      newActorConnections = [...newActorConnections, command.payload.actorConnection]
    }

    // Handle flow stage commands
    let newFlowStages = project.viewConfig.flowStages
    if (command.type === 'updateFlowStage' && command.payload.flowStageIndex !== undefined && command.payload.oldFlowStage) {
      newFlowStages = [...newFlowStages]
      newFlowStages[command.payload.flowStageIndex] = command.payload.oldFlowStage
    } else if (command.type === 'addFlowStage' && command.payload.flowStage) {
      newFlowStages = newFlowStages.filter(s => s.label !== command.payload.flowStage?.label && s.position !== command.payload.flowStage?.position)
    } else if (command.type === 'deleteFlowStage' && command.payload.flowStageIndex !== undefined && command.payload.flowStage) {
      newFlowStages = [...newFlowStages]
      newFlowStages.splice(command.payload.flowStageIndex, 0, command.payload.flowStage)
    }

    // Handle temporal commands
    let newTemporal = project.temporal
    if (command.type === 'createKeyframe') {
      // Undo keyframe creation by removing all created keyframes (may be multiple)
      const keyframesToRemove = command.payload.keyframes || (command.payload.keyframe ? [command.payload.keyframe] : [])
      const idsToRemove = new Set(keyframesToRemove.map(kf => kf.id))
      newTemporal = {
        ...newTemporal,
        enabled: newTemporal?.enabled || false,
        keyframes: (newTemporal?.keyframes || []).filter(kf => !idsToRemove.has(kf.id)),
      }
    } else if (command.type === 'deleteKeyframe' && command.payload.keyframe) {
      // Undo keyframe deletion by re-adding it
      const keyframes = [...(newTemporal?.keyframes || []), command.payload.keyframe].sort((a, b) => a.date.localeCompare(b.date))
      newTemporal = {
        ...newTemporal,
        enabled: newTemporal?.enabled || false,
        keyframes,
      }
    } else if (command.type === 'updateKeyframe' && command.payload.keyframeId && command.payload.oldKeyframeData) {
      // Restore old keyframe data
      newTemporal = {
        ...newTemporal,
        enabled: newTemporal?.enabled || false,
        keyframes: (newTemporal?.keyframes || []).map(kf =>
          kf.id === command.payload.keyframeId ? { ...kf, ...command.payload.oldKeyframeData } : kf
        ),
      }
    } else if (command.type === 'moveContextInKeyframe' && command.payload.keyframeId && command.payload.contextId && command.payload.oldPositions) {
      // Restore old context position in keyframe
      const oldX = command.payload.oldPositions.strategic.x
      const oldY = command.payload.oldPositions.shared.y
      newTemporal = {
        ...newTemporal,
        enabled: newTemporal?.enabled || false,
        keyframes: (newTemporal?.keyframes || []).map(kf =>
          kf.id === command.payload.keyframeId ? {
            ...kf,
            positions: {
              ...kf.positions,
              [command.payload.contextId!]: { x: oldX, y: oldY },
            },
          } : kf
        ),
      }
    }

    const updatedProject = {
      ...project,
      contexts: newContexts,
      repos: newRepos,
      groups: newGroups,
      relationships: newRelationships,
      actors: newActors,
      actorConnections: newActorConnections,
      viewConfig: {
        ...project.viewConfig,
        flowStages: newFlowStages,
      },
      temporal: newTemporal,
    }

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

    let newContexts = project.contexts
    let newRepos = project.repos
    let newGroups = project.groups
    let newRelationships = project.relationships
    let newActors = project.actors || []
    let newActorConnections = project.actorConnections || []

    if (command.type === 'moveContext' && command.payload.contextId && command.payload.newPositions) {
      const contextIndex = newContexts.findIndex(c => c.id === command.payload.contextId)
      if (contextIndex !== -1) {
        newContexts = [...newContexts]
        newContexts[contextIndex] = {
          ...newContexts[contextIndex],
          positions: command.payload.newPositions,
        }
      }
    } else if (command.type === 'moveContextGroup' && command.payload.positionsMap) {
      // Restore new positions for all moved contexts
      newContexts = newContexts.map(context => {
        const positionData = command.payload.positionsMap?.[context.id]
        if (positionData) {
          return {
            ...context,
            positions: positionData.new
          }
        }
        return context
      })
    } else if (command.type === 'addContext' && command.payload.context) {
      newContexts = [...newContexts, command.payload.context]
    } else if (command.type === 'deleteContext' && command.payload.context) {
      newContexts = newContexts.filter(c => c.id !== command.payload.context?.id)
    } else if (command.type === 'assignRepo' && command.payload.repoId && command.payload.newContextId) {
      const repoIndex = newRepos.findIndex(r => r.id === command.payload.repoId)
      if (repoIndex !== -1) {
        newRepos = [...newRepos]
        newRepos[repoIndex] = {
          ...newRepos[repoIndex],
          contextId: command.payload.newContextId,
        }
      }
    } else if (command.type === 'unassignRepo' && command.payload.repoId) {
      const repoIndex = newRepos.findIndex(r => r.id === command.payload.repoId)
      if (repoIndex !== -1) {
        newRepos = [...newRepos]
        newRepos[repoIndex] = {
          ...newRepos[repoIndex],
          contextId: undefined,
        }
      }
    } else if (command.type === 'addGroup' && command.payload.group) {
      newGroups = [...newGroups, command.payload.group]
    } else if (command.type === 'deleteGroup' && command.payload.group) {
      newGroups = newGroups.filter(g => g.id !== command.payload.group?.id)
    } else if (command.type === 'removeFromGroup' && command.payload.groupId && command.payload.contextId) {
      // Remove the context from the group
      const groupIndex = newGroups.findIndex(g => g.id === command.payload.groupId)
      if (groupIndex !== -1) {
        newGroups = [...newGroups]
        newGroups[groupIndex] = {
          ...newGroups[groupIndex],
          contextIds: newGroups[groupIndex].contextIds.filter(id => id !== command.payload.contextId),
        }
      }
    } else if (command.type === 'addRelationship' && command.payload.relationship) {
      newRelationships = [...newRelationships, command.payload.relationship]
    } else if (command.type === 'deleteRelationship' && command.payload.relationship) {
      newRelationships = newRelationships.filter(r => r.id !== command.payload.relationship?.id)
    } else if (command.type === 'updateRelationship' && command.payload.relationshipId && command.payload.newRelationship) {
      const relIndex = newRelationships.findIndex(r => r.id === command.payload.relationshipId)
      if (relIndex !== -1) {
        newRelationships = [...newRelationships]
        newRelationships[relIndex] = command.payload.newRelationship
      }
    } else if (command.type === 'addActor' && command.payload.actor) {
      newActors = [...newActors, command.payload.actor]
    } else if (command.type === 'deleteActor' && command.payload.actor) {
      newActors = newActors.filter(a => a.id !== command.payload.actor?.id)
    } else if (command.type === 'moveActor' && command.payload.actorId && command.payload.newPosition !== undefined) {
      const actorIndex = newActors.findIndex(a => a.id === command.payload.actorId)
      if (actorIndex !== -1) {
        newActors = [...newActors]
        newActors[actorIndex] = {
          ...newActors[actorIndex],
          position: command.payload.newPosition,
        }
      }
    } else if (command.type === 'addActorConnection' && command.payload.actorConnection) {
      newActorConnections = [...newActorConnections, command.payload.actorConnection]
    } else if (command.type === 'deleteActorConnection' && command.payload.actorConnection) {
      newActorConnections = newActorConnections.filter(ac => ac.id !== command.payload.actorConnection?.id)
    }

    // Handle flow stage commands (redo)
    let newFlowStages = project.viewConfig.flowStages
    if (command.type === 'updateFlowStage' && command.payload.flowStageIndex !== undefined && command.payload.newFlowStage) {
      newFlowStages = [...newFlowStages]
      newFlowStages[command.payload.flowStageIndex] = command.payload.newFlowStage
    } else if (command.type === 'addFlowStage' && command.payload.flowStage) {
      newFlowStages = [...newFlowStages, command.payload.flowStage]
    } else if (command.type === 'deleteFlowStage' && command.payload.flowStageIndex !== undefined) {
      newFlowStages = newFlowStages.filter((_, i) => i !== command.payload.flowStageIndex)
    }

    // Handle temporal commands
    let newTemporal = project.temporal
    if (command.type === 'createKeyframe') {
      // Redo keyframe creation by re-adding all keyframes (may be multiple)
      const keyframesToAdd = command.payload.keyframes || (command.payload.keyframe ? [command.payload.keyframe] : [])
      const keyframes = [...(newTemporal?.keyframes || []), ...keyframesToAdd].sort((a, b) => a.date.localeCompare(b.date))
      newTemporal = {
        ...newTemporal,
        enabled: newTemporal?.enabled || false,
        keyframes,
      }
    } else if (command.type === 'deleteKeyframe' && command.payload.keyframe) {
      // Redo keyframe deletion by removing it
      newTemporal = {
        ...newTemporal,
        enabled: newTemporal?.enabled || false,
        keyframes: (newTemporal?.keyframes || []).filter(kf => kf.id !== command.payload.keyframe?.id),
      }
    } else if (command.type === 'updateKeyframe' && command.payload.keyframeId && command.payload.newKeyframeData) {
      // Apply new keyframe data
      newTemporal = {
        ...newTemporal,
        enabled: newTemporal?.enabled || false,
        keyframes: (newTemporal?.keyframes || []).map(kf =>
          kf.id === command.payload.keyframeId ? { ...kf, ...command.payload.newKeyframeData } : kf
        ),
      }
    } else if (command.type === 'moveContextInKeyframe' && command.payload.keyframeId && command.payload.contextId && command.payload.newPositions) {
      // Apply new context position in keyframe
      const newX = command.payload.newPositions.strategic.x
      const newY = command.payload.newPositions.shared.y
      newTemporal = {
        ...newTemporal,
        enabled: newTemporal?.enabled || false,
        keyframes: (newTemporal?.keyframes || []).map(kf =>
          kf.id === command.payload.keyframeId ? {
            ...kf,
            positions: {
              ...kf.positions,
              [command.payload.contextId!]: { x: newX, y: newY },
            },
          } : kf
        ),
      }
    }

    const updatedProject = {
      ...project,
      contexts: newContexts,
      repos: newRepos,
      groups: newGroups,
      relationships: newRelationships,
      actors: newActors,
      actorConnections: newActorConnections,
      viewConfig: {
        ...project.viewConfig,
        flowStages: newFlowStages,
      },
      temporal: newTemporal,
    }

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
      selectedActorConnectionId: null,
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
    selectedActorConnectionId: null,
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
Promise.all([
  loadProject(sampleProject.id),
  loadProject(cbioportal.id)
]).then(([savedSample, savedCbioportal]) => {
  const projects: Record<string, Project> = {}

  if (savedSample) {
    projects[savedSample.id] = savedSample
  } else {
    projects[sampleProject.id] = sampleProject
  }

  if (savedCbioportal) {
    projects[savedCbioportal.id] = savedCbioportal
  } else {
    projects[cbioportal.id] = cbioportal
  }

  useEditorStore.setState({ projects })
}).catch(err => {
  console.error('Failed to load projects from IndexedDB:', err)
})
