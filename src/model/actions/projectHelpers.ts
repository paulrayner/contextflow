import type { Project } from '../types'
import { determineProjectOrigin } from '../builtInProjects'

export function isProjectEmpty(project: Project): boolean {
  return project.contexts.length === 0 && project.users.length === 0
}

export function isSampleProject(projectId: string): boolean {
  return determineProjectOrigin(projectId, false) === 'sample'
}

export function shouldShowGettingStartedGuide(
  project: Project,
  seenSampleProjects: Set<string>,
  manuallyOpened: boolean,
  welcomeModalDismissed: boolean,
  dismissedForEmptyProject: boolean
): boolean {
  if (manuallyOpened) return true
  if (!welcomeModalDismissed) return false
  if (isProjectEmpty(project) && !dismissedForEmptyProject) return true
  if (isSampleProject(project.id) && !seenSampleProjects.has(project.id)) return true
  return false
}
