export interface FlowStage {
  name: string
  position: number
}

export function validateStageName(
  stages: FlowStage[],
  newName: string,
  excludeIndex?: number
): void {
  const isDuplicate = stages.some((s, i) => i !== excludeIndex && s.name === newName)
  if (isDuplicate) {
    throw new Error('Stage name must be unique')
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
  selectedUserId: string | null
  selectedUserNeedId: string | null
  selectedUserNeedConnectionId: string | null
  selectedNeedContextConnectionId: string | null
  selectedContextIds: string[]
}

type SelectionType = 'context' | 'relationship' | 'group' | 'user' | 'userNeed' | 'userNeedConnection' | 'needContextConnection'

export function createSelectionState(
  selectedId: string | null,
  type: SelectionType
): SelectionState {
  const baseState: SelectionState = {
    selectedContextId: null,
    selectedRelationshipId: null,
    selectedGroupId: null,
    selectedUserId: null,
    selectedUserNeedId: null,
    selectedUserNeedConnectionId: null,
    selectedNeedContextConnectionId: null,
    selectedContextIds: [],
  }

  switch (type) {
    case 'context':
      return { ...baseState, selectedContextId: selectedId }
    case 'relationship':
      return { ...baseState, selectedRelationshipId: selectedId }
    case 'group':
      return { ...baseState, selectedGroupId: selectedId }
    case 'user':
      return { ...baseState, selectedUserId: selectedId }
    case 'userNeed':
      return { ...baseState, selectedUserNeedId: selectedId }
    case 'userNeedConnection':
      return { ...baseState, selectedUserNeedConnectionId: selectedId }
    case 'needContextConnection':
      return { ...baseState, selectedNeedContextConnectionId: selectedId }
  }
}
