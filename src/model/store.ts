import { create } from 'zustand'
import type { Project, BoundedContext } from './types'
import demoProject from '../../examples/sample.project.json'

export type ViewMode = 'flow' | 'strategic'

interface EditorCommand {
  type: 'moveContext' | 'addContext' | 'deleteContext'
  payload: {
    contextId?: string
    oldPositions?: BoundedContext['positions']
    newPositions?: BoundedContext['positions']
    context?: BoundedContext
  }
}

interface EditorState {
  activeProjectId: string | null
  projects: Record<string, Project>

  activeViewMode: ViewMode

  selectedContextId: string | null
  selectedRelationshipId: string | null
  selectedGroupId: string | null

  canvasView: {
    flow: { zoom: number; panX: number; panY: number }
    strategic: { zoom: number; panX: number; panY: number }
  }

  undoStack: EditorCommand[]
  redoStack: EditorCommand[]

  // Actions
  updateContext: (contextId: string, updates: Partial<BoundedContext>) => void
  updateContextPosition: (contextId: string, newPositions: BoundedContext['positions']) => void
  setSelectedContext: (contextId: string | null) => void
  setViewMode: (mode: ViewMode) => void
  addContext: (name: string) => void
  undo: () => void
  redo: () => void
  fitToMap: () => void
  exportProject: () => void
  importProject: (project: Project) => void
}

// basic initialization with demo project in memory
export const useEditorStore = create<EditorState>((set) => ({
  activeProjectId: 'acme-ecommerce',
  projects: {
    'acme-ecommerce': demoProject as Project,
  },

  activeViewMode: 'flow',

  selectedContextId: null,
  selectedRelationshipId: null,
  selectedGroupId: null,

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

    return {
      projects: {
        ...state.projects,
        [projectId]: {
          ...project,
          contexts: updatedContexts,
        },
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

    // Add to undo stack
    const command: EditorCommand = {
      type: 'moveContext',
      payload: {
        contextId,
        oldPositions,
        newPositions,
      },
    }

    return {
      projects: {
        ...state.projects,
        [projectId]: {
          ...project,
          contexts: updatedContexts,
        },
      },
      undoStack: [...state.undoStack, command],
      redoStack: [], // Clear redo stack on new action
    }
  }),

  setSelectedContext: (contextId) => set({ selectedContextId: contextId }),

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

    return {
      projects: {
        ...state.projects,
        [projectId]: {
          ...project,
          contexts: [...project.contexts, newContext],
        },
      },
      selectedContextId: newContext.id,
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

    if (command.type === 'moveContext' && command.payload.contextId && command.payload.oldPositions) {
      const contextIndex = newContexts.findIndex(c => c.id === command.payload.contextId)
      if (contextIndex !== -1) {
        newContexts = [...newContexts]
        newContexts[contextIndex] = {
          ...newContexts[contextIndex],
          positions: command.payload.oldPositions,
        }
      }
    } else if (command.type === 'addContext' && command.payload.context) {
      newContexts = newContexts.filter(c => c.id !== command.payload.context?.id)
    }

    return {
      projects: {
        ...state.projects,
        [projectId]: {
          ...project,
          contexts: newContexts,
        },
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

    if (command.type === 'moveContext' && command.payload.contextId && command.payload.newPositions) {
      const contextIndex = newContexts.findIndex(c => c.id === command.payload.contextId)
      if (contextIndex !== -1) {
        newContexts = [...newContexts]
        newContexts[contextIndex] = {
          ...newContexts[contextIndex],
          positions: command.payload.newPositions,
        }
      }
    } else if (command.type === 'addContext' && command.payload.context) {
      newContexts = [...newContexts, command.payload.context]
    }

    return {
      projects: {
        ...state.projects,
        [projectId]: {
          ...project,
          contexts: newContexts,
        },
      },
      undoStack: [...state.undoStack, command],
      redoStack: newRedoStack,
    }
  }),

  fitToMap: () => set((state) => {
    // TODO: Implement fit to map logic
    return state
  }),

  exportProject: () => {},

  importProject: (project) => set((state) => {
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
