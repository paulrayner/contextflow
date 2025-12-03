import type { Project } from './types';
import { BUILT_IN_PROJECTS } from './builtInProjects';
import { regenerateAllIds } from './actions/projectActions';

export const TEMPLATE_PROJECT_IDS = [
  'acme-ecommerce',
  'cbioportal',
  'empty-project',
  'elan-warranty',
];

export function isTemplateProject(projectId: string): boolean {
  return TEMPLATE_PROJECT_IDS.includes(projectId);
}

export function getTemplateById(templateId: string): Project | null {
  return BUILT_IN_PROJECTS.find((p) => p.id === templateId) || null;
}

export function createProjectFromTemplate(templateId: string): Project {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return regenerateAllIds(template);
}
