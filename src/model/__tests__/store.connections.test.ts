import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../store'

describe('Store - Actor-Need-Context Connection Management', () => {
  beforeEach(() => {
    const { reset } = useEditorStore.getState()
    reset()
  })

  describe('createActorNeedConnection', () => {
    it('should create connection between actor and user need', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createActorNeedConnection, addUserNeed } = state

      const actorId = project.actors[0]?.id
      const needId = addUserNeed('Test Need')

      if (actorId && needId) {
        const initialCount = project.actorNeedConnections.length

        const connectionId = createActorNeedConnection(actorId, needId)

        const updatedState = useEditorStore.getState()
        const updatedProject = updatedState.projects[updatedState.activeProjectId!]

        expect(updatedProject.actorNeedConnections.length).toBe(initialCount + 1)

        const connection = updatedProject.actorNeedConnections.find(c => c.id === connectionId)
        expect(connection).toBeDefined()
        expect(connection?.actorId).toBe(actorId)
        expect(connection?.userNeedId).toBe(needId)
      }
    })

    it('should support undo/redo for actor-need connections', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createActorNeedConnection, addUserNeed, undo, redo } = state

      const actorId = project.actors[0]?.id
      const needId = addUserNeed('Test Need')

      if (actorId && needId) {
        const initialCount = project.actorNeedConnections.length

        const connectionId = createActorNeedConnection(actorId, needId)

        const afterCreate = useEditorStore.getState()
        const projectAfterCreate = afterCreate.projects[afterCreate.activeProjectId!]
        expect(projectAfterCreate.actorNeedConnections.length).toBe(initialCount + 1)

        undo()

        const afterUndo = useEditorStore.getState()
        const projectAfterUndo = afterUndo.projects[afterUndo.activeProjectId!]
        expect(projectAfterUndo.actorNeedConnections.find(c => c.id === connectionId)).toBeUndefined()

        redo()

        const afterRedo = useEditorStore.getState()
        const projectAfterRedo = afterRedo.projects[afterRedo.activeProjectId!]
        expect(projectAfterRedo.actorNeedConnections.find(c => c.id === connectionId)).toBeDefined()
      }
    })
  })

  describe('deleteActorNeedConnection', () => {
    it('should delete actor-need connection', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createActorNeedConnection, deleteActorNeedConnection, addUserNeed } = state

      const actorId = project.actors[0]?.id
      const needId = addUserNeed('Test Need')

      if (actorId && needId) {
        const connectionId = createActorNeedConnection(actorId, needId)

        const beforeDelete = useEditorStore.getState()
        const projectBeforeDelete = beforeDelete.projects[beforeDelete.activeProjectId!]
        expect(projectBeforeDelete.actorNeedConnections.find(c => c.id === connectionId)).toBeDefined()

        deleteActorNeedConnection(connectionId!)

        const afterDelete = useEditorStore.getState()
        const projectAfterDelete = afterDelete.projects[afterDelete.activeProjectId!]
        expect(projectAfterDelete.actorNeedConnections.find(c => c.id === connectionId)).toBeUndefined()
      }
    })

    it('should support undo/redo for deleting actor-need connections', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createActorNeedConnection, deleteActorNeedConnection, addUserNeed, undo, redo } = state

      const actorId = project.actors[0]?.id
      const needId = addUserNeed('Test Need')

      if (actorId && needId) {
        const connectionId = createActorNeedConnection(actorId, needId)

        deleteActorNeedConnection(connectionId!)

        const afterDelete = useEditorStore.getState()
        const projectAfterDelete = afterDelete.projects[afterDelete.activeProjectId!]
        expect(projectAfterDelete.actorNeedConnections.find(c => c.id === connectionId)).toBeUndefined()

        undo()

        const afterUndo = useEditorStore.getState()
        const projectAfterUndo = afterUndo.projects[afterUndo.activeProjectId!]
        expect(projectAfterUndo.actorNeedConnections.find(c => c.id === connectionId)).toBeDefined()

        redo()

        const afterRedo = useEditorStore.getState()
        const projectAfterRedo = afterRedo.projects[afterRedo.activeProjectId!]
        expect(projectAfterRedo.actorNeedConnections.find(c => c.id === connectionId)).toBeUndefined()
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

  describe('updateActorNeedConnection', () => {
    it('should update actor-need connection notes', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { createActorNeedConnection, updateActorNeedConnection, addUserNeed } = state

      const actorId = project.actors[0]?.id
      const needId = addUserNeed('Test Need')

      if (actorId && needId) {
        const connectionId = createActorNeedConnection(actorId, needId)

        updateActorNeedConnection(connectionId!, { notes: 'Important connection' })

        const updatedState = useEditorStore.getState()
        const updatedProject = updatedState.projects[updatedState.activeProjectId!]
        const connection = updatedProject.actorNeedConnections.find(c => c.id === connectionId)

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
