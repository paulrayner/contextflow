import * as Y from 'yjs';
import type { Project, BoundedContext, Relationship } from '../types';
import { projectToYDoc, yDocToProject } from './projectSync';
import { SyncManager } from './syncManager';
import { CollabUndoManager, createUndoManager } from './undoManager';
import {
  addContextMutation,
  updateContextMutation,
  deleteContextMutation,
  updateContextPositionMutation,
} from './contextMutations';
import {
  addRelationshipMutation,
  updateRelationshipMutation,
  deleteRelationshipMutation,
} from './relationshipMutations';

export interface CollabStoreOptions {
  onProjectChange?: (project: Project) => void;
}

export interface CollabStore {
  getYDoc(): Y.Doc;
  getProject(): Project;
  addContext(context: BoundedContext): void;
  updateContext(contextId: string, updates: Partial<BoundedContext>): void;
  deleteContext(contextId: string): void;
  updateContextPosition(contextId: string, positions: BoundedContext['positions']): void;
  addRelationship(relationship: Relationship): void;
  updateRelationship(relationshipId: string, updates: Partial<Relationship>): void;
  deleteRelationship(relationshipId: string): void;
  canUndo(): boolean;
  canRedo(): boolean;
  undo(): void;
  redo(): void;
  reset(project: Project): void;
  destroy(): void;
}

export function useCollabStore(project: Project, options: CollabStoreOptions = {}): CollabStore {
  let ydoc = projectToYDoc(project);
  let syncManager: SyncManager | null = null;
  let undoManager: CollabUndoManager | null = null;
  let isDestroyed = false;

  const handleProjectChange = (updatedProject: Project): void => {
    if (options.onProjectChange) {
      options.onProjectChange(updatedProject);
    }
  };

  syncManager = new SyncManager(ydoc, handleProjectChange);
  undoManager = createUndoManager(ydoc);

  const store: CollabStore = {
    getYDoc(): Y.Doc {
      return ydoc;
    },

    getProject(): Project {
      return yDocToProject(ydoc);
    },

    addContext(context: BoundedContext): void {
      addContextMutation(ydoc, context);
    },

    updateContext(contextId: string, updates: Partial<BoundedContext>): void {
      updateContextMutation(ydoc, contextId, updates);
    },

    deleteContext(contextId: string): void {
      deleteContextMutation(ydoc, contextId);
    },

    updateContextPosition(contextId: string, positions: BoundedContext['positions']): void {
      updateContextPositionMutation(ydoc, contextId, positions);
    },

    addRelationship(relationship: Relationship): void {
      addRelationshipMutation(ydoc, relationship);
    },

    updateRelationship(relationshipId: string, updates: Partial<Relationship>): void {
      updateRelationshipMutation(ydoc, relationshipId, updates);
    },

    deleteRelationship(relationshipId: string): void {
      deleteRelationshipMutation(ydoc, relationshipId);
    },

    canUndo(): boolean {
      return undoManager?.canUndo() ?? false;
    },

    canRedo(): boolean {
      return undoManager?.canRedo() ?? false;
    },

    undo(): void {
      undoManager?.undo();
    },

    redo(): void {
      undoManager?.redo();
    },

    reset(newProject: Project): void {
      syncManager?.destroy();
      undoManager?.destroy();

      ydoc = projectToYDoc(newProject);
      syncManager = new SyncManager(ydoc, handleProjectChange);
      undoManager = createUndoManager(ydoc);
    },

    destroy(): void {
      if (isDestroyed) return;
      isDestroyed = true;

      syncManager?.destroy();
      syncManager = null;

      undoManager?.destroy();
      undoManager = null;
    },
  };

  return store;
}
