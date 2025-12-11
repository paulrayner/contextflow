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

describe('templateProjects', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  describe('getTemplateByName', () => {
    it('returns template project for valid name', async () => {
      const { getTemplateByName } = await import('./templateProjects');
      const template = getTemplateByName('ACME E-Commerce Platform');
      expect(template).not.toBeNull();
      expect(template?.name).toBe('ACME E-Commerce Platform');
    });

    it('returns null for invalid name', async () => {
      const { getTemplateByName } = await import('./templateProjects');
      const template = getTemplateByName('invalid-name');
      expect(template).toBeNull();
    });

    it('returns Empty Project template', async () => {
      const { getTemplateByName } = await import('./templateProjects');
      const template = getTemplateByName('Empty Project');
      expect(template).not.toBeNull();
      expect(template?.name).toBe('Empty Project');
    });
  });

  describe('createProjectFromTemplate', () => {
    it('creates a new project with unique ID', async () => {
      const { createProjectFromTemplate, getTemplateByName } = await import('./templateProjects');
      const template = getTemplateByName('ACME E-Commerce Platform')!;
      const newProject = createProjectFromTemplate('ACME E-Commerce Platform');
      expect(newProject.id).not.toBe(template.id);
      expect(newProject.id.length).toBeGreaterThan(0);
    });

    it('preserves template content in new project', async () => {
      const { createProjectFromTemplate, getTemplateByName } = await import('./templateProjects');
      const template = getTemplateByName('ACME E-Commerce Platform')!;
      const newProject = createProjectFromTemplate('ACME E-Commerce Platform');

      expect(newProject.contexts.length).toBe(template.contexts.length);
      expect(newProject.relationships.length).toBe(template.relationships.length);
    });

    it('regenerates all entity IDs in new project', async () => {
      const { createProjectFromTemplate, getTemplateByName } = await import('./templateProjects');
      const template = getTemplateByName('ACME E-Commerce Platform')!;
      const newProject = createProjectFromTemplate('ACME E-Commerce Platform');

      if (template.contexts.length > 0) {
        const templateContextIds = new Set(template.contexts.map((c: { id: string }) => c.id));
        const newContextIds = new Set(newProject.contexts.map((c: { id: string }) => c.id));
        for (const id of newContextIds) {
          expect(templateContextIds.has(id)).toBe(false);
        }
      }
    });

    it('sets createdAt and updatedAt to current time', async () => {
      const { createProjectFromTemplate } = await import('./templateProjects');
      const before = new Date();
      const newProject = createProjectFromTemplate('ACME E-Commerce Platform');
      const after = new Date();

      const created = new Date(newProject.createdAt!);
      const updated = new Date(newProject.updatedAt!);
      expect(created.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(created.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(updated.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('throws error for invalid template name', async () => {
      const { createProjectFromTemplate } = await import('./templateProjects');
      expect(() => createProjectFromTemplate('invalid-name')).toThrow();
    });
  });
});
