import type { EditorState, EditorCommand } from '../storeTypes'
import type { TemporalKeyframe } from '../types'
import { trackEvent } from '../../utils/analytics'
import {
  validateKeyframeDate,
  checkDuplicateKeyframe,
  shouldWarnFarFuture,
  captureContextPositions,
  shouldAutoCreateCurrentKeyframe,
  createCurrentKeyframe,
  sortKeyframes,
} from './keyframeHelpers'

export function toggleTemporalModeAction(state: EditorState): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project) return state

  const currentlyEnabled = project.temporal?.enabled || false

  const updatedProject = {
    ...project,
    temporal: {
      enabled: !currentlyEnabled,
      keyframes: project.temporal?.keyframes || [],
    },
  }

  return {
    projects: {
      ...state.projects,
      [projectId]: updatedProject,
    },
  }
}

export function addKeyframeAction(state: EditorState, date: string, label?: string): { newState: Partial<EditorState>, newKeyframeId: string | null } {
  const projectId = state.activeProjectId
  if (!projectId) return { newState: state, newKeyframeId: null }

  const project = state.projects[projectId]
  if (!project) return { newState: state, newKeyframeId: null }

  const validation = validateKeyframeDate(date)
  if (!validation.valid) {
    console.error(validation.error)
    return { newState: state, newKeyframeId: null }
  }

  const existingKeyframes = project.temporal?.keyframes || []
  if (checkDuplicateKeyframe(date, existingKeyframes)) {
    console.error('Duplicate keyframe date:', date)
    return { newState: state, newKeyframeId: null }
  }

  const farFutureCheck = shouldWarnFarFuture(date)
  if (farFutureCheck.shouldWarn) {
    console.warn(farFutureCheck.message)
  }

  const currentYear = new Date().getFullYear()
  const keyframeYear = parseInt(date.split('-')[0])

  const positions = captureContextPositions(project.contexts)

  const keyframesToAdd: TemporalKeyframe[] = []

  if (shouldAutoCreateCurrentKeyframe(existingKeyframes, keyframeYear, currentYear, date)) {
    const nowKeyframe = createCurrentKeyframe(currentYear, positions, project.contexts.map(c => c.id))
    keyframesToAdd.push(nowKeyframe)
  }

  const newKeyframe: TemporalKeyframe = {
    id: `keyframe-${Date.now()}`,
    date,
    label,
    positions,
    activeContextIds: project.contexts.map(c => c.id),
  }
  keyframesToAdd.push(newKeyframe)

  const updatedKeyframes = sortKeyframes([...existingKeyframes, ...keyframesToAdd])

  const updatedProject = {
    ...project,
    temporal: {
      enabled: project.temporal?.enabled || true,
      keyframes: updatedKeyframes,
    },
  }

  const command: EditorCommand = {
    type: 'createKeyframe',
    payload: {
      keyframes: keyframesToAdd, // Store all keyframes created (may include implicit "Now" keyframe)
    },
  }

  // Track analytics
  trackEvent('keyframe_created', updatedProject, {
    entity_type: 'keyframe',
    entity_id: newKeyframe.id,
    metadata: {
      date: newKeyframe.date,
      context_count: Object.keys(newKeyframe.positions).length,
      auto_created_now_keyframe: keyframesToAdd.length > 1
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
    newKeyframeId: newKeyframe.id
  }
}

export function deleteKeyframeAction(state: EditorState, keyframeId: string): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project || !project.temporal) return state

  const keyframeToDelete = project.temporal.keyframes.find(kf => kf.id === keyframeId)
  if (!keyframeToDelete) return state

  const command: EditorCommand = {
    type: 'deleteKeyframe',
    payload: {
      keyframe: keyframeToDelete,
    },
  }

  const updatedProject = {
    ...project,
    temporal: {
      ...project.temporal,
      keyframes: project.temporal.keyframes.filter(kf => kf.id !== keyframeId),
    },
  }

  // Track analytics
  trackEvent('keyframe_deleted', project, {
    entity_type: 'keyframe',
    entity_id: keyframeId,
    metadata: {
      date: keyframeToDelete.date
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

export function updateKeyframeAction(state: EditorState, keyframeId: string, updates: Partial<TemporalKeyframe>): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project || !project.temporal) return state

  const oldKeyframe = project.temporal.keyframes.find(kf => kf.id === keyframeId)
  if (!oldKeyframe) return state

  const command: EditorCommand = {
    type: 'updateKeyframe',
    payload: {
      keyframeId,
      oldKeyframeData: { ...oldKeyframe },
      newKeyframeData: updates,
    },
  }

  const updatedKeyframes = project.temporal.keyframes.map(kf =>
    kf.id === keyframeId ? { ...kf, ...updates } : kf
  ).sort((a, b) => a.date.localeCompare(b.date))

  const updatedProject = {
    ...project,
    temporal: {
      ...project.temporal,
      keyframes: updatedKeyframes,
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

export function updateKeyframeContextPositionAction(state: EditorState, keyframeId: string, contextId: string, x: number, y: number): Partial<EditorState> {
  const projectId = state.activeProjectId
  if (!projectId) return state

  const project = state.projects[projectId]
  if (!project || !project.temporal) return state

  const keyframe = project.temporal.keyframes.find(kf => kf.id === keyframeId)
  if (!keyframe) return state

  const oldPosition = keyframe.positions[contextId]

  const command: EditorCommand = {
    type: 'moveContextInKeyframe',
    payload: {
      keyframeId,
      contextId,
      oldPositions: oldPosition ? {
        flow: { x: 0 },
        strategic: { x: oldPosition.x },
        distillation: { x: 0, y: 0 },
        shared: { y: oldPosition.y }
      } : undefined,
      newPositions: {
        flow: { x: 0 },
        strategic: { x },
        distillation: { x: 0, y: 0 },
        shared: { y }
      },
    },
  }

  const updatedKeyframes = project.temporal.keyframes.map(kf => {
    if (kf.id === keyframeId) {
      return {
        ...kf,
        positions: {
          ...kf.positions,
          [contextId]: { x, y },
        },
      }
    }
    return kf
  })

  const updatedProject = {
    ...project,
    temporal: {
      ...project.temporal,
      keyframes: updatedKeyframes,
    },
  }

  // Track analytics
  trackEvent('keyframe_context_position_changed', updatedProject, {
    entity_type: 'keyframe',
    entity_id: keyframeId,
    metadata: {
      context_id: contextId,
      keyframe_id: keyframeId
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
