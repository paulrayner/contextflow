import type { Project, BoundedContext, Actor, UserNeed, ActorNeedConnection, NeedContextConnection, TemporalKeyframe } from './types'

export type ViewMode = 'flow' | 'strategic' | 'distillation'

export interface EditorCommand {
  type: 'moveContext' | 'moveContextGroup' | 'addContext' | 'deleteContext' | 'assignRepo' | 'unassignRepo' | 'addGroup' | 'deleteGroup' | 'removeFromGroup' | 'addToGroup' | 'addRelationship' | 'deleteRelationship' | 'updateRelationship' | 'addActor' | 'deleteActor' | 'moveActor' | 'addActorConnection' | 'deleteActorConnection' | 'addUserNeed' | 'deleteUserNeed' | 'moveUserNeed' | 'addActorNeedConnection' | 'deleteActorNeedConnection' | 'addNeedContextConnection' | 'deleteNeedContextConnection' | 'createKeyframe' | 'deleteKeyframe' | 'moveContextInKeyframe' | 'updateKeyframe' | 'updateFlowStage' | 'addFlowStage' | 'deleteFlowStage'
  payload: {
    contextId?: string
    contextIds?: string[]
    oldPositions?: BoundedContext['positions']
    newPositions?: BoundedContext['positions']
    positionsMap?: Record<string, { old: BoundedContext['positions'], new: BoundedContext['positions'] }>
    context?: BoundedContext
    repoId?: string
    oldContextId?: string
    newContextId?: string
    group?: any
    groupId?: string
    relationship?: any
    relationshipId?: string
    actor?: Actor
    actorId?: string
    oldPosition?: number
    newPosition?: number
    actorConnection?: any
    actorConnectionId?: string
    userNeed?: UserNeed
    userNeedId?: string
    actorNeedConnection?: ActorNeedConnection
    actorNeedConnectionId?: string
    needContextConnection?: NeedContextConnection
    needContextConnectionId?: string
    keyframe?: TemporalKeyframe
    keyframes?: TemporalKeyframe[] // For commands that create multiple keyframes
    keyframeId?: string
    oldKeyframeData?: Partial<TemporalKeyframe>
    newKeyframeData?: Partial<TemporalKeyframe>
    flowStageIndex?: number
    flowStage?: { label: string; position: number }
    oldFlowStage?: { label: string; position: number }
    newFlowStage?: { label: string; position: number }
    oldRelationship?: any
    newRelationship?: any
  }
}

export interface EditorState {
  activeProjectId: string | null
  projects: Record<string, Project>

  activeViewMode: ViewMode

  selectedContextId: string | null
  selectedRelationshipId: string | null
  selectedGroupId: string | null
  selectedActorId: string | null
  selectedUserNeedId: string | null
  selectedContextIds: string[] // for multi-select

  canvasView: {
    flow: { zoom: number; panX: number; panY: number }
    strategic: { zoom: number; panX: number; panY: number }
    distillation: { zoom: number; panX: number; panY: number }
  }

  // View filters
  showGroups: boolean
  showRelationships: boolean

  // UI preferences
  groupOpacity: number

  // Temporal state
  temporal: {
    currentDate: string | null // Current slider position ("2027" or "2027-Q2")
    activeKeyframeId: string | null // Currently locked keyframe for editing
    savedShowGroups?: boolean // Saved group visibility when entering keyframe mode
    savedShowRelationships?: boolean // Saved relationship visibility when entering keyframe mode
  }

  undoStack: EditorCommand[]
  redoStack: EditorCommand[]

  // Temporal actions
  toggleTemporalMode: () => void
  setCurrentDate: (date: string | null) => void
  setActiveKeyframe: (keyframeId: string | null) => void
  addKeyframe: (date: string, label?: string) => string | null
  deleteKeyframe: (keyframeId: string) => void
  updateKeyframe: (keyframeId: string, updates: Partial<TemporalKeyframe>) => void
  updateKeyframeContextPosition: (keyframeId: string, contextId: string, x: number, y: number) => void

  // Actions
  updateContext: (contextId: string, updates: Partial<BoundedContext>) => void
  updateContextPosition: (contextId: string, newPositions: BoundedContext['positions']) => void
  updateMultipleContextPositions: (positionsMap: Record<string, BoundedContext['positions']>) => void
  setSelectedContext: (contextId: string | null) => void
  toggleContextSelection: (contextId: string) => void
  clearContextSelection: () => void
  setViewMode: (mode: ViewMode) => void
  setActiveProject: (projectId: string) => void
  addContext: (name: string) => void
  deleteContext: (contextId: string) => void
  assignRepoToContext: (repoId: string, contextId: string) => void
  unassignRepo: (repoId: string) => void
  createGroup: (label: string, color?: string, notes?: string) => void
  updateGroup: (groupId: string, updates: Partial<{ label: string; notes: string }>) => void
  deleteGroup: (groupId: string) => void
  removeContextFromGroup: (groupId: string, contextId: string) => void
  addContextToGroup: (groupId: string, contextId: string) => void
  addContextsToGroup: (groupId: string, contextIds: string[]) => void
  addRelationship: (fromContextId: string, toContextId: string, pattern: string, description?: string) => void
  deleteRelationship: (relationshipId: string) => void
  updateRelationship: (relationshipId: string, updates: Partial<{ pattern: string; communicationMode: string; description: string }>) => void
  setSelectedRelationship: (relationshipId: string | null) => void
  addActor: (name: string) => void
  deleteActor: (actorId: string) => void
  updateActor: (actorId: string, updates: Partial<Actor>) => void
  updateActorPosition: (actorId: string, newPosition: number) => void
  setSelectedActor: (actorId: string | null) => void
  createActorConnection: (actorId: string, contextId: string) => void
  deleteActorConnection: (connectionId: string) => void
  updateActorConnection: (connectionId: string, updates: Partial<any>) => void
  addUserNeed: (name: string) => string | null
  deleteUserNeed: (userNeedId: string) => void
  updateUserNeed: (userNeedId: string, updates: Partial<UserNeed>) => void
  updateUserNeedPosition: (userNeedId: string, newPosition: number) => void
  setSelectedUserNeed: (userNeedId: string | null) => void
  createActorNeedConnection: (actorId: string, userNeedId: string) => string | null
  deleteActorNeedConnection: (connectionId: string) => void
  updateActorNeedConnection: (connectionId: string, updates: Partial<ActorNeedConnection>) => void
  createNeedContextConnection: (userNeedId: string, contextId: string) => string | null
  deleteNeedContextConnection: (connectionId: string) => void
  updateNeedContextConnection: (connectionId: string, updates: Partial<NeedContextConnection>) => void
  toggleShowGroups: () => void
  toggleShowRelationships: () => void
  setGroupOpacity: (opacity: number) => void
  updateFlowStage: (index: number, updates: Partial<{ label: string; position: number }>) => void
  addFlowStage: (label: string, position?: number) => void
  deleteFlowStage: (index: number) => void
  undo: () => void
  redo: () => void
  fitToMap: () => void
  exportProject: () => void
  importProject: (project: Project) => void
  reset: () => void
}
