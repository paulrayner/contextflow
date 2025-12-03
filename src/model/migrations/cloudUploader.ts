import * as Y from 'yjs';
import type { Project } from '../types';
import { populateYDocWithProject, yDocToProject } from '../sync/projectSync';
import { getCollabHost } from '../collabStore';

// Total timeout allows for multiple reconnection attempts with exponential backoff
// Provider uses built-in reconnection with maxBackoffTime between attempts
const UPLOAD_TIMEOUT_MS = 60000;
const SYNC_DELAY_MS = 500;
const MAX_BACKOFF_TIME_MS = 5000;

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
          maxBackoffTime: MAX_BACKOFF_TIME_MS,
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

        // Note: No connection-error handler - let provider's built-in
        // exponential backoff reconnection work within the timeout window
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
          maxBackoffTime: MAX_BACKOFF_TIME_MS,
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

        // Note: No connection-error handler - let provider's built-in
        // exponential backoff reconnection work within the timeout window
      })
      .catch((error: Error) => {
        ydoc.destroy();
        reject(error);
      });
  });
}
