import type { Project, BoundedContext } from '../types'
import type { EditorState, EditorCommand } from '../storeTypes'
import { classifyFromDistillationPosition, classifyFromStrategicPosition } from '../classification'
import { trackEvent, trackPropertyChange, trackTextFieldEdit, trackFTUEMilestone } from '../../utils/analytics'
import { getGridPosition } from '../../lib/distillationGrid'

export function updateContextAction(
  state: EditorState,
  contextId: string,
  updates: Partial<BoundedContext>
): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const contextIndex = project.contexts.findIndex(c => c.id === contextId)
  if (contextIndex === -1) return state

  const oldContext = project.contexts[contextIndex]
  const updatedContexts = [...project.contexts]
  updatedContexts[contextIndex] = {
    ...updatedContexts[contextIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    contexts: updatedContexts,
  }

  // Track property changes
  const trackedProperties = [
    'name', 'purpose', 'strategicClassification', 'evolutionStage',
    'boundaryIntegrity', 'boundaryNotes', 'isExternal', 'isLegacy',
    'notes'
  ] as const

  trackedProperties.forEach(prop => {
    if (prop in updates && oldContext[prop] !== updates[prop]) {
      if (prop === 'purpose' || prop === 'boundaryNotes' || prop === 'notes') {
        // Text fields - track character count only (no PII)
        trackTextFieldEdit(
          updatedProject,
          'context',
          prop,
          oldContext[prop],
          updates[prop],
          'inspector'
        )
      } else if (prop === 'codeSize') {
        // Special handling for code size bucket
        const oldBucket = (oldContext.codeSize as any)?.bucket
        const newBucket = (updates.codeSize as any)?.bucket
        if (oldBucket !== newBucket) {
          trackPropertyChange(
            'context_property_changed',
            updatedProject,
            'context',
            contextId,
            'codeSize.bucket',
            oldBucket,
            newBucket,
            state.activeViewMode
          )
        }
      } else {
        // Standard property changes
        trackPropertyChange(
          'context_property_changed',
          updatedProject,
          'context',
          contextId,
          prop,
          oldContext[prop],
          updates[prop],
          state.activeViewMode
        )
      }
    }
  })

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}

export function updateContextPositionAction(
  state: EditorState,
  contextId: string,
  newPositions: BoundedContext['positions']
): Partial<EditorState> & { command?: EditorCommand } {
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

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    undoStack: [...state.undoStack, command],
    redoStack: [], // Clear redo stack on new action
    command,
  }
}

export function updateMultipleContextPositionsAction(
  state: EditorState,
  positionsMap: Record<string, BoundedContext['positions']>
): Partial<EditorState> & { command?: EditorCommand } {
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

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    undoStack: [...state.undoStack, command],
    redoStack: [], // Clear redo stack on new action
    command,
  }
}

export function addContextAction(
  state: EditorState,
  name: string
): Partial<EditorState> & { command?: EditorCommand, newContext?: BoundedContext } {
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
      distillation: getGridPosition(project.contexts.length),
      shared: { y: 50 },
    },
    strategicClassification: 'supporting',
    evolutionStage: 'custom-built',
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

  // Track analytics
  trackEvent('context_added', updatedProject, {
    entity_type: 'context',
    entity_id: newContext.id,
    source_view: state.activeViewMode,
    metadata: {
      context_type: newContext.strategicClassification,
      is_external: newContext.isExternal || false
    }
  })

  // Track FTUE milestone: first context added
  trackFTUEMilestone('first_context_added', updatedProject)

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedContextId: newContext.id,
    undoStack: [...state.undoStack, command],
    redoStack: [],
    command,
    newContext,
  }
}

export function deleteContextAction(
  state: EditorState,
  contextId: string
): Partial<EditorState> & { command?: EditorCommand } {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const contextToDelete = project.contexts.find(c => c.id === contextId)
  if (!contextToDelete) return state

  // Calculate metadata before deletion
  const relationshipCount = project.relationships.filter(
    r => r.fromContextId === contextId || r.toContextId === contextId
  ).length
  const groupCount = project.groups.filter(g => g.contextIds.includes(contextId)).length

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

  // Track analytics
  trackEvent('context_deleted', project, {
    entity_type: 'context',
    entity_id: contextId,
    metadata: {
      relationship_count: relationshipCount,
      group_count: groupCount
    }
  })

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedContextId: state.selectedContextId === contextId ? null : state.selectedContextId,
    undoStack: [...state.undoStack, command],
    redoStack: [],
    command,
  }
}
