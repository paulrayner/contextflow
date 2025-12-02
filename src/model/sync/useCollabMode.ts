import type { Project, BoundedContext } from '../types';
import { useCollabStore, type CollabStore, type CollabStoreOptions } from './useCollabStore';

let collabStore: CollabStore | null = null;

export interface CollabMutations {
  addContext(context: BoundedContext): void;
  updateContext(contextId: string, updates: Partial<BoundedContext>): void;
  deleteContext(contextId: string): void;
  updateContextPosition(contextId: string, positions: BoundedContext['positions']): void;
}

export interface CollabUndoRedo {
  canUndo: boolean | null;
  canRedo: boolean | null;
  undo(): void;
  redo(): void;
}

export function initializeCollabMode(project: Project, options: CollabStoreOptions = {}): void {
  if (collabStore) {
    collabStore.destroy();
  }
  collabStore = useCollabStore(project, options);
}

export function destroyCollabMode(): void {
  if (collabStore) {
    collabStore.destroy();
    collabStore = null;
  }
}

export function getCollabStore(): CollabStore | null {
  return collabStore;
}

export function isCollabModeActive(): boolean {
  return collabStore !== null;
}

export function getCollabMutations(): CollabMutations {
  return {
    addContext(context: BoundedContext): void {
      collabStore?.addContext(context);
    },
    updateContext(contextId: string, updates: Partial<BoundedContext>): void {
      collabStore?.updateContext(contextId, updates);
    },
    deleteContext(contextId: string): void {
      collabStore?.deleteContext(contextId);
    },
    updateContextPosition(contextId: string, positions: BoundedContext['positions']): void {
      collabStore?.updateContextPosition(contextId, positions);
    },
  };
}

export function getCollabUndoRedo(): CollabUndoRedo {
  return {
    get canUndo(): boolean | null {
      return collabStore?.canUndo() ?? null;
    },
    get canRedo(): boolean | null {
      return collabStore?.canRedo() ?? null;
    },
    undo(): void {
      collabStore?.undo();
    },
    redo(): void {
      collabStore?.redo();
    },
  };
}
