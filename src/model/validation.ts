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
  selectedActorNeedConnectionId: string | null
  selectedContextIds: string[]
}

type SelectionType = 'context' | 'relationship' | 'group' | 'actor' | 'userNeed' | 'actorNeedConnection'

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
    selectedActorNeedConnectionId: null,
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
    case 'actorNeedConnection':
      return { ...baseState, selectedActorNeedConnectionId: selectedId }
  }
}
