import type { Project } from '../types'

export function isProjectEmpty(project: Project): boolean {
  return project.contexts.length === 0 && project.users.length === 0
}

export function isSampleProject(project: Project): boolean {
  return project.isBuiltIn === true && project.name !== 'Empty Project'
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
  if (isSampleProject(project) && !seenSampleProjects.has(project.id)) return true
  return false
}
