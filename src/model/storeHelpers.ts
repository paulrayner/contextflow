import type { Project } from './types'
import { saveProject } from './persistence'
import { classifyFromStrategicPosition } from './classification'

export function autosaveIfNeeded(
  projectId: string | null,
  projects: Record<string, Project> | undefined
): void {
  if (projectId && projects) {
    saveProject(projects[projectId]).catch((err) => {
      console.error('Failed to autosave project:', err)
    })
  }
}

type ProjectOrigin = 'sample' | 'empty' | 'imported' | 'continued'

export function determineProjectOrigin(
  projectId: string,
  isFirstLoad: boolean
): ProjectOrigin {
  if (projectId === 'acme-ecommerce' || projectId === 'cbioportal' || projectId === 'elan-warranty') {
    return 'sample'
  } else if (projectId === 'empty-project') {
    return 'empty'
  } else if (isFirstLoad) {
    return 'imported'
  }
  return 'continued'
}

export interface KeyframeTransitionResult {
  activeKeyframeId: string | null
  showGroups?: boolean
  showRelationships?: boolean
  savedShowGroups?: boolean
  savedShowRelationships?: boolean
}

export function calculateKeyframeTransition(
  keyframeId: string | null,
  currentKeyframeId: string | null,
  showGroups: boolean,
  showRelationships: boolean,
  savedShowGroups?: boolean,
  savedShowRelationships?: boolean
): KeyframeTransitionResult {
  if (keyframeId && !currentKeyframeId) {
    return {
      activeKeyframeId: keyframeId,
      savedShowGroups: showGroups,
      savedShowRelationships: showRelationships,
      showGroups: false,
      showRelationships: false,
    }
  } else if (!keyframeId && currentKeyframeId) {
    return {
      activeKeyframeId: keyframeId,
      showGroups: savedShowGroups ?? showGroups,
      showRelationships: savedShowRelationships ?? showRelationships,
    }
  } else {
    return {
      activeKeyframeId: keyframeId,
    }
  }
}

export function migrateProject(project: Project): Project {
  if (!project.actors) project.actors = []
  if (!project.actorConnections) project.actorConnections = []

  project.contexts = project.contexts.map(context => {
    const needsDistillation = !context.positions.distillation
    const needsEvolution = !context.evolutionStage

    if (needsDistillation || needsEvolution) {
      return {
        ...context,
        positions: {
          ...context.positions,
          distillation: context.positions.distillation || { x: 50, y: 50 },
        },
        strategicClassification: context.strategicClassification || 'supporting',
        evolutionStage: context.evolutionStage || classifyFromStrategicPosition(context.positions.strategic.x),
      }
    }
    return context
  })

  return project
}

export interface FlowStage {
  label: string
  position: number
}

export function validateStageLabel(
  stages: FlowStage[],
  newLabel: string,
  excludeIndex?: number
): void {
  const isDuplicate = stages.some((s, i) => i !== excludeIndex && s.label === newLabel)
  if (isDuplicate) {
    throw new Error('Stage label must be unique')
  }
}

export function validateStagePosition(
  stages: FlowStage[],
  newPosition: number,
  excludeIndex?: number
): void {
  const isDuplicate = stages.some((s, i) => i !== excludeIndex && s.position === newPosition)
  if (isDuplicate) {
    throw new Error('Stage position must be unique')
  }
}

export interface SelectionState {
  selectedContextId: string | null
  selectedRelationshipId: string | null
  selectedGroupId: string | null
  selectedActorId: string | null
  selectedUserNeedId: string | null
  selectedContextIds: string[]
}

type SelectionType = 'context' | 'relationship' | 'group' | 'actor' | 'userNeed'

export function createSelectionState(
  selectedId: string | null,
  type: SelectionType
): SelectionState {
  const baseState: SelectionState = {
    selectedContextId: null,
    selectedRelationshipId: null,
    selectedGroupId: null,
    selectedActorId: null,
    selectedUserNeedId: null,
    selectedContextIds: [],
  }

  switch (type) {
    case 'context':
      return { ...baseState, selectedContextId: selectedId }
    case 'relationship':
      return { ...baseState, selectedRelationshipId: selectedId }
    case 'group':
      return { ...baseState, selectedGroupId: selectedId }
    case 'actor':
      return { ...baseState, selectedActorId: selectedId }
    case 'userNeed':
      return { ...baseState, selectedUserNeedId: selectedId }
  }
}
