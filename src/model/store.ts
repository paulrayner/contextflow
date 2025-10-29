import { create } from 'zustand'
import type { Project } from './types'
import demoProject from '../../examples/sample.project.json'

export type ViewMode = 'flow' | 'strategic'

interface EditorCommand {
  type: string
  payload: any
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
}

// basic initialization with demo project in memory
export const useEditorStore = create<EditorState>(() => ({
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
}))
