import type { Group } from '../types'
import type { EditorState, EditorCommand } from '../storeTypes'
import { trackEvent, trackFTUEMilestone } from '../../utils/analytics'

export function createGroupAction(
  state: EditorState,
  label: string,
  color: string | undefined,
  notes: string | undefined
): Partial<EditorState> & { command?: EditorCommand } {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const newGroup = {
    id: `group-${Date.now()}`,
    label,
    color: color || '#3b82f6',
    contextIds: state.selectedContextIds,
    notes,
  }

  const command: EditorCommand = {
    type: 'addGroup',
    payload: {
      group: newGroup,
    },
  }

  const updatedProject = {
    ...project,
    groups: [...project.groups, newGroup],
  }

  // Track analytics
  trackEvent('group_created', updatedProject, {
    entity_type: 'group',
    entity_id: newGroup.id,
    metadata: {
      initial_member_count: newGroup.contextIds.length
    }
  })

  // Track FTUE milestone: first group created
  trackFTUEMilestone('first_group_created', updatedProject)

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedGroupId: newGroup.id,
    selectedContextIds: [], // clear multi-select after creating group
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function updateGroupAction(
  state: EditorState,
  groupId: string,
  updates: Partial<Group>
): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const groupIndex = project.groups.findIndex(g => g.id === groupId)
  if (groupIndex === -1) return state

  const updatedGroup = {
    ...project.groups[groupIndex],
    ...updates,
  }

  const updatedGroups = [...project.groups]
  updatedGroups[groupIndex] = updatedGroup

  const updatedProject = {
    ...project,
    groups: updatedGroups,
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}

export function deleteGroupAction(
  state: EditorState,
  groupId: string
): Partial<EditorState> & { command?: EditorCommand } {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const groupToDelete = project.groups.find(g => g.id === groupId)
  if (!groupToDelete) return state

  const command: EditorCommand = {
    type: 'deleteGroup',
    payload: {
      group: groupToDelete,
    },
  }

  const updatedProject = {
    ...project,
    groups: project.groups.filter(g => g.id !== groupId),
  }

  // Track analytics
  trackEvent('group_deleted', project, {
    entity_type: 'group',
    entity_id: groupId,
    metadata: {
      member_count: groupToDelete.contextIds.length
    }
  })

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
    selectedGroupId: state.selectedGroupId === groupId ? null : state.selectedGroupId,
    undoStack: [...state.undoStack, command],
    redoStack: [],
  }
}

export function removeContextFromGroupAction(
  state: EditorState,
  groupId: string,
  contextId: string
): Partial<EditorState> & { command?: EditorCommand } {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const group = project.groups.find(g => g.id === groupId)
  if (!group) return state

  // Don't do anything if context isn't in the group
  if (!group.contextIds.includes(contextId)) return state

  const command: EditorCommand = {
    type: 'removeFromGroup',
    payload: {
      groupId,
      contextId,
    },
  }

  const updatedGroup = {
    ...group,
    contextIds: group.contextIds.filter(id => id !== contextId),
  }

  const updatedProject = {
    ...project,
    groups: project.groups.map(g => g.id === groupId ? updatedGroup : g),
  }

  // Track analytics
  trackEvent('context_removed_from_group', updatedProject, {
    entity_type: 'group',
    entity_id: groupId,
    metadata: {
      group_id: groupId,
      remaining_member_count: updatedGroup.contextIds.length
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

export function addContextToGroupAction(
  state: EditorState,
  groupId: string,
  contextId: string
): Partial<EditorState> & { command?: EditorCommand } {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const group = project.groups.find(g => g.id === groupId)
  if (!group) return state

  if (group.contextIds.includes(contextId)) return state

  const command: EditorCommand = {
    type: 'addToGroup',
    payload: {
      groupId,
      contextId,
    },
  }

  const updatedGroup = {
    ...group,
    contextIds: [...group.contextIds, contextId],
  }

  const updatedProject = {
    ...project,
    groups: project.groups.map(g => g.id === groupId ? updatedGroup : g),
  }

  // Track analytics
  trackEvent('context_added_to_group', updatedProject, {
    entity_type: 'group',
    entity_id: groupId,
    metadata: {
      group_id: groupId,
      method: 'inspector' // This is called from inspector; drag events would be tracked separately
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

export function addContextsToGroupAction(
  state: EditorState,
  groupId: string,
  contextIds: string[]
): Partial<EditorState> & { command?: EditorCommand } {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const group = project.groups.find(g => g.id === groupId)
  if (!group) return state

  const newContextIds = contextIds.filter(id => !group.contextIds.includes(id))
  if (newContextIds.length === 0) return state

  const command: EditorCommand = {
    type: 'addToGroup',
    payload: {
      groupId,
      contextIds: newContextIds,
    },
  }

  const updatedGroup = {
    ...group,
    contextIds: [...group.contextIds, ...newContextIds],
  }

  const updatedProject = {
    ...project,
    groups: project.groups.map(g => g.id === groupId ? updatedGroup : g),
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
