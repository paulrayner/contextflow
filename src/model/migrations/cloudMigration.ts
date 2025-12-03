import type { Project } from '../types';
import { loadAllProjects, deleteProject as deleteFromIndexedDB } from '../persistence';

const MIGRATION_FLAG_KEY = 'contextflow_migrated';
const MIGRATION_DATE_KEY = 'contextflow_migration_date';

const BUILT_IN_PROJECT_IDS = [
  'acme-ecommerce',
  'cbioportal',
  'empty-project',
  'elan-warranty',
];

export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

export function filterMigratableProjects(projects: Project[]): Project[] {
  return projects.filter((project) => !BUILT_IN_PROJECT_IDS.includes(project.id));
}

export function canPerformMigration(): boolean {
  return navigator.onLine;
}

export function projectsAreEqual(original: Project, downloaded: Project): boolean {
  if (original.id !== downloaded.id) return false;
  if (original.name !== downloaded.name) return false;
  if (original.contexts.length !== downloaded.contexts.length) return false;
  if (original.relationships.length !== downloaded.relationships.length) return false;
  if (original.groups.length !== downloaded.groups.length) return false;
  if (original.users.length !== downloaded.users.length) return false;
  if (original.userNeeds.length !== downloaded.userNeeds.length) return false;

  const originalContextIds = new Set(original.contexts.map((c) => c.id));
  const downloadedContextIds = new Set(downloaded.contexts.map((c) => c.id));
  for (const id of originalContextIds) {
    if (!downloadedContextIds.has(id)) return false;
  }

  return true;
}

export function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  localStorage.setItem(MIGRATION_DATE_KEY, new Date().toISOString());
}

export async function hasPendingMigration(): Promise<boolean> {
  if (isMigrationComplete()) return false;

  const existingProjects = await loadAllProjects();
  const projectsToMigrate = filterMigratableProjects(existingProjects);
  return projectsToMigrate.length > 0;
}

export interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  total: number;
  errors: Array<{ projectId: string; projectName: string; error: string }>;
}

export interface MigrationCallbacks {
  onStart?: (total: number) => void;
  onProgress?: (current: number, total: number, projectName: string) => void;
  onComplete?: (result: MigrationResult) => void;
  onError?: (error: Error) => void;
}

export async function runMigration(callbacks?: MigrationCallbacks): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    errors: [],
  };

  if (isMigrationComplete()) {
    return result;
  }

  if (!canPerformMigration()) {
    callbacks?.onError?.(new Error('Offline - migration deferred'));
    return result;
  }

  const existingProjects = await loadAllProjects();
  const projectsToMigrate = filterMigratableProjects(existingProjects);

  if (projectsToMigrate.length === 0) {
    markMigrationComplete();
    return result;
  }

  result.total = projectsToMigrate.length;
  callbacks?.onStart?.(result.total);

  const { uploadProjectToCloud, downloadProjectFromCloud } = await import('./cloudUploader');

  for (let i = 0; i < projectsToMigrate.length; i++) {
    const project = projectsToMigrate[i];
    callbacks?.onProgress?.(i + 1, result.total, project.name);

    try {
      await uploadProjectToCloud(project);

      const downloaded = await downloadProjectFromCloud(project.id);
      if (!projectsAreEqual(project, downloaded)) {
        throw new Error('Integrity check failed');
      }

      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        projectId: project.id,
        projectName: project.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (result.failed === 0) {
    markMigrationComplete();
  }

  callbacks?.onComplete?.(result);
  return result;
}

const BACKUP_CLEANUP_HOURS = 48;

export async function cleanupMigrationBackup(): Promise<void> {
  const migrationDate = localStorage.getItem(MIGRATION_DATE_KEY);
  if (!migrationDate) return;

  const hoursSinceMigration =
    (Date.now() - new Date(migrationDate).getTime()) / (1000 * 60 * 60);
  if (hoursSinceMigration >= BACKUP_CLEANUP_HOURS) {
    const projects = await loadAllProjects();
    const userProjects = filterMigratableProjects(projects);

    const { downloadProjectFromCloud } = await import('./cloudUploader');

    let allVerified = true;
    for (const project of userProjects) {
      try {
        const cloudProject = await downloadProjectFromCloud(project.id);
        if (projectsAreEqual(project, cloudProject)) {
          await deleteFromIndexedDB(project.id);
        } else {
          allVerified = false;
        }
      } catch {
        allVerified = false;
      }
    }

    if (allVerified) {
      localStorage.removeItem(MIGRATION_DATE_KEY);
    }
  }
}
