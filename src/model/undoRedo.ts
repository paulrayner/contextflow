import type { Project, BoundedContext, User, UserNeed, UserNeedConnection, NeedContextConnection, TemporalKeyframe } from './types'
import type { EditorCommand } from './storeTypes'

/**
 * Apply undo operation to a project based on the given command.
 * Returns a new project with the undo operation applied.
 */
export function applyUndo(project: Project, command: EditorCommand): Project {
  let newContexts = project.contexts
  let newRepos = project.repos
  let newGroups = project.groups
  let newRelationships = project.relationships
  let newUsers = project.users || []
  let newUserNeeds = project.userNeeds || []
  let newUserNeedConnections = project.userNeedConnections || []
  let newNeedContextConnections = project.needContextConnections || []

  if (command.type === 'moveContext' && command.payload.contextId && command.payload.oldPositions) {
    const contextIndex = newContexts.findIndex(c => c.id === command.payload.contextId)
    if (contextIndex !== -1) {
      newContexts = [...newContexts]
      newContexts[contextIndex] = {
        ...newContexts[contextIndex],
        positions: command.payload.oldPositions,
      }
    }
  } else if (command.type === 'moveContextGroup' && command.payload.positionsMap) {
    // Restore old positions for all moved contexts
    newContexts = newContexts.map(context => {
      const positionData = command.payload.positionsMap?.[context.id]
      if (positionData) {
        return {
          ...context,
          positions: positionData.old
        }
      }
      return context
    })
  } else if (command.type === 'addContext' && command.payload.context) {
    newContexts = newContexts.filter(c => c.id !== command.payload.context?.id)
  } else if (command.type === 'deleteContext' && command.payload.context) {
    newContexts = [...newContexts, command.payload.context]
  } else if (command.type === 'assignRepo' && command.payload.repoId) {
    const repoIndex = newRepos.findIndex(r => r.id === command.payload.repoId)
    if (repoIndex !== -1) {
      newRepos = [...newRepos]
      newRepos[repoIndex] = {
        ...newRepos[repoIndex],
        contextId: command.payload.oldContextId,
      }
    }
  } else if (command.type === 'unassignRepo' && command.payload.repoId) {
    const repoIndex = newRepos.findIndex(r => r.id === command.payload.repoId)
    if (repoIndex !== -1) {
      newRepos = [...newRepos]
      newRepos[repoIndex] = {
        ...newRepos[repoIndex],
        contextId: command.payload.oldContextId,
      }
    }
  } else if (command.type === 'addGroup' && command.payload.group) {
    newGroups = newGroups.filter(g => g.id !== command.payload.group?.id)
  } else if (command.type === 'deleteGroup' && command.payload.group) {
    newGroups = [...newGroups, command.payload.group]
  } else if (command.type === 'removeFromGroup' && command.payload.groupId && command.payload.contextId) {
    // Re-add the context to the group
    const groupIndex = newGroups.findIndex(g => g.id === command.payload.groupId)
    if (groupIndex !== -1) {
      newGroups = [...newGroups]
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        contextIds: [...newGroups[groupIndex].contextIds, command.payload.contextId],
      }
    }
  } else if (command.type === 'addToGroup' && command.payload.groupId) {
    const groupIndex = newGroups.findIndex(g => g.id === command.payload.groupId)
    if (groupIndex !== -1) {
      newGroups = [...newGroups]
      const contextsToRemove = command.payload.contextIds || [command.payload.contextId]
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        contextIds: newGroups[groupIndex].contextIds.filter(id => !contextsToRemove.includes(id)),
      }
    }
  } else if (command.type === 'addRelationship' && command.payload.relationship) {
    newRelationships = newRelationships.filter(r => r.id !== command.payload.relationship?.id)
  } else if (command.type === 'deleteRelationship' && command.payload.relationship) {
    newRelationships = [...newRelationships, command.payload.relationship]
  } else if (command.type === 'updateRelationship' && command.payload.relationshipId && command.payload.oldRelationship) {
    const relIndex = newRelationships.findIndex(r => r.id === command.payload.relationshipId)
    if (relIndex !== -1) {
      newRelationships = [...newRelationships]
      newRelationships[relIndex] = command.payload.oldRelationship
    }
  } else if (command.type === 'addUser' && command.payload.user) {
    newUsers = newUsers.filter(u => u.id !== command.payload.user?.id)
  } else if (command.type === 'deleteUser' && command.payload.user) {
    newUsers = [...newUsers, command.payload.user]
  } else if (command.type === 'moveUser' && command.payload.userId && command.payload.oldPosition !== undefined) {
    const userIndex = newUsers.findIndex(u => u.id === command.payload.userId)
    if (userIndex !== -1) {
      newUsers = [...newUsers]
      newUsers[userIndex] = {
        ...newUsers[userIndex],
        position: command.payload.oldPosition,
      }
    }
  } else if (command.type === 'addUserNeed' && command.payload.userNeed) {
    newUserNeeds = newUserNeeds.filter(n => n.id !== command.payload.userNeed?.id)
  } else if (command.type === 'deleteUserNeed' && command.payload.userNeed) {
    newUserNeeds = [...newUserNeeds, command.payload.userNeed]
  } else if (command.type === 'moveUserNeed' && command.payload.userNeedId && command.payload.oldPosition !== undefined) {
    const needIndex = newUserNeeds.findIndex(n => n.id === command.payload.userNeedId)
    if (needIndex !== -1) {
      newUserNeeds = [...newUserNeeds]
      newUserNeeds[needIndex] = {
        ...newUserNeeds[needIndex],
        position: command.payload.oldPosition,
      }
    }
  } else if (command.type === 'addUserNeedConnection' && command.payload.userNeedConnection) {
    newUserNeedConnections = newUserNeedConnections.filter(c => c.id !== command.payload.userNeedConnection?.id)
  } else if (command.type === 'deleteUserNeedConnection' && command.payload.userNeedConnection) {
    newUserNeedConnections = [...newUserNeedConnections, command.payload.userNeedConnection]
  } else if (command.type === 'addNeedContextConnection' && command.payload.needContextConnection) {
    newNeedContextConnections = newNeedContextConnections.filter(c => c.id !== command.payload.needContextConnection?.id)
  } else if (command.type === 'deleteNeedContextConnection' && command.payload.needContextConnection) {
    newNeedContextConnections = [...newNeedContextConnections, command.payload.needContextConnection]
  }

  // Handle flow stage commands
  let newFlowStages = project.viewConfig.flowStages
  if (command.type === 'updateFlowStage' && command.payload.flowStageIndex !== undefined && command.payload.oldFlowStage) {
    newFlowStages = [...newFlowStages]
    newFlowStages[command.payload.flowStageIndex] = command.payload.oldFlowStage
  } else if (command.type === 'addFlowStage' && command.payload.flowStage) {
    newFlowStages = newFlowStages.filter(s => s.name !== command.payload.flowStage?.name && s.position !== command.payload.flowStage?.position)
  } else if (command.type === 'deleteFlowStage' && command.payload.flowStageIndex !== undefined && command.payload.flowStage) {
    newFlowStages = [...newFlowStages]
    newFlowStages.splice(command.payload.flowStageIndex, 0, command.payload.flowStage)
  }

  // Handle temporal commands
  let newTemporal = project.temporal
  if (command.type === 'createKeyframe') {
    // Undo keyframe creation by removing all created keyframes (may be multiple)
    const keyframesToRemove = command.payload.keyframes || (command.payload.keyframe ? [command.payload.keyframe] : [])
    const idsToRemove = new Set(keyframesToRemove.map(kf => kf.id))
    newTemporal = {
      ...newTemporal,
      enabled: newTemporal?.enabled || false,
      keyframes: (newTemporal?.keyframes || []).filter(kf => !idsToRemove.has(kf.id)),
    }
  } else if (command.type === 'deleteKeyframe' && command.payload.keyframe) {
    // Undo keyframe deletion by re-adding it
    const keyframes = [...(newTemporal?.keyframes || []), command.payload.keyframe].sort((a, b) => a.date.localeCompare(b.date))
    newTemporal = {
      ...newTemporal,
      enabled: newTemporal?.enabled || false,
      keyframes,
    }
  } else if (command.type === 'updateKeyframe' && command.payload.keyframeId && command.payload.oldKeyframeData) {
    // Restore old keyframe data
    newTemporal = {
      ...newTemporal,
      enabled: newTemporal?.enabled || false,
      keyframes: (newTemporal?.keyframes || []).map(kf =>
        kf.id === command.payload.keyframeId ? { ...kf, ...command.payload.oldKeyframeData } : kf
      ),
    }
  } else if (command.type === 'moveContextInKeyframe' && command.payload.keyframeId && command.payload.contextId && command.payload.oldPositions) {
    // Restore old context position in keyframe
    const oldX = command.payload.oldPositions.strategic.x
    const oldY = command.payload.oldPositions.shared.y
    newTemporal = {
      ...newTemporal,
      enabled: newTemporal?.enabled || false,
      keyframes: (newTemporal?.keyframes || []).map(kf =>
        kf.id === command.payload.keyframeId ? {
          ...kf,
          positions: {
            ...kf.positions,
            [command.payload.contextId!]: { x: oldX, y: oldY },
          },
        } : kf
      ),
    }
  }

  return {
    ...project,
    contexts: newContexts,
    repos: newRepos,
    groups: newGroups,
    relationships: newRelationships,
    users: newUsers,
    userNeeds: newUserNeeds,
    userNeedConnections: newUserNeedConnections,
    needContextConnections: newNeedContextConnections,
    viewConfig: {
      ...project.viewConfig,
      flowStages: newFlowStages,
    },
    temporal: newTemporal,
  }
}

/**
 * Apply redo operation to a project based on the given command.
 * Returns a new project with the redo operation applied.
 */
export function applyRedo(project: Project, command: EditorCommand): Project {
  let newContexts = project.contexts
  let newRepos = project.repos
  let newGroups = project.groups
  let newRelationships = project.relationships
  let newUsers = project.users || []
  let newUserNeeds = project.userNeeds || []
  let newUserNeedConnections = project.userNeedConnections || []
  let newNeedContextConnections = project.needContextConnections || []

  if (command.type === 'moveContext' && command.payload.contextId && command.payload.newPositions) {
    const contextIndex = newContexts.findIndex(c => c.id === command.payload.contextId)
    if (contextIndex !== -1) {
      newContexts = [...newContexts]
      newContexts[contextIndex] = {
        ...newContexts[contextIndex],
        positions: command.payload.newPositions,
      }
    }
  } else if (command.type === 'moveContextGroup' && command.payload.positionsMap) {
    // Restore new positions for all moved contexts
    newContexts = newContexts.map(context => {
      const positionData = command.payload.positionsMap?.[context.id]
      if (positionData) {
        return {
          ...context,
          positions: positionData.new
        }
      }
      return context
    })
  } else if (command.type === 'addContext' && command.payload.context) {
    newContexts = [...newContexts, command.payload.context]
  } else if (command.type === 'deleteContext' && command.payload.context) {
    newContexts = newContexts.filter(c => c.id !== command.payload.context?.id)
  } else if (command.type === 'assignRepo' && command.payload.repoId && command.payload.newContextId) {
    const repoIndex = newRepos.findIndex(r => r.id === command.payload.repoId)
    if (repoIndex !== -1) {
      newRepos = [...newRepos]
      newRepos[repoIndex] = {
        ...newRepos[repoIndex],
        contextId: command.payload.newContextId,
      }
    }
  } else if (command.type === 'unassignRepo' && command.payload.repoId) {
    const repoIndex = newRepos.findIndex(r => r.id === command.payload.repoId)
    if (repoIndex !== -1) {
      newRepos = [...newRepos]
      newRepos[repoIndex] = {
        ...newRepos[repoIndex],
        contextId: undefined,
      }
    }
  } else if (command.type === 'addGroup' && command.payload.group) {
    newGroups = [...newGroups, command.payload.group]
  } else if (command.type === 'deleteGroup' && command.payload.group) {
    newGroups = newGroups.filter(g => g.id !== command.payload.group?.id)
  } else if (command.type === 'removeFromGroup' && command.payload.groupId && command.payload.contextId) {
    // Remove the context from the group
    const groupIndex = newGroups.findIndex(g => g.id === command.payload.groupId)
    if (groupIndex !== -1) {
      newGroups = [...newGroups]
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        contextIds: newGroups[groupIndex].contextIds.filter(id => id !== command.payload.contextId),
      }
    }
  } else if (command.type === 'addToGroup' && command.payload.groupId) {
    const groupIndex = newGroups.findIndex(g => g.id === command.payload.groupId)
    if (groupIndex !== -1) {
      newGroups = [...newGroups]
      const contextsToAdd = command.payload.contextIds ?? (command.payload.contextId ? [command.payload.contextId] : [])
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        contextIds: [...newGroups[groupIndex].contextIds, ...contextsToAdd],
      }
    }
  } else if (command.type === 'addRelationship' && command.payload.relationship) {
    newRelationships = [...newRelationships, command.payload.relationship]
  } else if (command.type === 'deleteRelationship' && command.payload.relationship) {
    newRelationships = newRelationships.filter(r => r.id !== command.payload.relationship?.id)
  } else if (command.type === 'updateRelationship' && command.payload.relationshipId && command.payload.newRelationship) {
    const relIndex = newRelationships.findIndex(r => r.id === command.payload.relationshipId)
    if (relIndex !== -1) {
      newRelationships = [...newRelationships]
      newRelationships[relIndex] = command.payload.newRelationship
    }
  } else if (command.type === 'addUser' && command.payload.user) {
    newUsers = [...newUsers, command.payload.user]
  } else if (command.type === 'deleteUser' && command.payload.user) {
    newUsers = newUsers.filter(u => u.id !== command.payload.user?.id)
  } else if (command.type === 'moveUser' && command.payload.userId && command.payload.newPosition !== undefined) {
    const userIndex = newUsers.findIndex(u => u.id === command.payload.userId)
    if (userIndex !== -1) {
      newUsers = [...newUsers]
      newUsers[userIndex] = {
        ...newUsers[userIndex],
        position: command.payload.newPosition,
      }
    }
  } else if (command.type === 'addUserNeed' && command.payload.userNeed) {
    newUserNeeds = [...newUserNeeds, command.payload.userNeed]
  } else if (command.type === 'deleteUserNeed' && command.payload.userNeed) {
    newUserNeeds = newUserNeeds.filter(n => n.id !== command.payload.userNeed?.id)
  } else if (command.type === 'moveUserNeed' && command.payload.userNeedId && command.payload.newPosition !== undefined) {
    const needIndex = newUserNeeds.findIndex(n => n.id === command.payload.userNeedId)
    if (needIndex !== -1) {
      newUserNeeds = [...newUserNeeds]
      newUserNeeds[needIndex] = {
        ...newUserNeeds[needIndex],
        position: command.payload.newPosition,
      }
    }
  } else if (command.type === 'addUserNeedConnection' && command.payload.userNeedConnection) {
    newUserNeedConnections = [...newUserNeedConnections, command.payload.userNeedConnection]
  } else if (command.type === 'deleteUserNeedConnection' && command.payload.userNeedConnection) {
    newUserNeedConnections = newUserNeedConnections.filter(c => c.id !== command.payload.userNeedConnection?.id)
  } else if (command.type === 'addNeedContextConnection' && command.payload.needContextConnection) {
    newNeedContextConnections = [...newNeedContextConnections, command.payload.needContextConnection]
  } else if (command.type === 'deleteNeedContextConnection' && command.payload.needContextConnection) {
    newNeedContextConnections = newNeedContextConnections.filter(c => c.id !== command.payload.needContextConnection?.id)
  }

  // Handle flow stage commands (redo)
  let newFlowStages = project.viewConfig.flowStages
  if (command.type === 'updateFlowStage' && command.payload.flowStageIndex !== undefined && command.payload.newFlowStage) {
    newFlowStages = [...newFlowStages]
    newFlowStages[command.payload.flowStageIndex] = command.payload.newFlowStage
  } else if (command.type === 'addFlowStage' && command.payload.flowStage) {
    newFlowStages = [...newFlowStages, command.payload.flowStage]
  } else if (command.type === 'deleteFlowStage' && command.payload.flowStageIndex !== undefined) {
    newFlowStages = newFlowStages.filter((_, i) => i !== command.payload.flowStageIndex)
  }

  // Handle temporal commands
  let newTemporal = project.temporal
  if (command.type === 'createKeyframe') {
    // Redo keyframe creation by re-adding all keyframes (may be multiple)
    const keyframesToAdd = command.payload.keyframes || (command.payload.keyframe ? [command.payload.keyframe] : [])
    const keyframes = [...(newTemporal?.keyframes || []), ...keyframesToAdd].sort((a, b) => a.date.localeCompare(b.date))
    newTemporal = {
      ...newTemporal,
      enabled: newTemporal?.enabled || false,
      keyframes,
    }
  } else if (command.type === 'deleteKeyframe' && command.payload.keyframe) {
    // Redo keyframe deletion by removing it
    newTemporal = {
      ...newTemporal,
      enabled: newTemporal?.enabled || false,
      keyframes: (newTemporal?.keyframes || []).filter(kf => kf.id !== command.payload.keyframe?.id),
    }
  } else if (command.type === 'updateKeyframe' && command.payload.keyframeId && command.payload.newKeyframeData) {
    // Apply new keyframe data
    newTemporal = {
      ...newTemporal,
      enabled: newTemporal?.enabled || false,
      keyframes: (newTemporal?.keyframes || []).map(kf =>
        kf.id === command.payload.keyframeId ? { ...kf, ...command.payload.newKeyframeData } : kf
      ),
    }
  } else if (command.type === 'moveContextInKeyframe' && command.payload.keyframeId && command.payload.contextId && command.payload.newPositions) {
    // Apply new context position in keyframe
    const newX = command.payload.newPositions.strategic.x
    const newY = command.payload.newPositions.shared.y
    newTemporal = {
      ...newTemporal,
      enabled: newTemporal?.enabled || false,
      keyframes: (newTemporal?.keyframes || []).map(kf =>
        kf.id === command.payload.keyframeId ? {
          ...kf,
          positions: {
            ...kf.positions,
            [command.payload.contextId!]: { x: newX, y: newY },
          },
        } : kf
      ),
    }
  }

  return {
    ...project,
    contexts: newContexts,
    repos: newRepos,
    groups: newGroups,
    relationships: newRelationships,
    users: newUsers,
    userNeeds: newUserNeeds,
    userNeedConnections: newUserNeedConnections,
    needContextConnections: newNeedContextConnections,
    viewConfig: {
      ...project.viewConfig,
      flowStages: newFlowStages,
    },
    temporal: newTemporal,
  }
}
