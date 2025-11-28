export type IssueSeverity = 'info' | 'warning' | 'critical'

export interface Issue {
  id: string
  title: string
  description?: string
  severity: IssueSeverity
}

export interface Project {
  id: string
  name: string
  version?: number  // Version number for built-in projects (default: 1)

  contexts: BoundedContext[]
  relationships: Relationship[]
  repos: Repo[]
  people: Person[]
  teams: Team[]
  groups: Group[]
  users: User[]
  userNeeds: UserNeed[]
  userNeedConnections: UserNeedConnection[]
  needContextConnections: NeedContextConnection[]

  viewConfig: {
    flowStages: FlowStageMarker[]
  }

  temporal?: {
    enabled: boolean
    keyframes: TemporalKeyframe[]
  }
}

export type ContextOwnership = 'ours' | 'internal' | 'external'

export interface BoundedContext {
  id: string
  name: string
  purpose?: string

  strategicClassification?: 'core' | 'supporting' | 'generic'
  ownership?: ContextOwnership

  boundaryIntegrity?: 'strong' | 'moderate' | 'weak'
  boundaryNotes?: string

  positions: {
    strategic: { x: number }        // Strategic View horizontal (0..100)
    flow: { x: number }             // Flow View horizontal (0..100)
    distillation: { x: number; y: number } // Distillation View 2D position (0..100)
    shared: { y: number }           // vertical (0..100), shared across Flow/Strategic views
  }

  evolutionStage: 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility'

  codeSize?: {
    loc?: number
    bucket?: 'tiny' | 'small' | 'medium' | 'large' | 'huge'
  }

  isLegacy?: boolean

  notes?: string
  issues?: Issue[]
}

export interface Relationship {
  id: string

  // arrow points to upstream (the one with more power / defines language)
  fromContextId: string // downstream / dependent
  toContextId: string   // upstream / defining authority

  pattern:
    | 'customer-supplier'
    | 'conformist'
    | 'anti-corruption-layer'
    | 'open-host-service'
    | 'published-language'
    | 'shared-kernel'
    | 'partnership'
    | 'separate-ways'

  communicationMode?: string
  description?: string
}

export interface Repo {
  id: string
  name: string
  remoteUrl?: string

  contextId?: string       // repo mapped onto which bounded context
  teamIds: string[]        // one or more teams that own prod responsibility

  contributors: ContributorRef[]

  analysisSummary?: string // future output from automated analysis endpoint
}

export interface ContributorRef {
  personId: string
}

export interface Person {
  id: string
  displayName: string
  emails: string[]
  teamIds?: string[]
}

export interface Team {
  id: string
  name: string
  jiraBoard?: string // clickable if URL
  topologyType?: 'stream-aligned' | 'platform' | 'enabling' | 'complicated-subsystem' | 'unknown'
}

export interface Group {
  id: string
  label: string          // e.g. "Data Platform / Ingestion"
  color?: string         // translucent tint
  contextIds: string[]   // members
  notes?: string
}

export interface FlowStageMarker {
  name: string          // e.g. "Data Ingestion"
  position: number      // 0..100 along Flow View X axis
  description?: string  // shown in hover tooltip and inspector
  owner?: string        // team/person responsible for this stage
  notes?: string        // freeform notes
}

export interface User {
  id: string
  name: string
  description?: string
  position: number // 0..100 along Strategic View X axis (horizontal only)
  isExternal?: boolean // external users outside the organization
}

export interface UserNeed {
  id: string
  name: string
  description?: string
  position: number // 0..100 along evolution axis (horizontal only)
  visibility?: boolean // can be hidden without deleting
}

export interface UserNeedConnection {
  id: string
  userId: string
  userNeedId: string
  notes?: string
}

export interface NeedContextConnection {
  id: string
  userNeedId: string
  contextId: string
  notes?: string
}

export interface TemporalKeyframe {
  id: string
  date: string // Year or Year-Quarter: "2027" or "2027-Q2"
  label?: string

  // Strategic View positions only
  positions: {
    [contextId: string]: {
      x: number // Evolution axis (0-100)
      y: number // Value chain proximity (0-100)
    }
  }

  // Which contexts exist at this point in time
  activeContextIds: string[]
}
