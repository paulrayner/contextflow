import type { Project } from './types';
import { BUILT_IN_PROJECTS } from './builtInProjects';
import { regenerateAllIds } from './actions/projectActions';

export function getTemplateByName(name: string): Project | null {
  return BUILT_IN_PROJECTS.find((p) => p.name === name) || null;
}

export function createProjectFromTemplate(name: string): Project {
  const template = getTemplateByName(name);
  if (!template) {
    throw new Error(`Template not found: ${name}`);
  }

  return regenerateAllIds(template);
}
