import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEditorStore } from '../store'
import { initializeCollabMode, destroyCollabMode } from '../sync/useCollabMode'
import type { Project } from '../types'

describe('Store - Relationship Editing', () => {
  beforeEach(() => {
    const { reset } = useEditorStore.getState()
    reset()

    // Initialize collab mode for the active project
    const state = useEditorStore.getState()
    const project = state.projects[state.activeProjectId!]
    const onProjectChange = (updatedProject: Project): void => {
      useEditorStore.setState((s) => ({
        projects: {
          ...s.projects,
          [updatedProject.id]: updatedProject,
        },
      }))
    }
    initializeCollabMode(project, { onProjectChange })
  })

  afterEach(() => {
    destroyCollabMode()
  })

  describe('updateRelationship', () => {
    it('should update relationship pattern', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateRelationship } = state

      expect(project.relationships.length).toBeGreaterThan(0)
      const relationshipId = project.relationships[0].id
      const originalPattern = project.relationships[0].pattern

      updateRelationship(relationshipId, { pattern: 'partnership' as any })

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedRel = updatedProject.relationships.find(r => r.id === relationshipId)
      expect(updatedRel?.pattern).toBe('partnership')
    })

    it('should update relationship communication mode', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateRelationship } = state

      const relationshipId = project.relationships[0].id

      updateRelationship(relationshipId, { communicationMode: 'REST API' })

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedRel = updatedProject.relationships.find(r => r.id === relationshipId)
      expect(updatedRel?.communicationMode).toBe('REST API')
    })

    it('should update relationship description', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateRelationship } = state

      const relationshipId = project.relationships[0].id

      updateRelationship(relationshipId, { description: 'New description' })

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedRel = updatedProject.relationships.find(r => r.id === relationshipId)
      expect(updatedRel?.description).toBe('New description')
    })
  })

  describe('setSelectedRelationship', () => {
    it('should select a relationship', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { setSelectedRelationship } = state

      const relationshipId = project.relationships[0].id

      setSelectedRelationship(relationshipId)

      const updatedState = useEditorStore.getState()
      expect(updatedState.selectedRelationshipId).toBe(relationshipId)
      expect(updatedState.selectedContextId).toBeNull()
      expect(updatedState.selectedGroupId).toBeNull()
    })
  })

  describe('undo/redo for relationship pattern changes', () => {
    it('should undo relationship pattern update', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateRelationship, undo } = state

      const relationshipId = project.relationships[0].id
      const originalPattern = project.relationships[0].pattern

      updateRelationship(relationshipId, { pattern: 'partnership' as any })
      undo()

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedRel = updatedProject.relationships.find(r => r.id === relationshipId)
      expect(updatedRel?.pattern).toBe(originalPattern)
    })

    it('should redo relationship pattern update', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateRelationship, undo, redo } = state

      const relationshipId = project.relationships[0].id

      updateRelationship(relationshipId, { pattern: 'partnership' as any })
      undo()
      redo()

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedRel = updatedProject.relationships.find(r => r.id === relationshipId)
      expect(updatedRel?.pattern).toBe('partnership')
    })
  })
})
