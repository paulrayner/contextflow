import * as Y from 'yjs';

export class CollabUndoManager {
  private undoManager: Y.UndoManager;

  constructor(scope: Y.Map<unknown> | Y.Array<unknown>) {
    this.undoManager = new Y.UndoManager(scope, {
      captureTimeout: 0,
      trackedOrigins: new Set([null]),
    });
  }

  canUndo(): boolean {
    return this.undoManager.canUndo();
  }

  canRedo(): boolean {
    return this.undoManager.canRedo();
  }

  undo(): void {
    this.undoManager.undo();
  }

  redo(): void {
    this.undoManager.redo();
  }

  clear(): void {
    this.undoManager.clear();
  }

  stopCapturing(): void {
    this.undoManager.trackedOrigins.delete(null);
  }

  resumeCapturing(): void {
    this.undoManager.trackedOrigins.add(null);
  }

  destroy(): void {
    this.undoManager.destroy();
  }
}

export function createUndoManager(ydoc: Y.Doc): CollabUndoManager {
  const yProject = ydoc.getMap('project');
  return new CollabUndoManager(yProject);
}
