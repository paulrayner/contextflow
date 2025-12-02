import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEditorStore } from '../store'
import { initializeCollabMode, destroyCollabMode } from '../sync/useCollabMode'
import type { Project } from '../types'

describe('Store - Flow Stage Management', () => {
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

  describe('updateFlowStage', () => {
    it('should update stage name', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateFlowStage } = state
      const initialStages = project!.viewConfig.flowStages
      expect(initialStages.length).toBeGreaterThan(0)

      updateFlowStage(0, { name: 'New Name' })

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      expect(updatedProject!.viewConfig.flowStages[0].name).toBe('New Name')
      expect(updatedProject!.viewConfig.flowStages[0].position).toBe(initialStages[0].position)
    })

    it('should update stage position', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateFlowStage } = state
      const initialName = project!.viewConfig.flowStages[0].name

      updateFlowStage(0, { position: 75 })

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      expect(updatedProject!.viewConfig.flowStages[0].position).toBe(75)
      expect(updatedProject!.viewConfig.flowStages[0].name).toBe(initialName)
    })

    it('should validate unique positions', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateFlowStage } = state
      const existingPosition = project!.viewConfig.flowStages[1].position

      expect(() => {
        updateFlowStage(0, { position: existingPosition })
      }).toThrow('Stage position must be unique')
    })

    it('should validate unique names', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateFlowStage } = state
      const existingName = project!.viewConfig.flowStages[1].name

      expect(() => {
        updateFlowStage(0, { name: existingName })
      }).toThrow('Stage name must be unique')
    })

    it('should allow updating to same name (no-op case)', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateFlowStage } = state
      const existingName = project!.viewConfig.flowStages[0].name

      expect(() => {
        updateFlowStage(0, { name: existingName })
      }).not.toThrow()
    })

    it('should allow updating to same position (no-op case)', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateFlowStage } = state
      const existingPosition = project!.viewConfig.flowStages[0].position

      expect(() => {
        updateFlowStage(0, { position: existingPosition })
      }).not.toThrow()
    })
  })

  describe('addFlowStage', () => {
    it('should add new stage with label and position', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addFlowStage } = state
      const initialCount = project!.viewConfig.flowStages.length

      addFlowStage('New Stage', 55)

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      expect(updatedProject!.viewConfig.flowStages.length).toBe(initialCount + 1)

      const newStage = updatedProject!.viewConfig.flowStages.find(s => s.name === 'New Stage')
      expect(newStage).toBeDefined()
      expect(newStage?.position).toBe(55)
    })

    it('should validate unique position when adding', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addFlowStage } = state
      const existingPosition = project!.viewConfig.flowStages[0].position

      expect(() => {
        addFlowStage('New Stage', existingPosition)
      }).toThrow('Stage position must be unique')
    })

    it('should validate unique name when adding', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addFlowStage } = state
      const existingName = project!.viewConfig.flowStages[0].name

      expect(() => {
        addFlowStage(existingName, 55)
      }).toThrow('Stage name must be unique')
    })
  })

  describe('deleteFlowStage', () => {
    it('should delete stage by index', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { deleteFlowStage } = state
      const initialCount = project!.viewConfig.flowStages.length
      const deletedName = project!.viewConfig.flowStages[0].name

      deleteFlowStage(0)

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      expect(updatedProject!.viewConfig.flowStages.length).toBe(initialCount - 1)
      expect(updatedProject!.viewConfig.flowStages.find(s => s.name === deletedName)).toBeUndefined()
    })

    it('should handle out of bounds index gracefully', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { deleteFlowStage } = state
      const initialCount = project!.viewConfig.flowStages.length

      deleteFlowStage(999)

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      expect(updatedProject!.viewConfig.flowStages.length).toBe(initialCount)
    })
  })

  describe('undo/redo for flow stages', () => {
    it('should undo stage position update', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { updateFlowStage, undo } = state
      const originalPosition = project!.viewConfig.flowStages[0].position

      updateFlowStage(0, { position: 75 })
      undo()

      const updatedState = useEditorStore.getState()
      const afterUndo = updatedState.projects[updatedState.activeProjectId!]
      expect(afterUndo!.viewConfig.flowStages[0].position).toBe(originalPosition)
    })

    it('should undo stage addition', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addFlowStage, undo } = state
      const initialCount = project!.viewConfig.flowStages.length

      addFlowStage('New Stage', 55)
      undo()

      const updatedState = useEditorStore.getState()
      const afterUndo = updatedState.projects[updatedState.activeProjectId!]
      expect(afterUndo!.viewConfig.flowStages.length).toBe(initialCount)
    })

    it('should undo stage deletion', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { deleteFlowStage, undo } = state
      const deletedName = project!.viewConfig.flowStages[0].name
      const deletedPosition = project!.viewConfig.flowStages[0].position

      deleteFlowStage(0)
      undo()

      const updatedState = useEditorStore.getState()
      const afterUndo = updatedState.projects[updatedState.activeProjectId!]
      const restoredStage = afterUndo!.viewConfig.flowStages.find(s => s.name === deletedName)
      expect(restoredStage).toBeDefined()
      expect(restoredStage?.position).toBe(deletedPosition)
    })

    it('should redo stage position update', () => {
      const { updateFlowStage, undo, redo } = useEditorStore.getState()

      updateFlowStage(0, { position: 75 })
      undo()
      redo()

      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      expect(project!.viewConfig.flowStages[0].position).toBe(75)
    })
  })
})
