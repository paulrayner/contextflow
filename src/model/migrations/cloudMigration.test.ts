import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Project } from '../types';

// Mock localStorage
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

// Mock navigator.onLine
Object.defineProperty(global, 'navigator', {
  value: { onLine: true },
  writable: true,
});

const BUILT_IN_PROJECT_IDS = [
  'acme-ecommerce',
  'cbioportal',
  'empty-project',
  'elan-warranty',
];

function createTestProject(overrides: Partial<Project> = {}): Project {
  return {
    id: `test-project-${Date.now()}`,
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

describe('cloudMigration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  describe('isMigrationComplete', () => {
    it('returns false when migration flag is not set', async () => {
      const { isMigrationComplete } = await import('./cloudMigration');
      expect(isMigrationComplete()).toBe(false);
    });

    it('returns true when migration flag is set to true', async () => {
      localStorage.setItem('contextflow_migrated', 'true');
      const { isMigrationComplete } = await import('./cloudMigration');
      expect(isMigrationComplete()).toBe(true);
    });

    it('returns false when migration flag is set to false', async () => {
      localStorage.setItem('contextflow_migrated', 'false');
      const { isMigrationComplete } = await import('./cloudMigration');
      expect(isMigrationComplete()).toBe(false);
    });
  });

  describe('filterMigratableProjects', () => {
    it('filters out built-in project IDs', async () => {
      const { filterMigratableProjects } = await import('./cloudMigration');

      const projects: Project[] = [
        createTestProject({ id: 'acme-ecommerce', name: 'ACME' }),
        createTestProject({ id: 'cbioportal', name: 'CBioPortal' }),
        createTestProject({ id: 'user-project-1', name: 'My Project' }),
      ];

      const result = filterMigratableProjects(projects);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-project-1');
    });

    it('returns empty array when all projects are built-in', async () => {
      const { filterMigratableProjects } = await import('./cloudMigration');

      const projects: Project[] = BUILT_IN_PROJECT_IDS.map((id) =>
        createTestProject({ id, name: id })
      );

      const result = filterMigratableProjects(projects);
      expect(result).toHaveLength(0);
    });

    it('returns all projects when none are built-in', async () => {
      const { filterMigratableProjects } = await import('./cloudMigration');

      const projects: Project[] = [
        createTestProject({ id: 'custom-1', name: 'Custom 1' }),
        createTestProject({ id: 'custom-2', name: 'Custom 2' }),
      ];

      const result = filterMigratableProjects(projects);
      expect(result).toHaveLength(2);
    });
  });

  describe('canPerformMigration', () => {
    it('returns true when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      const { canPerformMigration } = await import('./cloudMigration');
      expect(canPerformMigration()).toBe(true);
    });

    it('returns false when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      const { canPerformMigration } = await import('./cloudMigration');
      expect(canPerformMigration()).toBe(false);
    });
  });

  describe('projectsAreEqual', () => {
    it('returns true for identical projects', async () => {
      const { projectsAreEqual } = await import('./cloudMigration');

      const project = createTestProject({
        id: 'test-1',
        name: 'Test',
        contexts: [{ id: 'ctx-1', name: 'Context 1', positions: { flow: { x: 0 }, strategic: { x: 0 }, distillation: { x: 0, y: 0 }, shared: { y: 0 } }, evolutionStage: 'custom-built' }],
      });

      expect(projectsAreEqual(project, project)).toBe(true);
    });

    it('returns false when IDs differ', async () => {
      const { projectsAreEqual } = await import('./cloudMigration');

      const original = createTestProject({ id: 'test-1' });
      const downloaded = createTestProject({ id: 'test-2' });

      expect(projectsAreEqual(original, downloaded)).toBe(false);
    });

    it('returns false when names differ', async () => {
      const { projectsAreEqual } = await import('./cloudMigration');

      const original = createTestProject({ id: 'test-1', name: 'Original' });
      const downloaded = createTestProject({ id: 'test-1', name: 'Different' });

      expect(projectsAreEqual(original, downloaded)).toBe(false);
    });

    it('returns false when context counts differ', async () => {
      const { projectsAreEqual } = await import('./cloudMigration');

      const ctx = { id: 'ctx-1', name: 'Context', positions: { flow: { x: 0 }, strategic: { x: 0 }, distillation: { x: 0, y: 0 }, shared: { y: 0 } }, evolutionStage: 'custom-built' as const };
      const original = createTestProject({ id: 'test-1', contexts: [ctx] });
      const downloaded = createTestProject({ id: 'test-1', contexts: [] });

      expect(projectsAreEqual(original, downloaded)).toBe(false);
    });

    it('returns false when context IDs differ', async () => {
      const { projectsAreEqual } = await import('./cloudMigration');

      const ctx1 = { id: 'ctx-1', name: 'Context', positions: { flow: { x: 0 }, strategic: { x: 0 }, distillation: { x: 0, y: 0 }, shared: { y: 0 } }, evolutionStage: 'custom-built' as const };
      const ctx2 = { id: 'ctx-2', name: 'Context', positions: { flow: { x: 0 }, strategic: { x: 0 }, distillation: { x: 0, y: 0 }, shared: { y: 0 } }, evolutionStage: 'custom-built' as const };

      const original = createTestProject({ id: 'test-1', contexts: [ctx1] });
      const downloaded = createTestProject({ id: 'test-1', contexts: [ctx2] });

      expect(projectsAreEqual(original, downloaded)).toBe(false);
    });
  });

  describe('hasPendingMigration', () => {
    it('returns false when migration is already complete', async () => {
      localStorage.setItem('contextflow_migrated', 'true');

      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([]),
      }));

      const { hasPendingMigration } = await import('./cloudMigration');
      const result = await hasPendingMigration();
      expect(result).toBe(false);
    });

    it('returns false when no user projects exist', async () => {
      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([
          createTestProject({ id: 'acme-ecommerce' }),
        ]),
      }));

      const { hasPendingMigration } = await import('./cloudMigration');
      const result = await hasPendingMigration();
      expect(result).toBe(false);
    });

    it('returns true when user projects need migration', async () => {
      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([
          createTestProject({ id: 'user-project-1' }),
        ]),
      }));

      const { hasPendingMigration } = await import('./cloudMigration');
      const result = await hasPendingMigration();
      expect(result).toBe(true);
    });
  });

  describe('markMigrationComplete', () => {
    it('sets the migration flag to true', async () => {
      const { markMigrationComplete } = await import('./cloudMigration');
      markMigrationComplete();
      expect(localStorage.getItem('contextflow_migrated')).toBe('true');
    });

    it('sets the migration date', async () => {
      const { markMigrationComplete } = await import('./cloudMigration');
      markMigrationComplete();
      const dateStr = localStorage.getItem('contextflow_migration_date');
      expect(dateStr).not.toBeNull();
      expect(new Date(dateStr!).getTime()).toBeGreaterThan(0);
    });
  });

  describe('runMigration', () => {
    it('returns early if migration already complete', async () => {
      localStorage.setItem('contextflow_migrated', 'true');

      const { runMigration } = await import('./cloudMigration');
      const result = await runMigration();

      expect(result.total).toBe(0);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('returns early if offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { runMigration } = await import('./cloudMigration');
      const onError = vi.fn();
      const result = await runMigration({ onError });

      expect(result.total).toBe(0);
      expect(onError).toHaveBeenCalled();
    });

    it('marks migration complete when no user projects exist', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([
          createTestProject({ id: 'acme-ecommerce' }),
        ]),
        deleteProject: vi.fn(),
      }));

      const { runMigration, isMigrationComplete } = await import('./cloudMigration');
      await runMigration();

      expect(isMigrationComplete()).toBe(true);
    });

    it('calls onStart callback with total count', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([
          createTestProject({ id: 'user-project-1' }),
          createTestProject({ id: 'user-project-2' }),
        ]),
        deleteProject: vi.fn(),
      }));

      vi.doMock('./cloudUploader', () => ({
        uploadProjectToCloud: vi.fn().mockResolvedValue(undefined),
        downloadProjectFromCloud: vi.fn().mockImplementation((id: string) =>
          Promise.resolve(createTestProject({ id }))
        ),
      }));

      const { runMigration } = await import('./cloudMigration');
      const onStart = vi.fn();
      await runMigration({ onStart });

      expect(onStart).toHaveBeenCalledWith(2);
    });
  });

  describe('cleanupMigrationBackup', () => {
    it('does nothing if migration date is not set', async () => {
      const deleteProject = vi.fn();
      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([]),
        deleteProject,
      }));

      const { cleanupMigrationBackup } = await import('./cloudMigration');
      await cleanupMigrationBackup();

      expect(deleteProject).not.toHaveBeenCalled();
    });

    it('does not delete if less than 48 hours have passed', async () => {
      const now = new Date();
      localStorage.setItem('contextflow_migration_date', now.toISOString());

      const deleteProject = vi.fn();
      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([
          createTestProject({ id: 'user-project-1' }),
        ]),
        deleteProject,
      }));

      const { cleanupMigrationBackup } = await import('./cloudMigration');
      await cleanupMigrationBackup();

      expect(deleteProject).not.toHaveBeenCalled();
    });

    it('deletes user projects after 48 hours', async () => {
      const oldDate = new Date(Date.now() - 49 * 60 * 60 * 1000);
      localStorage.setItem('contextflow_migration_date', oldDate.toISOString());

      const deleteProject = vi.fn().mockResolvedValue(undefined);
      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([
          createTestProject({ id: 'user-project-1' }),
          createTestProject({ id: 'acme-ecommerce' }),
        ]),
        deleteProject,
      }));

      const { cleanupMigrationBackup } = await import('./cloudMigration');
      await cleanupMigrationBackup();

      expect(deleteProject).toHaveBeenCalledTimes(1);
      expect(deleteProject).toHaveBeenCalledWith('user-project-1');
    });

    it('removes migration date after cleanup', async () => {
      const oldDate = new Date(Date.now() - 49 * 60 * 60 * 1000);
      localStorage.setItem('contextflow_migration_date', oldDate.toISOString());

      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([]),
        deleteProject: vi.fn().mockResolvedValue(undefined),
      }));

      const { cleanupMigrationBackup } = await import('./cloudMigration');
      await cleanupMigrationBackup();

      expect(localStorage.getItem('contextflow_migration_date')).toBeNull();
    });

    it('does not delete local data if cloud verification fails', async () => {
      const oldDate = new Date(Date.now() - 49 * 60 * 60 * 1000);
      localStorage.setItem('contextflow_migration_date', oldDate.toISOString());

      const userProject = createTestProject({ id: 'user-project-1', name: 'My Project' });
      const deleteProject = vi.fn().mockResolvedValue(undefined);

      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([userProject]),
        deleteProject,
      }));

      vi.doMock('./cloudUploader', () => ({
        downloadProjectFromCloud: vi.fn().mockRejectedValue(new Error('Download timeout')),
      }));

      const { cleanupMigrationBackup } = await import('./cloudMigration');
      await cleanupMigrationBackup();

      expect(deleteProject).not.toHaveBeenCalled();
      expect(localStorage.getItem('contextflow_migration_date')).not.toBeNull();
    });

    it('does not delete local data if cloud data does not match', async () => {
      const oldDate = new Date(Date.now() - 49 * 60 * 60 * 1000);
      localStorage.setItem('contextflow_migration_date', oldDate.toISOString());

      const userProject = createTestProject({ id: 'user-project-1', name: 'My Project' });
      const corruptedProject = createTestProject({ id: 'user-project-1', name: 'Different Name' });
      const deleteProject = vi.fn().mockResolvedValue(undefined);

      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([userProject]),
        deleteProject,
      }));

      vi.doMock('./cloudUploader', () => ({
        downloadProjectFromCloud: vi.fn().mockResolvedValue(corruptedProject),
      }));

      const { cleanupMigrationBackup } = await import('./cloudMigration');
      await cleanupMigrationBackup();

      expect(deleteProject).not.toHaveBeenCalled();
      expect(localStorage.getItem('contextflow_migration_date')).not.toBeNull();
    });

    it('only deletes local data after successful cloud verification', async () => {
      const oldDate = new Date(Date.now() - 49 * 60 * 60 * 1000);
      localStorage.setItem('contextflow_migration_date', oldDate.toISOString());

      const userProject = createTestProject({ id: 'user-project-1', name: 'My Project' });
      const deleteProject = vi.fn().mockResolvedValue(undefined);

      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([userProject]),
        deleteProject,
      }));

      vi.doMock('./cloudUploader', () => ({
        downloadProjectFromCloud: vi.fn().mockResolvedValue(userProject),
      }));

      const { cleanupMigrationBackup } = await import('./cloudMigration');
      await cleanupMigrationBackup();

      expect(deleteProject).toHaveBeenCalledWith('user-project-1');
      expect(localStorage.getItem('contextflow_migration_date')).toBeNull();
    });

    it('skips deletion for projects that fail verification but continues with others', async () => {
      const oldDate = new Date(Date.now() - 49 * 60 * 60 * 1000);
      localStorage.setItem('contextflow_migration_date', oldDate.toISOString());

      const project1 = createTestProject({ id: 'project-1', name: 'Project 1' });
      const project2 = createTestProject({ id: 'project-2', name: 'Project 2' });
      const deleteProject = vi.fn().mockResolvedValue(undefined);

      vi.doMock('../persistence', () => ({
        loadAllProjects: vi.fn().mockResolvedValue([project1, project2]),
        deleteProject,
      }));

      vi.doMock('./cloudUploader', () => ({
        downloadProjectFromCloud: vi.fn()
          .mockRejectedValueOnce(new Error('Download timeout'))
          .mockResolvedValueOnce(project2),
      }));

      const { cleanupMigrationBackup } = await import('./cloudMigration');
      await cleanupMigrationBackup();

      expect(deleteProject).toHaveBeenCalledTimes(1);
      expect(deleteProject).toHaveBeenCalledWith('project-2');
      // Migration date should remain since not all projects were cleaned up
      expect(localStorage.getItem('contextflow_migration_date')).not.toBeNull();
    });
  });
});
