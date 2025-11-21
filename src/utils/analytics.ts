import type { Project } from '../model/types'

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
