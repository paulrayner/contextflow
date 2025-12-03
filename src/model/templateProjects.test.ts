import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project } from './types';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

function createTestProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [],
    relationships: [],
    repos: [],
    people: [],
    teams: [],
    groups: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: { flowStages: [] },
    ...overrides,
  };
}

describe('templateProjects', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  describe('TEMPLATE_PROJECT_IDS', () => {
    it('contains all built-in project IDs', async () => {
      const { TEMPLATE_PROJECT_IDS } = await import('./templateProjects');
      expect(TEMPLATE_PROJECT_IDS).toContain('acme-ecommerce');
      expect(TEMPLATE_PROJECT_IDS).toContain('cbioportal');
      expect(TEMPLATE_PROJECT_IDS).toContain('empty-project');
      expect(TEMPLATE_PROJECT_IDS).toContain('elan-warranty');
    });
  });

  describe('isTemplateProject', () => {
    it('returns true for template project IDs', async () => {
      const { isTemplateProject } = await import('./templateProjects');
      expect(isTemplateProject('acme-ecommerce')).toBe(true);
      expect(isTemplateProject('cbioportal')).toBe(true);
    });

    it('returns false for user project IDs', async () => {
      const { isTemplateProject } = await import('./templateProjects');
      expect(isTemplateProject('user-project-1')).toBe(false);
      expect(isTemplateProject('random-uuid')).toBe(false);
    });
  });

  describe('getTemplateById', () => {
    it('returns template project for valid ID', async () => {
      const { getTemplateById } = await import('./templateProjects');
      const template = getTemplateById('acme-ecommerce');
      expect(template).not.toBeNull();
      expect(template?.id).toBe('acme-ecommerce');
    });

    it('returns null for invalid ID', async () => {
      const { getTemplateById } = await import('./templateProjects');
      const template = getTemplateById('invalid-id');
      expect(template).toBeNull();
    });
  });

  describe('createProjectFromTemplate', () => {
    it('creates a new project with unique ID', async () => {
      const { createProjectFromTemplate } = await import('./templateProjects');
      const newProject = createProjectFromTemplate('acme-ecommerce');
      expect(newProject.id).not.toBe('acme-ecommerce');
      expect(newProject.id.length).toBeGreaterThan(0);
    });

    it('preserves template content in new project', async () => {
      const { createProjectFromTemplate, getTemplateById } = await import('./templateProjects');
      const template = getTemplateById('acme-ecommerce')!;
      const newProject = createProjectFromTemplate('acme-ecommerce');

      expect(newProject.contexts.length).toBe(template.contexts.length);
      expect(newProject.relationships.length).toBe(template.relationships.length);
    });

    it('regenerates all entity IDs in new project', async () => {
      const { createProjectFromTemplate, getTemplateById } = await import('./templateProjects');
      const template = getTemplateById('acme-ecommerce')!;
      const newProject = createProjectFromTemplate('acme-ecommerce');

      if (template.contexts.length > 0) {
        const templateContextIds = new Set(template.contexts.map(c => c.id));
        const newContextIds = new Set(newProject.contexts.map(c => c.id));
        for (const id of newContextIds) {
          expect(templateContextIds.has(id)).toBe(false);
        }
      }
    });

    it('sets createdAt and updatedAt to current time', async () => {
      const { createProjectFromTemplate } = await import('./templateProjects');
      const before = new Date();
      const newProject = createProjectFromTemplate('acme-ecommerce');
      const after = new Date();

      const created = new Date(newProject.createdAt!);
      const updated = new Date(newProject.updatedAt!);
      expect(created.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(created.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(updated.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('throws error for invalid template ID', async () => {
      const { createProjectFromTemplate } = await import('./templateProjects');
      expect(() => createProjectFromTemplate('invalid-id')).toThrow();
    });
  });
});
