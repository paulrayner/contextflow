import { describe, it, expect, vi } from 'vitest'
import {
  addUserAction,
  deleteUserAction,
  updateUserAction,
  updateUserPositionAction,
  addUserNeedAction,
  deleteUserNeedAction,
  updateUserNeedAction,
  updateUserNeedPositionAction,
  createUserNeedConnectionAction,
  deleteUserNeedConnectionAction,
  updateUserNeedConnectionAction,
  createNeedContextConnectionAction,
  deleteNeedContextConnectionAction,
  updateNeedContextConnectionAction,
} from './userActions'
import { createMockState } from './__testFixtures__/mockState'

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
}))

describe('userActions', () => {
  describe('addUserAction', () => {
    it('should add a new user to the project', () => {
      const state = createMockState()
      const result = addUserAction(state, 'Customer')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.users).toHaveLength(1)
      expect(updatedProject?.users[0].name).toBe('Customer')
      expect(updatedProject?.users[0].position).toBe(50)
    })

    it('should set selectedUserId to new user', () => {
      const state = createMockState()
      const result = addUserAction(state, 'Customer')

      const updatedProject = result.projects?.['test-project']
      expect(result.selectedUserId).toBe(updatedProject?.users[0].id)
    })

    it('should add to undo stack', () => {
      const state = createMockState()
      const result = addUserAction(state, 'Customer')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('addUser')
    })

    it('should clear redo stack', () => {
      const state = createMockState()
      state.redoStack = [{ type: 'addUser', payload: { user: { id: 'old', name: 'Old', position: 50 } } }]
      const result = addUserAction(state, 'Customer')

      expect(result.redoStack).toEqual([])
    })

    it('should return unchanged state if no active project', () => {
      const state = createMockState()
      state.activeProjectId = null
      const result = addUserAction(state, 'Customer')

      expect(result).toBe(state)
    })
  })

  describe('deleteUserAction', () => {
    it('should delete a user from the project', () => {
      const state = createMockState({
        users: [{ id: 'user-1', name: 'Customer', position: 50 }],
      })
      const result = deleteUserAction(state, 'user-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.users).toHaveLength(0)
    })

    it('should delete all user-need connections for the user', () => {
      const state = createMockState({
        users: [{ id: 'user-1', name: 'Customer', position: 50 }],
        userNeedConnections: [
          { id: 'conn-1', userId: 'user-1', userNeedId: 'need-1' },
          { id: 'conn-2', userId: 'user-2', userNeedId: 'need-1' },
        ],
      })
      const result = deleteUserAction(state, 'user-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeedConnections).toHaveLength(1)
      expect(updatedProject?.userNeedConnections[0].id).toBe('conn-2')
    })

    it('should clear selectedUserId if deleted user was selected', () => {
      const state = createMockState({
        users: [{ id: 'user-1', name: 'Customer', position: 50 }],
      })
      state.selectedUserId = 'user-1'
      const result = deleteUserAction(state, 'user-1')

      expect(result.selectedUserId).toBeNull()
    })

    it('should add to undo stack', () => {
      const state = createMockState({
        users: [{ id: 'user-1', name: 'Customer', position: 50 }],
      })
      const result = deleteUserAction(state, 'user-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteUser')
    })

    it('should return unchanged state if user not found', () => {
      const state = createMockState()
      const result = deleteUserAction(state, 'nonexistent')

      expect(result).toBe(state)
    })
  })

  describe('updateUserAction', () => {
    it('should update user properties', () => {
      const state = createMockState({
        users: [{ id: 'user-1', name: 'Customer', position: 50 }],
      })
      const result = updateUserAction(state, 'user-1', { name: 'Updated Customer' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.users[0].name).toBe('Updated Customer')
    })

    it('should return unchanged state if user not found', () => {
      const state = createMockState()
      const result = updateUserAction(state, 'nonexistent', { name: 'Test' })

      expect(result).toBe(state)
    })
  })

  describe('updateUserPositionAction', () => {
    it('should update user position', () => {
      const state = createMockState({
        users: [{ id: 'user-1', name: 'Customer', position: 50 }],
      })
      const result = updateUserPositionAction(state, 'user-1', 75)

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.users[0].position).toBe(75)
    })

    it('should add to undo stack with old and new positions', () => {
      const state = createMockState({
        users: [{ id: 'user-1', name: 'Customer', position: 50 }],
      })
      const result = updateUserPositionAction(state, 'user-1', 75)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('moveUser')
      expect(result.undoStack?.[0].payload.oldPosition).toBe(50)
      expect(result.undoStack?.[0].payload.newPosition).toBe(75)
    })
  })

  describe('addUserNeedAction', () => {
    it('should add a new user need to the project', () => {
      const state = createMockState()
      const { newState, newUserNeedId } = addUserNeedAction(state, 'Track Orders')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.userNeeds).toHaveLength(1)
      expect(updatedProject?.userNeeds[0].name).toBe('Track Orders')
      expect(updatedProject?.userNeeds[0].position).toBe(50)
      expect(updatedProject?.userNeeds[0].visibility).toBe(true)
      expect(newUserNeedId).toBe(updatedProject?.userNeeds[0].id)
    })

    it('should set selectedUserNeedId to new need', () => {
      const state = createMockState()
      const { newState } = addUserNeedAction(state, 'Track Orders')

      expect(newState.selectedUserNeedId).toBeDefined()
    })

    it('should return null if no active project', () => {
      const state = createMockState()
      state.activeProjectId = null
      const { newUserNeedId } = addUserNeedAction(state, 'Track Orders')

      expect(newUserNeedId).toBeNull()
    })
  })

  describe('deleteUserNeedAction', () => {
    it('should delete a user need from the project', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      const result = deleteUserNeedAction(state, 'need-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeeds).toHaveLength(0)
    })

    it('should delete all user-need connections for the need', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
        userNeedConnections: [
          { id: 'conn-1', userId: 'user-1', userNeedId: 'need-1' },
          { id: 'conn-2', userId: 'user-1', userNeedId: 'need-2' },
        ],
      })
      const result = deleteUserNeedAction(state, 'need-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeedConnections).toHaveLength(1)
      expect(updatedProject?.userNeedConnections[0].userNeedId).toBe('need-2')
    })

    it('should delete all need-context connections for the need', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
        needContextConnections: [
          { id: 'conn-1', userNeedId: 'need-1', contextId: 'ctx-1' },
          { id: 'conn-2', userNeedId: 'need-2', contextId: 'ctx-1' },
        ],
      })
      const result = deleteUserNeedAction(state, 'need-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.needContextConnections).toHaveLength(1)
      expect(updatedProject?.needContextConnections[0].userNeedId).toBe('need-2')
    })

    it('should clear selectedUserNeedId if deleted need was selected', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      state.selectedUserNeedId = 'need-1'
      const result = deleteUserNeedAction(state, 'need-1')

      expect(result.selectedUserNeedId).toBeNull()
    })
  })

  describe('updateUserNeedAction', () => {
    it('should update user need properties', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      const result = updateUserNeedAction(state, 'need-1', { name: 'Track All Orders' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeeds[0].name).toBe('Track All Orders')
    })

    it('should return unchanged state if need not found', () => {
      const state = createMockState()
      const result = updateUserNeedAction(state, 'nonexistent', { name: 'Test' })

      expect(result).toBe(state)
    })
  })

  describe('updateUserNeedPositionAction', () => {
    it('should update user need position', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      const result = updateUserNeedPositionAction(state, 'need-1', 75)

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeeds[0].position).toBe(75)
    })

    it('should add to undo stack with old and new positions', () => {
      const state = createMockState({
        userNeeds: [{ id: 'need-1', name: 'Track Orders', position: 50, visibility: true }],
      })
      const result = updateUserNeedPositionAction(state, 'need-1', 75)

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('moveUserNeed')
      expect(result.undoStack?.[0].payload.oldPosition).toBe(50)
      expect(result.undoStack?.[0].payload.newPosition).toBe(75)
    })
  })

  describe('createUserNeedConnectionAction', () => {
    it('should create a connection between user and user need', () => {
      const state = createMockState()
      const { newState } = createUserNeedConnectionAction(state, 'user-1', 'need-1')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.userNeedConnections).toHaveLength(1)
      expect(updatedProject?.userNeedConnections[0].userId).toBe('user-1')
      expect(updatedProject?.userNeedConnections[0].userNeedId).toBe('need-1')
    })

    it('should add to undo stack', () => {
      const state = createMockState()
      const { newState } = createUserNeedConnectionAction(state, 'user-1', 'need-1')

      expect(newState.undoStack).toHaveLength(1)
      expect(newState.undoStack?.[0].type).toBe('addUserNeedConnection')
    })

    it('should return connection id', () => {
      const state = createMockState()
      const { newConnectionId } = createUserNeedConnectionAction(state, 'user-1', 'need-1')

      expect(newConnectionId).toBeDefined()
      expect(newConnectionId).not.toBeNull()
    })
  })

  describe('deleteUserNeedConnectionAction', () => {
    it('should delete a user-need connection', () => {
      const state = createMockState({
        userNeedConnections: [{ id: 'conn-1', userId: 'user-1', userNeedId: 'need-1' }],
      })
      const result = deleteUserNeedConnectionAction(state, 'conn-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeedConnections).toHaveLength(0)
    })

    it('should add to undo stack', () => {
      const state = createMockState({
        userNeedConnections: [{ id: 'conn-1', userId: 'user-1', userNeedId: 'need-1' }],
      })
      const result = deleteUserNeedConnectionAction(state, 'conn-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteUserNeedConnection')
    })
  })

  describe('updateUserNeedConnectionAction', () => {
    it('should update user-need connection properties', () => {
      const state = createMockState({
        userNeedConnections: [{ id: 'conn-1', userId: 'user-1', userNeedId: 'need-1' }],
      })
      const result = updateUserNeedConnectionAction(state, 'conn-1', { userNeedId: 'need-2' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.userNeedConnections[0].userNeedId).toBe('need-2')
    })
  })

  describe('createNeedContextConnectionAction', () => {
    it('should create a connection between user need and context', () => {
      const state = createMockState()
      const { newState } = createNeedContextConnectionAction(state, 'need-1', 'ctx-1')

      const updatedProject = newState.projects?.['test-project']
      expect(updatedProject?.needContextConnections).toHaveLength(1)
      expect(updatedProject?.needContextConnections[0].userNeedId).toBe('need-1')
      expect(updatedProject?.needContextConnections[0].contextId).toBe('ctx-1')
    })

    it('should add to undo stack', () => {
      const state = createMockState()
      const { newState } = createNeedContextConnectionAction(state, 'need-1', 'ctx-1')

      expect(newState.undoStack).toHaveLength(1)
      expect(newState.undoStack?.[0].type).toBe('addNeedContextConnection')
    })

    it('should return connection id', () => {
      const state = createMockState()
      const { newConnectionId } = createNeedContextConnectionAction(state, 'need-1', 'ctx-1')

      expect(newConnectionId).toBeDefined()
      expect(newConnectionId).not.toBeNull()
    })
  })

  describe('deleteNeedContextConnectionAction', () => {
    it('should delete a need-context connection', () => {
      const state = createMockState({
        needContextConnections: [{ id: 'conn-1', userNeedId: 'need-1', contextId: 'ctx-1' }],
      })
      const result = deleteNeedContextConnectionAction(state, 'conn-1')

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.needContextConnections).toHaveLength(0)
    })

    it('should add to undo stack', () => {
      const state = createMockState({
        needContextConnections: [{ id: 'conn-1', userNeedId: 'need-1', contextId: 'ctx-1' }],
      })
      const result = deleteNeedContextConnectionAction(state, 'conn-1')

      expect(result.undoStack).toHaveLength(1)
      expect(result.undoStack?.[0].type).toBe('deleteNeedContextConnection')
    })
  })

  describe('updateNeedContextConnectionAction', () => {
    it('should update need-context connection properties', () => {
      const state = createMockState({
        needContextConnections: [{ id: 'conn-1', userNeedId: 'need-1', contextId: 'ctx-1' }],
      })
      const result = updateNeedContextConnectionAction(state, 'conn-1', { contextId: 'ctx-2' })

      const updatedProject = result.projects?.['test-project']
      expect(updatedProject?.needContextConnections[0].contextId).toBe('ctx-2')
    })
  })
})
