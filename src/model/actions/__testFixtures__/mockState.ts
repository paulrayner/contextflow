import { vi, beforeEach, afterEach } from 'vitest'
import type { EditorState } from '../../storeTypes'
import type { Project, BoundedContext, Group, Relationship, TemporalKeyframe } from '../../types'

export const createMockContext = (overrides?: Partial<BoundedContext>): BoundedContext => ({
  id: 'ctx-1',
  name: 'Test Context',
  positions: {
    flow: { x: 50 },
    strategic: { x: 50 },
    distillation: { x: 50, y: 50 },
    shared: { y: 50 },
  },
  isExternal: false,
  evolutionStage: 'custom',
  strategicClassification: 'supporting',
  ...overrides,
})

export const createMockGroup = (overrides?: Partial<Group>): Group => ({
  id: 'group-1',
  label: 'Test Group',
  contextIds: [],
  ...overrides,
})

export const createMockRelationship = (overrides?: Partial<Relationship>): Relationship => ({
  id: 'rel-1',
  fromContextId: 'context-1',
  toContextId: 'context-2',
  pattern: 'customer-supplier',
  ...overrides,
})

export const createMockKeyframe = (overrides?: Partial<TemporalKeyframe>): TemporalKeyframe => ({
  id: 'kf-1',
  date: '2025',
  label: 'Future',
  positions: {},
  activeContextIds: [],
  ...overrides,
})

export const setupAnalyticsMock = () => {
  vi.mock('../../utils/analytics', () => ({
    trackEvent: vi.fn(),
    trackPropertyChange: vi.fn(),
    trackTextFieldEdit: vi.fn(),
    trackFTUEMilestone: vi.fn(),
  }))
}

export const setupConsoleSpy = () => {
  let consoleErrorSpy: any
  let consoleWarnSpy: any

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
    consoleWarnSpy?.mockRestore()
  })

  return { consoleErrorSpy, consoleWarnSpy }
}

export const createBaseMockProject = (): Project => ({
  id: 'test-project',
  name: 'Test Project',
  description: '',
  contexts: [],
  relationships: [],
  groups: [],
  repos: [],
  users: [],
  userNeeds: [],
  userNeedConnections: [],
  needContextConnections: [],
  viewConfig: {
    flowStages: [],
  },
})

export const createMockState = (projectOverrides?: Partial<Project>): EditorState => ({
  activeProjectId: 'test-project',
  projects: {
    'test-project': {
      ...createBaseMockProject(),
      ...projectOverrides,
    },
  },
  activeViewMode: 'flow',
  selectedContextId: null,
  selectedRelationshipId: null,
  selectedGroupId: null,
  selectedUserId: null,
  selectedUserNeedConnectionId: null,
  selectedNeedContextConnectionId: null,
  selectedUserNeedId: null,
  selectedContextIds: [],
  canvasView: {
    flow: { zoom: 1, panX: 0, panY: 0 },
    strategic: { zoom: 1, panX: 0, panY: 0 },
    distillation: { zoom: 1, panX: 0, panY: 0 },
  },
  showGroups: true,
  showRelationships: true,
  showIssueLabels: false,
  showTeamLabels: false,
  groupOpacity: 0.6,
  temporal: {
    currentDate: '2024',
    activeKeyframeId: null,
  },
  undoStack: [],
  redoStack: [],
  updateContext: vi.fn(),
  updateContextPosition: vi.fn(),
  updateMultipleContextPositions: vi.fn(),
  setSelectedContext: vi.fn(),
  toggleContextSelection: vi.fn(),
  clearContextSelection: vi.fn(),
  setViewMode: vi.fn(),
  setActiveProject: vi.fn(),
  addContext: vi.fn(),
  deleteContext: vi.fn(),
  assignTeamToContext: vi.fn(),
  unassignTeamFromContext: vi.fn(),
  assignRepoToContext: vi.fn(),
  unassignRepo: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  removeContextFromGroup: vi.fn(),
  addContextToGroup: vi.fn(),
  addContextsToGroup: vi.fn(),
  addRelationship: vi.fn(),
  deleteRelationship: vi.fn(),
  updateRelationship: vi.fn(),
  setSelectedRelationship: vi.fn(),
  addActor: vi.fn(),
  deleteActor: vi.fn(),
  updateActor: vi.fn(),
  updateActorPosition: vi.fn(),
  setSelectedActor: vi.fn(),
  createActorConnection: vi.fn(),
  deleteActorConnection: vi.fn(),
  updateActorConnection: vi.fn(),
  addUserNeed: vi.fn(),
  deleteUserNeed: vi.fn(),
  updateUserNeed: vi.fn(),
  updateUserNeedPosition: vi.fn(),
  setSelectedUserNeed: vi.fn(),
  createActorNeedConnection: vi.fn(),
  deleteActorNeedConnection: vi.fn(),
  updateActorNeedConnection: vi.fn(),
  createNeedContextConnection: vi.fn(),
  deleteNeedContextConnection: vi.fn(),
  updateNeedContextConnection: vi.fn(),
  toggleShowGroups: vi.fn(),
  toggleShowRelationships: vi.fn(),
  toggleIssueLabels: vi.fn(),
  toggleTeamLabels: vi.fn(),
  setGroupOpacity: vi.fn(),
  updateFlowStage: vi.fn(),
  addFlowStage: vi.fn(),
  deleteFlowStage: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  fitToMap: vi.fn(),
  exportProject: vi.fn(),
  importProject: vi.fn(),
  reset: vi.fn(),
  toggleTemporalMode: vi.fn(),
  setCurrentDate: vi.fn(),
  setActiveKeyframe: vi.fn(),
  addKeyframe: vi.fn(),
  deleteKeyframe: vi.fn(),
  updateKeyframe: vi.fn(),
  updateKeyframeContextPosition: vi.fn(),
})
