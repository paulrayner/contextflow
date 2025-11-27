import type { EditorState, EditorCommand } from '../storeTypes'
import type { User, UserNeed, UserNeedConnection, NeedContextConnection } from '../types'
import { trackEvent } from '../../utils/analytics'

export function addUserAction(state: EditorState, name: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    position: 50,
  }

  const command: EditorCommand = {
    type: 'addUser',
    payload: {
      user: newUser,
    },
  }

  const updatedProject = {
    ...project,
    users: [...(project.users || []), newUser],
  }

  // Track analytics
  trackEvent('user_added', updatedProject, {
    entity_type: 'user',
    entity_id: newUser.id
  })

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedUserId: newUser.id,
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function deleteUserAction(state: EditorState, userId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const user = project.users?.find(u => u.id === userId)
  if (!user) return state

  const command: EditorCommand = {
    type: 'deleteUser',
    payload: {
      user,
    },
  }

  // Also delete any user need connections for this user
  const updatedUserNeedConnections = (project.userNeedConnections || []).filter(
    unc => unc.userId !== userId
  )

  const updatedProject = {
    ...project,
    users: project.users.filter(u => u.id !== userId),
    userNeedConnections: updatedUserNeedConnections,
  }

  // Track analytics
  const connectionCount = (project.userNeedConnections || []).filter(
    unc => unc.userId === userId
  ).length
  trackEvent('user_deleted', project, {
    entity_type: 'user',
    entity_id: userId,
    metadata: {
      connection_count: connectionCount
    }
  })

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedUserId: state.selectedUserId === userId ? null : state.selectedUserId,
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function updateUserAction(state: EditorState, userId: string, updates: Partial<User>): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const userIndex = project.users?.findIndex(u => u.id === userId) ?? -1
  if (userIndex === -1) return state

  const updatedUsers = [...(project.users || [])]
  updatedUsers[userIndex] = {
    ...updatedUsers[userIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    users: updatedUsers,
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}

export function updateUserPositionAction(state: EditorState, userId: string, newPosition: number): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const userIndex = project.users?.findIndex(u => u.id === userId) ?? -1
  if (userIndex === -1) return state

  const user = project.users[userIndex]
  const oldPosition = user.position

  const updatedUsers = [...(project.users || [])]
  updatedUsers[userIndex] = {
    ...updatedUsers[userIndex],
    position: newPosition,
  }

  const updatedProject = {
    ...project,
    users: updatedUsers,
  }

  // Add to undo stack
  const command: EditorCommand = {
    type: 'moveUser',
    payload: {
      userId,
      oldPosition,
      newPosition,
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
}

export function addUserNeedAction(state: EditorState, name: string): { newState: Partial<EditorState>, newUserNeedId: string | null } {
  const projectId = state.activeProjectId
  if (!projectId) return { newState: state, newUserNeedId: null }

  const project = state.projects[projectId]
  if (!project) return { newState: state, newUserNeedId: null }

  const newUserNeed: UserNeed = {
    id: `need-${Date.now()}`,
    name,
    position: 50,
    visibility: true,
  }

  const updatedProject = {
    ...project,
    userNeeds: [...(project.userNeeds || []), newUserNeed],
  }

  // Track analytics
  trackEvent('user_need_added', updatedProject, {
    entity_type: 'user_need',
    entity_id: newUserNeed.id
  })

  return {
    newState: {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      selectedUserNeedId: newUserNeed.id,
    },
    newUserNeedId: newUserNeed.id
  }
}

export function deleteUserNeedAction(state: EditorState, userNeedId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const updatedProject = {
    ...project,
    userNeeds: (project.userNeeds || []).filter(n => n.id !== userNeedId),
    userNeedConnections: (project.userNeedConnections || []).filter(c => c.userNeedId !== userNeedId),
    needContextConnections: (project.needContextConnections || []).filter(c => c.userNeedId !== userNeedId),
  }

  // Track analytics
  const userConnectionCount = (project.userNeedConnections || []).filter(c => c.userNeedId === userNeedId).length
  const contextConnectionCount = (project.needContextConnections || []).filter(c => c.userNeedId === userNeedId).length
  trackEvent('user_need_deleted', project, {
    entity_type: 'user_need',
    entity_id: userNeedId,
    metadata: {
      user_connection_count: userConnectionCount,
      context_connection_count: contextConnectionCount
    }
  })

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedUserNeedId: state.selectedUserNeedId === userNeedId ? null : state.selectedUserNeedId,
  }
}

export function updateUserNeedAction(state: EditorState, userNeedId: string, updates: Partial<UserNeed>): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const needIndex = project.userNeeds?.findIndex(n => n.id === userNeedId) ?? -1
  if (needIndex === -1) return state

  const updatedNeeds = [...(project.userNeeds || [])]
  updatedNeeds[needIndex] = {
    ...updatedNeeds[needIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    userNeeds: updatedNeeds,
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}

export function updateUserNeedPositionAction(state: EditorState, userNeedId: string, newPosition: number): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const needIndex = project.userNeeds?.findIndex(n => n.id === userNeedId) ?? -1
  if (needIndex === -1) return state

  const updatedNeeds = [...(project.userNeeds || [])]
  const oldPosition = updatedNeeds[needIndex].position

  updatedNeeds[needIndex] = {
    ...updatedNeeds[needIndex],
    position: newPosition,
  }

  const updatedProject = {
    ...project,
    userNeeds: updatedNeeds,
  }

  const command: EditorCommand = {
    type: 'moveUserNeed',
    payload: {
      userNeedId,
      oldPosition,
      newPosition,
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
}

export function createUserNeedConnectionAction(state: EditorState, userId: string, userNeedId: string): { newState: Partial<EditorState>, newConnectionId: string | null } {
  const projectId = state.activeProjectId
  if (!projectId) return { newState: state, newConnectionId: null }

  const project = state.projects[projectId]
  if (!project) return { newState: state, newConnectionId: null }

  const newConnection: UserNeedConnection = {
    id: `user-need-conn-${Date.now()}`,
    userId,
    userNeedId,
  }

  const command: EditorCommand = {
    type: 'addUserNeedConnection',
    payload: {
      userNeedConnection: newConnection,
    },
  }

  const updatedProject = {
    ...project,
    userNeedConnections: [...(project.userNeedConnections || []), newConnection],
  }

  // Track analytics
  trackEvent('user_need_connection_created', updatedProject, {
    entity_type: 'user_need_connection',
    entity_id: newConnection.id,
    metadata: {
      user_id: userId,
      user_need_id: userNeedId
    }
  })

  return {
    newState: {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    },
    newConnectionId: newConnection.id
  }
}

export function deleteUserNeedConnectionAction(state: EditorState, connectionId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const connection = project.userNeedConnections?.find(c => c.id === connectionId)
  if (!connection) return state

  const command: EditorCommand = {
    type: 'deleteUserNeedConnection',
    payload: {
      userNeedConnection: connection,
    },
  }

  const updatedProject = {
    ...project,
    userNeedConnections: (project.userNeedConnections || []).filter(c => c.id !== connectionId),
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function updateUserNeedConnectionAction(state: EditorState, connectionId: string, updates: Partial<UserNeedConnection>): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const connectionIndex = project.userNeedConnections?.findIndex(c => c.id === connectionId) ?? -1
  if (connectionIndex === -1) return state

  const updatedConnections = [...(project.userNeedConnections || [])]
  updatedConnections[connectionIndex] = {
    ...updatedConnections[connectionIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    userNeedConnections: updatedConnections,
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}

export function createNeedContextConnectionAction(state: EditorState, userNeedId: string, contextId: string): { newState: Partial<EditorState>, newConnectionId: string | null } {
  const projectId = state.activeProjectId
  if (!projectId) return { newState: state, newConnectionId: null }

  const project = state.projects[projectId]
  if (!project) return { newState: state, newConnectionId: null }

  const newConnection: NeedContextConnection = {
    id: `need-context-conn-${Date.now()}`,
    userNeedId,
    contextId,
  }

  const command: EditorCommand = {
    type: 'addNeedContextConnection',
    payload: {
      needContextConnection: newConnection,
    },
  }

  const updatedProject = {
    ...project,
    needContextConnections: [...(project.needContextConnections || []), newConnection],
  }

  // Track analytics
  trackEvent('need_context_connection_created', updatedProject, {
    entity_type: 'need_context_connection',
    entity_id: newConnection.id,
    metadata: {
      user_need_id: userNeedId,
      context_id: contextId
    }
  })

  return {
    newState: {
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
      undoStack: [...state.undoStack, command],
      redoStack: [],
    },
    newConnectionId: newConnection.id
  }
}

export function deleteNeedContextConnectionAction(state: EditorState, connectionId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const connection = project.needContextConnections?.find(c => c.id === connectionId)
  if (!connection) return state

  const command: EditorCommand = {
    type: 'deleteNeedContextConnection',
    payload: {
      needContextConnection: connection,
    },
  }

  const updatedProject = {
    ...project,
    needContextConnections: (project.needContextConnections || []).filter(c => c.id !== connectionId),
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function updateNeedContextConnectionAction(state: EditorState, connectionId: string, updates: Partial<NeedContextConnection>): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const connectionIndex = project.needContextConnections?.findIndex(c => c.id === connectionId) ?? -1
  if (connectionIndex === -1) return state

  const updatedConnections = [...(project.needContextConnections || [])]
  updatedConnections[connectionIndex] = {
    ...updatedConnections[connectionIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    needContextConnections: updatedConnections,
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}
