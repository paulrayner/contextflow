import * as Y from 'yjs';
import type { Project } from '../types';
import { yDocToProject } from './projectSync';

type ProjectChangeCallback = (project: Project) => void;

export class SyncManager {
  private ydoc: Y.Doc;
  private onProjectChange: ProjectChangeCallback;
  private observeHandler: ((events: Y.YEvent<Y.Map<unknown>>[], transaction: Y.Transaction) => void) | null = null;
  private isPaused = false;
  private isDestroyed = false;

  constructor(ydoc: Y.Doc, onProjectChange: ProjectChangeCallback) {
    this.ydoc = ydoc;
    this.onProjectChange = onProjectChange;
    this.setupObserver();
  }

  private setupObserver(): void {
    const yProject = this.ydoc.getMap('project');

    this.observeHandler = () => {
      if (this.isPaused || this.isDestroyed) {
        return;
      }

      // Only process if the project map has required fields
      if (!yProject.has('id')) {
        return;
      }

      try {
        const project = yDocToProject(this.ydoc);
        this.onProjectChange(project);
      } catch {
        // Ignore errors during partial updates
      }
    };

    yProject.observeDeep(this.observeHandler);
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  destroy(): void {
    this.isDestroyed = true;

    if (this.observeHandler) {
      const yProject = this.ydoc.getMap('project');
      yProject.unobserveDeep(this.observeHandler);
      this.observeHandler = null;
    }
  }
}
