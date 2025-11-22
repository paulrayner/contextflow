import type { Relationship } from '../types'
import type { EditorState, EditorCommand } from '../storeTypes'
import { trackEvent, trackPropertyChange, trackTextFieldEdit, trackFTUEMilestone } from '../../utils/analytics'

export function addRelationshipAction(
  state: EditorState,
  fromContextId: string,
  toContextId: string,
  pattern: Relationship['pattern'],
  description?: string
): Partial<EditorState> & { command?: EditorCommand } {
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

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function deleteRelationshipAction(
  state: EditorState,
  relationshipId: string
): Partial<EditorState> & { command?: EditorCommand } {
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

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function updateRelationshipAction(
  state: EditorState,
  relationshipId: string,
  updates: Partial<Relationship>
): Partial<EditorState> & { command?: EditorCommand } {
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

    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    }
  } else {
    return {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
    }
  }
}
