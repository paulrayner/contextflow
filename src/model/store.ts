import { create } from 'zustand'
import type { Project, BoundedContext } from './types'
import demoProject from '../../examples/sample.project.json'
import { saveProject, loadProject } from './persistence'

export type ViewMode = 'flow' | 'strategic'

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
  type: 'moveContext' | 'moveContextGroup' | 'addContext' | 'deleteContext' | 'assignRepo' | 'unassignRepo' | 'addGroup' | 'deleteGroup' | 'removeFromGroup' | 'addRelationship' | 'deleteRelationship'
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
  }
}

interface EditorState {
  activeProjectId: string | null
  projects: Record<string, Project>

  activeViewMode: ViewMode

  selectedContextId: string | null
  selectedRelationshipId: string | null
  selectedGroupId: string | null
  selectedContextIds: string[] // for multi-select

  canvasView: {
    flow: { zoom: number; panX: number; panY: number }
    strategic: { zoom: number; panX: number; panY: number }
  }

  undoStack: EditorCommand[]
  redoStack: EditorCommand[]

  // Actions
  updateContext: (contextId: string, updates: Partial<BoundedContext>) => void
  updateContextPosition: (contextId: string, newPositions: BoundedContext['positions']) => void
  updateMultipleContextPositions: (positionsMap: Record<string, BoundedContext['positions']>) => void
  setSelectedContext: (contextId: string | null) => void
  toggleContextSelection: (contextId: string) => void
  clearContextSelection: () => void
  setViewMode: (mode: ViewMode) => void
  addContext: (name: string) => void
  deleteContext: (contextId: string) => void
  assignRepoToContext: (repoId: string, contextId: string) => void
  unassignRepo: (repoId: string) => void
  createGroup: (label: string, color?: string, notes?: string) => void
  deleteGroup: (groupId: string) => void
  removeContextFromGroup: (groupId: string, contextId: string) => void
  addRelationship: (fromContextId: string, toContextId: string, pattern: string, description?: string) => void
  deleteRelationship: (relationshipId: string) => void
  undo: () => void
  redo: () => void
  fitToMap: () => void
  exportProject: () => void
  importProject: (project: Project) => void
}

// Basic initialization with demo project in memory
// Demo project will be saved to IndexedDB on first load
const initialProject = demoProject as Project

// Save demo project to IndexedDB asynchronously
saveProject(initialProject).catch((err) => {
  console.error('Failed to save initial demo project:', err)
})

export const useEditorStore = create<EditorState>((set) => ({
  activeProjectId: initialProject.id,
  projects: {
    [initialProject.id]: initialProject,
  },

  activeViewMode: 'flow',

  selectedContextId: null,
  selectedRelationshipId: null,
  selectedGroupId: null,
  selectedContextIds: [],

  canvasView: {
    flow: { zoom: 1, panX: 0, panY: 0 },
    strategic: { zoom: 1, panX: 0, panY: 0 },
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

    const updatedContexts = [...project.contexts]
    updatedContexts[contextIndex] = {
      ...updatedContexts[contextIndex],
      positions: newPositions,
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
        return {
          ...context,
          positions: newPositions
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
  }),

  toggleContextSelection: (contextId) => set((state) => {
    const isSelected = state.selectedContextIds.includes(contextId)
    return {
      selectedContextId: null, // clear single selection
      selectedGroupId: null, // clear group selection
      selectedContextIds: isSelected
        ? state.selectedContextIds.filter(id => id !== contextId)
        : [...state.selectedContextIds, contextId],
    }
  }),

  clearContextSelection: () => set({
    selectedContextIds: [],
    selectedContextId: null,
    selectedGroupId: null,
  }),

  setViewMode: (mode) => set({ activeViewMode: mode }),

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
        shared: { y: 50 },
      },
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

    const updatedProject = {
      ...project,
      contexts: project.contexts.filter(c => c.id !== contextId),
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
    }

    const updatedProject = {
      ...project,
      contexts: newContexts,
      repos: newRepos,
      groups: newGroups,
      relationships: newRelationships,
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
    }

    const updatedProject = {
      ...project,
      contexts: newContexts,
      repos: newRepos,
      groups: newGroups,
      relationships: newRelationships,
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
    // Autosave imported project
    autosaveProject(project.id, project)

    return {
      projects: {
        ...state.projects,
        [project.id]: project,
      },
      activeProjectId: project.id,
      selectedContextId: null,
    }
  }),
}))

// Load saved project from IndexedDB on startup
loadProject(initialProject.id).then(savedProject => {
  if (savedProject) {
    console.log('Loaded saved project from IndexedDB')
    useEditorStore.setState({
      projects: {
        [savedProject.id]: savedProject
      }
    })
  } else {
    console.log('No saved project found, using demo project')
  }
}).catch(err => {
  console.error('Failed to load project from IndexedDB:', err)
})
