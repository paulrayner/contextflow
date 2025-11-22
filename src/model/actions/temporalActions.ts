import type { EditorState, EditorCommand } from '../storeTypes'
import type { TemporalKeyframe } from '../types'
import { trackEvent } from '../../utils/analytics'

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

export function addKeyframeAction(state: EditorState, date: string, label: string): { newState: Partial<EditorState>, newKeyframeId: string | null } {
  const projectId = state.activeProjectId
  if (!projectId) return { newState: state, newKeyframeId: null }

  const project = state.projects[projectId]
  if (!project) return { newState: state, newKeyframeId: null }

  // Validate date format
  const dateRegex = /^\d{4}(-Q[1-4])?$/
  if (!dateRegex.test(date)) {
    console.error('Invalid keyframe date format:', date)
    return { newState: state, newKeyframeId: null }
  }

  // Check for duplicate date
  const existingKeyframes = project.temporal?.keyframes || []
  if (existingKeyframes.some(kf => kf.date === date)) {
    console.error('Duplicate keyframe date:', date)
    return { newState: state, newKeyframeId: null }
  }

  // Warn if keyframe is more than 10 years in the future
  const currentYear = new Date().getFullYear()
  const keyframeYear = parseInt(date.split('-')[0])
  if (keyframeYear - currentYear > 10) {
    console.warn(`Keyframe date ${date} is more than 10 years in the future`)
  }

  // Capture current Strategic View positions for all contexts
  const positions: { [contextId: string]: { x: number; y: number } } = {}
  project.contexts.forEach(context => {
    positions[context.id] = {
      x: context.positions.strategic.x,
      y: context.positions.shared.y,
    }
  })

  // If this is the first keyframe and it's in the future, auto-create a "Now" keyframe
  const keyframesToAdd: TemporalKeyframe[] = []
  const currentYearStr = currentYear.toString()
  const isFirstKeyframe = existingKeyframes.length === 0
  const isFutureKeyframe = keyframeYear > currentYear
  const needsCurrentYearKeyframe = isFirstKeyframe && isFutureKeyframe && date !== currentYearStr

  if (needsCurrentYearKeyframe) {
    // Create implicit "Now" keyframe at current year with current positions
    const nowKeyframe: TemporalKeyframe = {
      id: `keyframe-${Date.now()}-now`,
      date: currentYearStr,
      label: 'Current',
      positions: { ...positions }, // Same positions as we just captured
      activeContextIds: project.contexts.map(c => c.id),
    }
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

  const updatedKeyframes = [...existingKeyframes, ...keyframesToAdd].sort((a, b) => {
    // Sort by date (simple string comparison works for "YYYY" and "YYYY-QN" formats)
    return a.date.localeCompare(b.date)
  })

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
