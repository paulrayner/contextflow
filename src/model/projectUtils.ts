import type { Project } from './types'

const BUILT_IN_PROJECT_IDS = ['acme-ecommerce', 'cbioportal', 'elan-warranty']

export function isBuiltInProject(projectId: string): boolean {
  return BUILT_IN_PROJECT_IDS.includes(projectId)
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Never'

  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export interface ProjectMetadata {
  contextCount: number
  lastModified: string | undefined
}

export function getProjectMetadata(project: Project): ProjectMetadata {
  return {
    contextCount: project.contexts.length,
    lastModified: project.updatedAt ?? project.createdAt,
  }
}

export function sortProjectsByLastModified(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const aTime = a.updatedAt ?? a.createdAt ?? ''
    const bTime = b.updatedAt ?? b.createdAt ?? ''

    if (!aTime && !bTime) return 0
    if (!aTime) return 1
    if (!bTime) return -1

    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })
}
