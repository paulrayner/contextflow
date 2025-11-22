import type { Project } from '../model/types'

const MILLISECONDS_PER_SECOND = 1000

declare global {
  interface Window {
    sa_event?: (eventName: string, metadata?: Record<string, any>) => void
  }
}

export type DeploymentContext = 'hosted_demo' | 'self_hosted' | 'localhost'

export function getDeploymentContext(): DeploymentContext {
  const hostname = window.location.hostname
  if (hostname === 'contextflow.virtualgenius.com') return 'hosted_demo'
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'localhost'
  return 'self_hosted'
}

export function hashProjectId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash = hash & hash
  }
  const base36 = Math.abs(hash).toString(36)
  // Pad to ensure 8 characters
  const padded = base36.padStart(8, '0').substring(0, 8)
  return `proj_${padded}`
}

export function isAnalyticsEnabled(): boolean {
  const isDeveloper = localStorage.getItem('contextflow.developer_mode') === 'true'
  return !isDeveloper
}

interface ProjectMetadata {
  project_id: string
  context_count: number
  relationship_count: number
  group_count: number
  repo_count: number
  repo_assignment_count: number
  repo_with_url_count: number
  person_count: number
  team_count: number
  contributor_count: number
  has_temporal: boolean
  keyframe_count: number
  actor_count: number
  need_count: number
  actor_need_connection_count: number
  need_context_connection_count: number
  flow_stage_marker_count: number
}

export function getProjectMetadata(project: Project | null): ProjectMetadata | null {
  if (!project) return null

  return {
    project_id: hashProjectId(project.id),
    context_count: project.contexts.length,
    relationship_count: project.relationships.length,
    group_count: project.groups.length,
    repo_count: project.repos.length,
    repo_assignment_count: project.repos.filter(r => r.contextId).length,
    repo_with_url_count: project.repos.filter(r => r.remoteUrl).length,
    person_count: project.people.length,
    team_count: project.teams.length,
    contributor_count: project.repos.reduce((sum, r) => sum + r.contributors.length, 0),
    has_temporal: project.temporal?.enabled || false,
    keyframe_count: project.temporal?.keyframes.length || 0,
    actor_count: project.actors.length,
    need_count: project.userNeeds.length,
    actor_need_connection_count: project.actorNeedConnections.length,
    need_context_connection_count: project.needContextConnections.length,
    flow_stage_marker_count: project.viewConfig.flowStages.length
  }
}

export function trackEvent(
  eventName: string,
  project: Project | null,
  metadata?: Record<string, any>
): void {
  if (!isAnalyticsEnabled()) return

  try {
    const globalMetadata = {
      deployment: getDeploymentContext(),
      app_version: '0.2.0',
      ...getProjectMetadata(project)
    }

    const fullMetadata = { ...globalMetadata, ...metadata }

    if (typeof window.sa_event === 'function') {
      window.sa_event(eventName, fullMetadata)
    }
  } catch (error) {
    // Silent failure - never break the app
    console.warn('Analytics error:', error)
  }
}

// Helper for tracking property changes
export function trackPropertyChange(
  eventName: string,
  project: Project | null,
  entityType: string,
  entityId: string,
  propertyName: string,
  oldValue: any,
  newValue: any,
  sourceView?: string,
  interactionType?: string
): void {
  const metadata: Record<string, any> = {
    entity_type: entityType,
    entity_id: entityId,
    property_changed: propertyName,
    old_value: oldValue,
    new_value: newValue
  }

  if (sourceView) {
    metadata.source_view = sourceView
  }

  if (interactionType) {
    metadata.interaction_type = interactionType
  }

  trackEvent(eventName, project, metadata)
}

// Helper for tracking text field edits (character count only, no PII)
export function trackTextFieldEdit(
  project: Project | null,
  entityType: string,
  fieldName: string,
  oldText: string | undefined,
  newText: string | undefined,
  source: 'inspector' | 'overlay'
): void {
  const oldCharCount = oldText?.length || 0
  const newCharCount = newText?.length || 0

  if (oldCharCount === newCharCount) return // No actual change

  let editType: 'added_text' | 'deleted_text' | 'replaced_text' | 'cleared'
  if (newCharCount === 0) {
    editType = 'cleared'
  } else if (oldCharCount === 0) {
    editType = 'added_text'
  } else if (newCharCount < oldCharCount) {
    editType = 'deleted_text'
  } else {
    editType = 'replaced_text'
  }

  trackEvent('text_field_edited', project, {
    entity_type: entityType,
    field_name: fieldName,
    old_char_count: oldCharCount,
    new_char_count: newCharCount,
    edit_type: editType,
    source
  })
}

// Helper to extract URL platform type (for repo URLs)
export function extractUrlPlatform(url: string | undefined): 'github' | 'gitlab' | 'bitbucket' | 'other' | null {
  if (!url) return null

  const lower = url.toLowerCase()
  if (lower.includes('github.com')) return 'github'
  if (lower.includes('gitlab.com')) return 'gitlab'
  if (lower.includes('bitbucket.org')) return 'bitbucket'
  return 'other'
}

// FTUE (First Time User Experience) milestone tracking
// These milestones fire only once per browser session using sessionStorage

const SESSION_STORAGE_KEY_PREFIX = 'contextflow.ftue.'
const SESSION_START_KEY = 'contextflow.session_start'

export function getSessionStartTime(): number {
  const stored = sessionStorage.getItem(SESSION_START_KEY)
  if (stored) {
    return parseInt(stored, 10)
  }
  const now = Date.now()
  sessionStorage.setItem(SESSION_START_KEY, now.toString())
  return now
}

export function trackFTUEMilestone(
  milestoneName: 'first_context_added' | 'first_relationship_added' | 'first_group_created' | 'second_view_discovered',
  project: Project | null,
  metadata?: Record<string, any>
): void {
  const sessionKey = `${SESSION_STORAGE_KEY_PREFIX}${milestoneName}`

  // Only track once per session
  if (sessionStorage.getItem(sessionKey)) {
    return
  }

  const sessionStart = getSessionStartTime()
  const timeSinceLoad = Math.floor((Date.now() - sessionStart) / MILLISECONDS_PER_SECOND)

  const eventMetadata = {
    time_since_load_seconds: timeSinceLoad,
    ...metadata
  }

  trackEvent(milestoneName, project, eventMetadata)

  // Mark as tracked for this session
  sessionStorage.setItem(sessionKey, 'true')
}

export function hasCompletedFTUEMilestone(
  milestoneName: 'first_context_added' | 'first_relationship_added' | 'first_group_created' | 'second_view_discovered'
): boolean {
  const sessionKey = `${SESSION_STORAGE_KEY_PREFIX}${milestoneName}`
  return sessionStorage.getItem(sessionKey) === 'true'
}
