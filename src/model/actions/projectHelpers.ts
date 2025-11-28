import type { Project } from '../types'

export function isProjectEmpty(project: Project): boolean {
  return project.contexts.length === 0 && project.users.length === 0
}
