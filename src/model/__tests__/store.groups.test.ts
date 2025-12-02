import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEditorStore } from '../store'
import { initializeCollabMode, destroyCollabMode } from '../sync/useCollabMode'
import type { Project } from '../types'

describe('Store - Group Membership Management', () => {
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

  describe('addContextToGroup', () => {
    it('should add context to existing group', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addContextToGroup } = state

      const group = project.groups[0]
      expect(group).toBeDefined()
      const initialMemberCount = group.contextIds.length

      const contextNotInGroup = project.contexts.find(c => !group.contextIds.includes(c.id))
      expect(contextNotInGroup).toBeDefined()

      addContextToGroup(group.id, contextNotInGroup!.id)

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedGroup = updatedProject.groups.find(g => g.id === group.id)

      expect(updatedGroup?.contextIds.length).toBe(initialMemberCount + 1)
      expect(updatedGroup?.contextIds).toContain(contextNotInGroup!.id)
    })

    it('should not add context if already in group', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addContextToGroup } = state

      const group = project.groups[0]
      const existingContextId = group.contextIds[0]
      const initialMemberCount = group.contextIds.length

      addContextToGroup(group.id, existingContextId)

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedGroup = updatedProject.groups.find(g => g.id === group.id)

      expect(updatedGroup?.contextIds.length).toBe(initialMemberCount)
    })
  })

  describe('addContextsToGroup', () => {
    it('should add multiple contexts to group in single operation', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addContextsToGroup } = state

      const group = project.groups[0]
      const initialMemberCount = group.contextIds.length

      const contextsNotInGroup = project.contexts
        .filter(c => !group.contextIds.includes(c.id))
        .slice(0, 2)
        .map(c => c.id)

      expect(contextsNotInGroup.length).toBe(2)

      addContextsToGroup(group.id, contextsNotInGroup)

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedGroup = updatedProject.groups.find(g => g.id === group.id)

      expect(updatedGroup?.contextIds.length).toBe(initialMemberCount + 2)
      contextsNotInGroup.forEach(contextId => {
        expect(updatedGroup?.contextIds).toContain(contextId)
      })
    })
  })

  describe('undo/redo for group membership', () => {
    it('should undo adding context to group', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addContextToGroup, undo } = state

      const group = project.groups[0]
      const initialMemberCount = group.contextIds.length
      const contextNotInGroup = project.contexts.find(c => !group.contextIds.includes(c.id))

      addContextToGroup(group.id, contextNotInGroup!.id)
      undo()

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedGroup = updatedProject.groups.find(g => g.id === group.id)

      expect(updatedGroup?.contextIds.length).toBe(initialMemberCount)
      expect(updatedGroup?.contextIds).not.toContain(contextNotInGroup!.id)
    })

    it('should undo adding multiple contexts (batch add)', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addContextsToGroup, undo } = state

      const group = project.groups[0]
      const initialMemberCount = group.contextIds.length
      const contextsNotInGroup = project.contexts
        .filter(c => !group.contextIds.includes(c.id))
        .slice(0, 2)
        .map(c => c.id)

      addContextsToGroup(group.id, contextsNotInGroup)
      undo()

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedGroup = updatedProject.groups.find(g => g.id === group.id)

      expect(updatedGroup?.contextIds.length).toBe(initialMemberCount)
    })

    it('should redo adding context to group', () => {
      const state = useEditorStore.getState()
      const project = state.projects[state.activeProjectId!]
      const { addContextToGroup, undo, redo } = state

      const group = project.groups[0]
      const contextNotInGroup = project.contexts.find(c => !group.contextIds.includes(c.id))

      addContextToGroup(group.id, contextNotInGroup!.id)
      undo()
      redo()

      const updatedState = useEditorStore.getState()
      const updatedProject = updatedState.projects[updatedState.activeProjectId!]
      const updatedGroup = updatedProject.groups.find(g => g.id === group.id)

      expect(updatedGroup?.contextIds).toContain(contextNotInGroup!.id)
    })
  })
})
