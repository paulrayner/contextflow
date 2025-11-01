// Core data model for ContextFlow

export interface Project {
  id: string
  name: string

  contexts: BoundedContext[]
  relationships: Relationship[]
  repos: Repo[]
  people: Person[]
  teams: Team[]
  groups: Group[]
  actors: Actor[]
  actorConnections: ActorConnection[]

  viewConfig: {
    flowStages: FlowStageMarker[]
  }
}

export interface BoundedContext {
  id: string
  name: string
  purpose?: string

  strategicClassification?: 'core' | 'supporting' | 'generic'

  boundaryIntegrity?: 'strong' | 'moderate' | 'weak'
  boundaryNotes?: string

  positions: {
    strategic: { x: number }        // Strategic View horizontal (0..100)
    flow: { x: number }             // Flow View horizontal (0..100)
    distillation: { x: number; y: number } // Distillation View 2D position (0..100)
    shared: { y: number }           // vertical (0..100), shared across Flow/Strategic views
  }

  evolutionStage?: 'genesis' | 'custom-built' | 'product/rental' | 'commodity/utility'

  codeSize?: {
    loc?: number
    bucket?: 'tiny' | 'small' | 'medium' | 'large' | 'huge'
  }

  isLegacy?: boolean
  isExternal?: boolean // upstream/downstream contexts not owned by org

  notes?: string // freeform assumptions, politics, bottlenecks, risks
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
  label: string    // e.g. "Data Ingestion"
  position: number // 0..100 along Flow View X axis
}

export interface Actor {
  id: string
  name: string
  description?: string
  position: number // 0..100 along Strategic View X axis (horizontal only)
}

export interface ActorConnection {
  id: string
  actorId: string   // which actor
  contextId: string // which bounded context
  notes?: string
}
