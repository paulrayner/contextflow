import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../store'

describe('Store - UserNeed Management', () => {
  beforeEach(() => {
    const { reset } = useEditorStore.getState()
    reset()
  })

  describe('addUserNeed', () => {
    it('should add a new user need with default position', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addUserNeed } = state

      const initialCount = project.userNeeds.length

      const needId = addUserNeed('Fast Checkout')

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]

      expect(updatedProject.userNeeds.length).toBe(initialCount + 1)

      const addedNeed = updatedProject.userNeeds.find(n => n.id === needId)
      expect(addedNeed).toBeDefined()
      expect(addedNeed?.name).toBe('Fast Checkout')
      expect(addedNeed?.position).toBe(50)
      expect(addedNeed?.visibility).toBe(true)
    })
  })

  describe('updateUserNeed', () => {
    it('should update user need properties', () => {
      const state = useEditorStore.getState()
      const { addUserNeed, updateUserNeed } = state

      const needId = addUserNeed('Original Name')

      updateUserNeed(needId!, {
        name: 'Updated Name',
        description: 'A new description',
        position: 75
      })

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedNeed = updatedProject.userNeeds.find(n => n.id === needId)

      expect(updatedNeed?.name).toBe('Updated Name')
      expect(updatedNeed?.description).toBe('A new description')
      expect(updatedNeed?.position).toBe(75)
    })

    it('should toggle visibility', () => {
      const state = useEditorStore.getState()
      const { addUserNeed, updateUserNeed } = state

      const needId = addUserNeed('Test Need')

      updateUserNeed(needId!, { visibility: false })

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedNeed = updatedProject.userNeeds.find(n => n.id === needId)

      expect(updatedNeed?.visibility).toBe(false)
    })
  })

  describe('deleteUserNeed', () => {
    it('should delete user need', () => {
      const state = useEditorStore.getState()
      const { addUserNeed, deleteUserNeed } = state

      const needId = addUserNeed('To Delete')

      const beforeDelete = useEditorStore.getState()
      const projectBeforeDelete = beforeDelete.projects[beforeDelete.activeProjectId!]
      expect(projectBeforeDelete.userNeeds.find(n => n.id === needId)).toBeDefined()

      deleteUserNeed(needId!)

      const afterDelete = useEditorStore.getState()
      const projectAfterDelete = afterDelete.projects[afterDelete.activeProjectId!]
      expect(projectAfterDelete.userNeeds.find(n => n.id === needId)).toBeUndefined()
    })

    it('should delete associated connections when deleting user need', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addUserNeed, createActorNeedConnection, createNeedContextConnection, deleteUserNeed } = state

      const needId = addUserNeed('Test Need')
      const actorId = project.actors[0]?.id
      const contextId = project.contexts[0]?.id

      if (actorId && contextId) {
        createActorNeedConnection(actorId, needId!)
        createNeedContextConnection(needId!, contextId)

        const beforeDelete = useEditorStore.getState()
        const projectBeforeDelete = beforeDelete.projects[beforeDelete.activeProjectId!]
        expect(projectBeforeDelete.actorNeedConnections.length).toBeGreaterThan(0)
        expect(projectBeforeDelete.needContextConnections.length).toBeGreaterThan(0)

        deleteUserNeed(needId!)

        const afterDelete = useEditorStore.getState()
        const projectAfterDelete = afterDelete.projects[afterDelete.activeProjectId!]
        expect(projectAfterDelete.userNeeds.find(n => n.id === needId)).toBeUndefined()
        expect(projectAfterDelete.actorNeedConnections.find(c => c.userNeedId === needId)).toBeUndefined()
        expect(projectAfterDelete.needContextConnections.find(c => c.userNeedId === needId)).toBeUndefined()
      }
    })
  })

  describe('updateUserNeedPosition', () => {
    it('should update user need position', () => {
      const state = useEditorStore.getState()
      const { addUserNeed, updateUserNeedPosition } = state

      const needId = addUserNeed('Test Need')

      updateUserNeedPosition(needId!, 80)

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedNeed = updatedProject.userNeeds.find(n => n.id === needId)

      expect(updatedNeed?.position).toBe(80)
    })
  })

  describe('setSelectedUserNeed', () => {
    it('should set selected user need', () => {
      const state = useEditorStore.getState()
      const { addUserNeed, setSelectedUserNeed } = state

      const needId = addUserNeed('Test Need')

      setSelectedUserNeed(needId!)

      const updatedState = useEditorStore.getState()
      expect(updatedState.selectedUserNeedId).toBe(needId)
    })

    it('should clear selected user need when passed null', () => {
      const state = useEditorStore.getState()
      const { addUserNeed, setSelectedUserNeed } = state

      const needId = addUserNeed('Test Need')
      setSelectedUserNeed(needId!)

      expect(useEditorStore.getState().selectedUserNeedId).toBe(needId)

      setSelectedUserNeed(null)

      expect(useEditorStore.getState().selectedUserNeedId).toBeNull()
    })
  })
})
