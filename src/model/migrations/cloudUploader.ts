import * as Y from 'yjs';
import type { Project } from '../types';
import { populateYDocWithProject, yDocToProject } from '../sync/projectSync';
import { getCollabHost } from '../collabStore';

const UPLOAD_TIMEOUT_MS = 30000;
const SYNC_DELAY_MS = 500;

export async function uploadProjectToCloud(project: Project): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ydoc = new Y.Doc();
    populateYDocWithProject(ydoc, project);

    const host = getCollabHost();

    // @ts-expect-error - TypeScript's Node moduleResolution can't resolve subpath exports
    import('y-partyserver/provider')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ default: YProvider }: any) => {
        const provider = new YProvider(host, project.id, ydoc, {
          connect: true,
          party: 'yjs-room',
        });

        const timeout = setTimeout(() => {
          provider.destroy();
          ydoc.destroy();
          reject(new Error('Upload timeout'));
        }, UPLOAD_TIMEOUT_MS);

        provider.on('sync', () => {
          clearTimeout(timeout);
          setTimeout(() => {
            provider.destroy();
            ydoc.destroy();
            resolve();
          }, SYNC_DELAY_MS);
        });

        provider.on('connection-error', () => {
          clearTimeout(timeout);
          provider.destroy();
          ydoc.destroy();
          reject(new Error('Connection failed'));
        });
      })
      .catch((error: Error) => {
        ydoc.destroy();
        reject(error);
      });
  });
}

export async function downloadProjectFromCloud(projectId: string): Promise<Project> {
  return new Promise<Project>((resolve, reject) => {
    const ydoc = new Y.Doc();
    const host = getCollabHost();

    // @ts-expect-error - TypeScript's Node moduleResolution can't resolve subpath exports
    import('y-partyserver/provider')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ default: YProvider }: any) => {
        const provider = new YProvider(host, projectId, ydoc, {
          connect: true,
          party: 'yjs-room',
        });

        const timeout = setTimeout(() => {
          provider.destroy();
          ydoc.destroy();
          reject(new Error('Download timeout'));
        }, UPLOAD_TIMEOUT_MS);

        provider.on('sync', () => {
          clearTimeout(timeout);
          try {
            const project = yDocToProject(ydoc);
            provider.destroy();
            ydoc.destroy();
            resolve(project);
          } catch (error) {
            provider.destroy();
            ydoc.destroy();
            reject(error);
          }
        });

        provider.on('connection-error', () => {
          clearTimeout(timeout);
          provider.destroy();
          ydoc.destroy();
          reject(new Error('Connection failed'));
        });
      })
      .catch((error: Error) => {
        ydoc.destroy();
        reject(error);
      });
  });
}
