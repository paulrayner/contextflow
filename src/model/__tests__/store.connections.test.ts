import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEditorStore } from '../store'
import { initializeCollabMode, destroyCollabMode } from '../sync/useCollabMode'
import type { Project } from '../types'

describe('Store - User-Need-Context Connection Management', () => {
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

  describe('createUserNeedConnection', () => {
    it('should create connection between user and user need', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createUserNeedConnection, addUserNeed } = state

      const userId = project.users[0]?.id
      const needId = addUserNeed('Test Need')

      if (userId && needId) {
        const initialCount = project.userNeedConnections.length

        const connectionId = createUserNeedConnection(userId, needId)

        const updatedState = useEditorStore.getState()
        const updatedProject = updatedState.projects[updatedState.activeProjectId!]

        expect(updatedProject.userNeedConnections.length).toBe(initialCount + 1)

        const connection = updatedProject.userNeedConnections.find(c => c.id === connectionId)
        expect(connection).toBeDefined()
        expect(connection?.userId).toBe(userId)
        expect(connection?.userNeedId).toBe(needId)
      }
    })

    it('should support undo/redo for user-need connections', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createUserNeedConnection, addUserNeed, undo, redo } = state

      const userId = project.users[0]?.id
      const needId = addUserNeed('Test Need')

      if (userId && needId) {
        const initialCount = project.userNeedConnections.length

        const connectionId = createUserNeedConnection(userId, needId)

        const afterCreate = useEditorStore.getState()
        const projectAfterCreate = afterCreate.projects[afterCreate.activeProjectId!]
        expect(projectAfterCreate.userNeedConnections.length).toBe(initialCount + 1)

        undo()

        const afterUndo = useEditorStore.getState()
        const projectAfterUndo = afterUndo.projects[afterUndo.activeProjectId!]
        expect(projectAfterUndo.userNeedConnections.find(c => c.id === connectionId)).toBeUndefined()

        redo()

        const afterRedo = useEditorStore.getState()
        const projectAfterRedo = afterRedo.projects[afterRedo.activeProjectId!]
        expect(projectAfterRedo.userNeedConnections.find(c => c.id === connectionId)).toBeDefined()
      }
    })
  })

  describe('deleteUserNeedConnection', () => {
    it('should delete user-need connection', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createUserNeedConnection, deleteUserNeedConnection, addUserNeed } = state

      const userId = project.users[0]?.id
      const needId = addUserNeed('Test Need')

      if (userId && needId) {
        const connectionId = createUserNeedConnection(userId, needId)

        const beforeDelete = useEditorStore.getState()
        const projectBeforeDelete = beforeDelete.projects[beforeDelete.activeProjectId!]
        expect(projectBeforeDelete.userNeedConnections.find(c => c.id === connectionId)).toBeDefined()

        deleteUserNeedConnection(connectionId!)

        const afterDelete = useEditorStore.getState()
        const projectAfterDelete = afterDelete.projects[afterDelete.activeProjectId!]
        expect(projectAfterDelete.userNeedConnections.find(c => c.id === connectionId)).toBeUndefined()
      }
    })

    it('should support undo/redo for deleting user-need connections', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createUserNeedConnection, deleteUserNeedConnection, addUserNeed, undo, redo } = state

      const userId = project.users[0]?.id
      const needId = addUserNeed('Test Need')

      if (userId && needId) {
        const connectionId = createUserNeedConnection(userId, needId)

        deleteUserNeedConnection(connectionId!)

        const afterDelete = useEditorStore.getState()
        const projectAfterDelete = afterDelete.projects[afterDelete.activeProjectId!]
        expect(projectAfterDelete.userNeedConnections.find(c => c.id === connectionId)).toBeUndefined()

        undo()

        const afterUndo = useEditorStore.getState()
        const projectAfterUndo = afterUndo.projects[afterUndo.activeProjectId!]
        expect(projectAfterUndo.userNeedConnections.find(c => c.id === connectionId)).toBeDefined()

        redo()

        const afterRedo = useEditorStore.getState()
        const projectAfterRedo = afterRedo.projects[afterRedo.activeProjectId!]
        expect(projectAfterRedo.userNeedConnections.find(c => c.id === connectionId)).toBeUndefined()
      }
    })
  })

  describe('createNeedContextConnection', () => {
    it('should create connection between user need and context', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createNeedContextConnection, addUserNeed } = state

      const needId = addUserNeed('Test Need')
      const contextId = project.contexts[0]?.id

      if (needId && contextId) {
        const initialCount = project.needContextConnections.length

        const connectionId = createNeedContextConnection(needId, contextId)

        const updatedState = useEditorStore.getState()
        const updatedProject = updatedState.projects[updatedState.activeProjectId!]

        expect(updatedProject.needContextConnections.length).toBe(initialCount + 1)

        const connection = updatedProject.needContextConnections.find(c => c.id === connectionId)
        expect(connection).toBeDefined()
        expect(connection?.userNeedId).toBe(needId)
        expect(connection?.contextId).toBe(contextId)
      }
    })

    it('should support undo/redo for need-context connections', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createNeedContextConnection, addUserNeed, undo, redo } = state

      const needId = addUserNeed('Test Need')
      const contextId = project.contexts[0]?.id

      if (needId && contextId) {
        const initialCount = project.needContextConnections.length

        const connectionId = createNeedContextConnection(needId, contextId)

        const afterCreate = useEditorStore.getState()
        const projectAfterCreate = afterCreate.projects[afterCreate.activeProjectId!]
        expect(projectAfterCreate.needContextConnections.length).toBe(initialCount + 1)

        undo()

        const afterUndo = useEditorStore.getState()
        const projectAfterUndo = afterUndo.projects[afterUndo.activeProjectId!]
        expect(projectAfterUndo.needContextConnections.find(c => c.id === connectionId)).toBeUndefined()

        redo()

        const afterRedo = useEditorStore.getState()
        const projectAfterRedo = afterRedo.projects[afterRedo.activeProjectId!]
        expect(projectAfterRedo.needContextConnections.find(c => c.id === connectionId)).toBeDefined()
      }
    })
  })

  describe('deleteNeedContextConnection', () => {
    it('should delete need-context connection', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createNeedContextConnection, deleteNeedContextConnection, addUserNeed } = state

      const needId = addUserNeed('Test Need')
      const contextId = project.contexts[0]?.id

      if (needId && contextId) {
        const connectionId = createNeedContextConnection(needId, contextId)

        const beforeDelete = useEditorStore.getState()
        const projectBeforeDelete = beforeDelete.projects[beforeDelete.activeProjectId!]
        expect(projectBeforeDelete.needContextConnections.find(c => c.id === connectionId)).toBeDefined()

        deleteNeedContextConnection(connectionId!)

        const afterDelete = useEditorStore.getState()
        const projectAfterDelete = afterDelete.projects[afterDelete.activeProjectId!]
        expect(projectAfterDelete.needContextConnections.find(c => c.id === connectionId)).toBeUndefined()
      }
    })

    it('should support undo/redo for deleting need-context connections', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createNeedContextConnection, deleteNeedContextConnection, addUserNeed, undo, redo } = state

      const needId = addUserNeed('Test Need')
      const contextId = project.contexts[0]?.id

      if (needId && contextId) {
        const connectionId = createNeedContextConnection(needId, contextId)

        deleteNeedContextConnection(connectionId!)

        const afterDelete = useEditorStore.getState()
        const projectAfterDelete = afterDelete.projects[afterDelete.activeProjectId!]
        expect(projectAfterDelete.needContextConnections.find(c => c.id === connectionId)).toBeUndefined()

        undo()

        const afterUndo = useEditorStore.getState()
        const projectAfterUndo = afterUndo.projects[afterUndo.activeProjectId!]
        expect(projectAfterUndo.needContextConnections.find(c => c.id === connectionId)).toBeDefined()

        redo()

        const afterRedo = useEditorStore.getState()
        const projectAfterRedo = afterRedo.projects[afterRedo.activeProjectId!]
        expect(projectAfterRedo.needContextConnections.find(c => c.id === connectionId)).toBeUndefined()
      }
    })
  })

  describe('updateUserNeedConnection', () => {
    it('should update user-need connection notes', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createUserNeedConnection, updateUserNeedConnection, addUserNeed } = state

      const userId = project.users[0]?.id
      const needId = addUserNeed('Test Need')

      if (userId && needId) {
        const connectionId = createUserNeedConnection(userId, needId)

        updateUserNeedConnection(connectionId!, { notes: 'Important connection' })

        const updatedState = useEditorStore.getState()
        const updatedProject = updatedState.projects[updatedState.activeProjectId!]
        const connection = updatedProject.userNeedConnections.find(c => c.id === connectionId)

        expect(connection?.notes).toBe('Important connection')
      }
    })
  })

  describe('updateNeedContextConnection', () => {
    it('should update need-context connection notes', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createNeedContextConnection, updateNeedContextConnection, addUserNeed } = state

      const needId = addUserNeed('Test Need')
      const contextId = project.contexts[0]?.id

      if (needId && contextId) {
        const connectionId = createNeedContextConnection(needId, contextId)

        updateNeedContextConnection(connectionId!, { notes: 'Critical path' })

        const updatedState = useEditorStore.getState()
        const updatedProject = updatedState.projects[updatedState.activeProjectId!]
        const connection = updatedProject.needContextConnections.find(c => c.id === connectionId)

        expect(connection?.notes).toBe('Critical path')
      }
    })
  })
})
