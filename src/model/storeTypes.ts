import type { Project, BoundedContext, User, UserNeed, UserNeedConnection, NeedContextConnection, TemporalKeyframe, Issue, IssueSeverity, Relationship } from './types'

export type ViewMode = 'flow' | 'strategic' | 'distillation'

export interface EditorCommand {
  type: 'moveContext' | 'moveContextGroup' | 'addContext' | 'deleteContext' | 'assignRepo' | 'unassignRepo' | 'addGroup' | 'deleteGroup' | 'removeFromGroup' | 'addToGroup' | 'addRelationship' | 'deleteRelationship' | 'updateRelationship' | 'addUser' | 'deleteUser' | 'moveUser' | 'addUserNeed' | 'deleteUserNeed' | 'moveUserNeed' | 'addUserNeedConnection' | 'deleteUserNeedConnection' | 'addNeedContextConnection' | 'deleteNeedContextConnection' | 'createKeyframe' | 'deleteKeyframe' | 'moveContextInKeyframe' | 'updateKeyframe' | 'updateFlowStage' | 'addFlowStage' | 'deleteFlowStage'
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
    user?: User
    userId?: string
    oldPosition?: number
    newPosition?: number
    userNeed?: UserNeed
    userNeedId?: string
    userNeedConnection?: UserNeedConnection
    userNeedConnectionId?: string
    needContextConnection?: NeedContextConnection
    needContextConnectionId?: string
    keyframe?: TemporalKeyframe
    keyframes?: TemporalKeyframe[] // For commands that create multiple keyframes
    keyframeId?: string
    oldKeyframeData?: Partial<TemporalKeyframe>
    newKeyframeData?: Partial<TemporalKeyframe>
    flowStageIndex?: number
    flowStage?: { name: string; position: number; description?: string; owner?: string; notes?: string }
    oldFlowStage?: { name: string; position: number; description?: string; owner?: string; notes?: string }
    newFlowStage?: { name: string; position: number; description?: string; owner?: string; notes?: string }
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
  selectedUserId: string | null
  selectedUserNeedId: string | null
  selectedUserNeedConnectionId: string | null
  selectedNeedContextConnectionId: string | null
  selectedStageIndex: number | null
  selectedTeamId: string | null
  selectedContextIds: string[]
  isDragging: boolean

  canvasView: {
    flow: { zoom: number; panX: number; panY: number }
    strategic: { zoom: number; panX: number; panY: number }
    distillation: { zoom: number; panX: number; panY: number }
  }

  // View filters
  showGroups: boolean
  showRelationships: boolean
  showIssueLabels: boolean
  showTeamLabels: boolean

  // Help preferences
  showHelpTooltips: boolean

  // Onboarding
  hasSeenWelcome: boolean

  // UI preferences
  groupOpacity: number
  colorByMode: 'strategic' | 'ownership'

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
  createProject: (name: string) => void
  deleteProject: (projectId: string) => void
  renameProject: (projectId: string, newName: string) => void
  duplicateProject: (projectId: string) => void
  addContext: (name: string) => void
  deleteContext: (contextId: string) => void
  addContextIssue: (contextId: string, title: string, severity?: IssueSeverity) => void
  updateContextIssue: (contextId: string, issueId: string, updates: Partial<Issue>) => void
  deleteContextIssue: (contextId: string, issueId: string) => void
  assignTeamToContext: (contextId: string, teamId: string) => void
  unassignTeamFromContext: (contextId: string) => void
  assignRepoToContext: (repoId: string, contextId: string) => void
  unassignRepo: (repoId: string) => void
  createGroup: (label: string, color?: string, notes?: string) => void
  updateGroup: (groupId: string, updates: Partial<{ label: string; notes: string }>) => void
  deleteGroup: (groupId: string) => void
  removeContextFromGroup: (groupId: string, contextId: string) => void
  addContextToGroup: (groupId: string, contextId: string) => void
  addContextsToGroup: (groupId: string, contextIds: string[]) => void
  addRelationship: (fromContextId: string, toContextId: string, pattern: Relationship['pattern'], description?: string) => void
  deleteRelationship: (relationshipId: string) => void
  updateRelationship: (relationshipId: string, updates: Partial<Pick<Relationship, 'pattern' | 'communicationMode' | 'description'>>) => void
  swapRelationshipDirection: (relationshipId: string) => void
  setSelectedRelationship: (relationshipId: string | null) => void
  setSelectedStage: (stageIndex: number | null) => void
  setSelectedTeam: (teamId: string | null) => void
  updateTeam: (teamId: string, updates: Partial<{ name: string; jiraBoard: string; topologyType: 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem' | 'unknown' }>) => void
  addTeam: (name: string) => void
  deleteTeam: (teamId: string) => void
  addUser: (name: string) => void
  deleteUser: (userId: string) => void
  updateUser: (userId: string, updates: Partial<User>) => void
  updateUserPosition: (userId: string, newPosition: number) => void
  setSelectedUser: (userId: string | null) => void
  addUserNeed: (name: string) => string | null
  deleteUserNeed: (userNeedId: string) => void
  updateUserNeed: (userNeedId: string, updates: Partial<UserNeed>) => void
  updateUserNeedPosition: (userNeedId: string, newPosition: number) => void
  setSelectedUserNeed: (userNeedId: string | null) => void
  setSelectedUserNeedConnection: (connectionId: string | null) => void
  setSelectedNeedContextConnection: (connectionId: string | null) => void
  createUserNeedConnection: (userId: string, userNeedId: string) => string | null
  deleteUserNeedConnection: (connectionId: string) => void
  updateUserNeedConnection: (connectionId: string, updates: Partial<UserNeedConnection>) => void
  createNeedContextConnection: (userNeedId: string, contextId: string) => string | null
  deleteNeedContextConnection: (connectionId: string) => void
  updateNeedContextConnection: (connectionId: string, updates: Partial<NeedContextConnection>) => void
  toggleShowGroups: () => void
  toggleShowRelationships: () => void
  toggleIssueLabels: () => void
  toggleTeamLabels: () => void
  toggleHelpTooltips: () => void
  dismissWelcome: () => void
  resetWelcome: () => void
  setGroupOpacity: (opacity: number) => void
  setColorByMode: (mode: 'strategic' | 'ownership') => void
  updateFlowStage: (index: number, updates: Partial<{ name: string; position: number; description: string; owner: string; notes: string }>) => void
  addFlowStage: (name: string, position?: number) => void
  deleteFlowStage: (index: number) => void
  setDragging: (isDragging: boolean) => void
  undo: () => void
  redo: () => void
  fitToMap: () => void
  exportProject: () => void
  importProject: (project: Project) => void
  reset: () => void
  loadSharedProject: (projectId: string) => Promise<void>
}
