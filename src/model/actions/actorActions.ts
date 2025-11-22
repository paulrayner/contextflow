import type { EditorState, EditorCommand } from '../storeTypes'
import type { Project, Actor, UserNeed, ActorConnection, ActorNeedConnection, NeedContextConnection } from '../types'
import { trackEvent } from '../../utils/analytics'

export function addActorAction(state: EditorState, name: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const newActor: Actor = {
    id: `actor-${Date.now()}`,
    name,
    position: 50,
  }

  const command: EditorCommand = {
    type: 'addActor',
    payload: {
      actor: newActor,
    },
  }

  const updatedProject = {
    ...project,
    actors: [...(project.actors || []), newActor],
  }

  // Track analytics
  trackEvent('actor_added', updatedProject, {
    entity_type: 'actor',
    entity_id: newActor.id
  })

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedActorId: newActor.id,
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function deleteActorAction(state: EditorState, actorId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const actor = project.actors?.find(a => a.id === actorId)
  if (!actor) return state

  const command: EditorCommand = {
    type: 'deleteActor',
    payload: {
      actor,
    },
  }

  // Also delete any actor connections for this actor
  const updatedActorConnections = (project.actorConnections || []).filter(
    ac => ac.actorId !== actorId
  )

  const updatedProject = {
    ...project,
    actors: project.actors.filter(a => a.id !== actorId),
    actorConnections: updatedActorConnections,
  }

  // Track analytics
  const connectionCount = (project.actorConnections || []).filter(
    ac => ac.actorId === actorId
  ).length
  trackEvent('actor_deleted', project, {
    entity_type: 'actor',
    entity_id: actorId,
    metadata: {
      connection_count: connectionCount
    }
  })

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedActorId: state.selectedActorId === actorId ? null : state.selectedActorId,
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function updateActorAction(state: EditorState, actorId: string, updates: Partial<Actor>): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const actorIndex = project.actors?.findIndex(a => a.id === actorId) ?? -1
  if (actorIndex === -1) return state

  const updatedActors = [...(project.actors || [])]
  updatedActors[actorIndex] = {
    ...updatedActors[actorIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    actors: updatedActors,
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}

export function updateActorPositionAction(state: EditorState, actorId: string, newPosition: number): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const actorIndex = project.actors?.findIndex(a => a.id === actorId) ?? -1
  if (actorIndex === -1) return state

  const actor = project.actors[actorIndex]
  const oldPosition = actor.position

  const updatedActors = [...(project.actors || [])]
  updatedActors[actorIndex] = {
    ...updatedActors[actorIndex],
    position: newPosition,
  }

  const updatedProject = {
    ...project,
    actors: updatedActors,
  }

  // Add to undo stack
  const command: EditorCommand = {
    type: 'moveActor',
    payload: {
      actorId,
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

export function createActorConnectionAction(state: EditorState, actorId: string, contextId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const newConnection: ActorConnection = {
    id: `actor-conn-${Date.now()}`,
    actorId,
    contextId,
  }

  const command: EditorCommand = {
    type: 'addActorConnection',
    payload: {
      actorConnection: newConnection,
    },
  }

  const updatedProject = {
    ...project,
    actorConnections: [...(project.actorConnections || []), newConnection],
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

export function deleteActorConnectionAction(state: EditorState, connectionId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const connection = project.actorConnections?.find(ac => ac.id === connectionId)
  if (!connection) return state

  const command: EditorCommand = {
    type: 'deleteActorConnection',
    payload: {
      actorConnection: connection,
    },
  }

  const updatedProject = {
    ...project,
    actorConnections: (project.actorConnections || []).filter(ac => ac.id !== connectionId),
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedActorConnectionId: state.selectedActorConnectionId === connectionId ? null : state.selectedActorConnectionId,
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function updateActorConnectionAction(state: EditorState, connectionId: string, updates: Partial<ActorConnection>): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const connectionIndex = project.actorConnections?.findIndex(ac => ac.id === connectionId) ?? -1
  if (connectionIndex === -1) return state

  const updatedConnections = [...(project.actorConnections || [])]
  updatedConnections[connectionIndex] = {
    ...updatedConnections[connectionIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    actorConnections: updatedConnections,
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
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
    actorNeedConnections: (project.actorNeedConnections || []).filter(c => c.userNeedId !== userNeedId),
    needContextConnections: (project.needContextConnections || []).filter(c => c.userNeedId !== userNeedId),
  }

  // Track analytics
  const actorConnectionCount = (project.actorNeedConnections || []).filter(c => c.userNeedId === userNeedId).length
  const contextConnectionCount = (project.needContextConnections || []).filter(c => c.userNeedId === userNeedId).length
  trackEvent('user_need_deleted', project, {
    entity_type: 'user_need',
    entity_id: userNeedId,
    metadata: {
      actor_connection_count: actorConnectionCount,
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

export function createActorNeedConnectionAction(state: EditorState, actorId: string, userNeedId: string): { newState: Partial<EditorState>, newConnectionId: string | null } {
  const projectId = state.activeProjectId
  if (!projectId) return { newState: state, newConnectionId: null }

  const project = state.projects[projectId]
  if (!project) return { newState: state, newConnectionId: null }

  const newConnection: ActorNeedConnection = {
    id: `actor-need-conn-${Date.now()}`,
    actorId,
    userNeedId,
  }

  const command: EditorCommand = {
    type: 'addActorNeedConnection',
    payload: {
      actorNeedConnection: newConnection,
    },
  }

  const updatedProject = {
    ...project,
    actorNeedConnections: [...(project.actorNeedConnections || []), newConnection],
  }

  // Track analytics
  trackEvent('actor_need_connection_created', updatedProject, {
    entity_type: 'actor_need_connection',
    entity_id: newConnection.id,
    metadata: {
      actor_id: actorId,
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

export function deleteActorNeedConnectionAction(state: EditorState, connectionId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const connection = project.actorNeedConnections?.find(c => c.id === connectionId)
  if (!connection) return state

  const command: EditorCommand = {
    type: 'deleteActorNeedConnection',
    payload: {
      actorNeedConnection: connection,
    },
  }

  const updatedProject = {
    ...project,
    actorNeedConnections: (project.actorNeedConnections || []).filter(c => c.id !== connectionId),
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

export function updateActorNeedConnectionAction(state: EditorState, connectionId: string, updates: Partial<ActorNeedConnection>): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const connectionIndex = project.actorNeedConnections?.findIndex(c => c.id === connectionId) ?? -1
  if (connectionIndex === -1) return state

  const updatedConnections = [...(project.actorNeedConnections || [])]
  updatedConnections[connectionIndex] = {
    ...updatedConnections[connectionIndex],
    ...updates,
  }

  const updatedProject = {
    ...project,
    actorNeedConnections: updatedConnections,
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
