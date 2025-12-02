import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';

import { createUndoManager, CollabUndoManager } from '../undoManager';
import { projectToYDoc } from '../projectSync';
import type { Project } from '../../types';

function createTestProject(): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [
      {
        id: 'ctx-1',
        name: 'Context One',
        evolutionStage: 'custom-built',
        positions: {
          flow: { x: 100 },
          strategic: { x: 200 },
          distillation: { x: 300, y: 300 },
          shared: { y: 100 },
        },
      },
    ],
    relationships: [],
    groups: [],
    repos: [],
    people: [],
    teams: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: {
      flowStages: [],
    },
    temporal: {
      enabled: false,
      keyframes: [],
    },
  };
}

describe('CollabUndoManager', () => {
  describe('createUndoManager', () => {
    it('should create an undo manager for a Y.Doc', () => {
      const ydoc = new Y.Doc();
      const undoManager = createUndoManager(ydoc);

      expect(undoManager).toBeInstanceOf(CollabUndoManager);
    });

    it('should track changes to the project map', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      yProject.set('name', 'Updated Name');

      expect(undoManager.canUndo()).toBe(true);
    });
  });

  describe('undo', () => {
    it('should undo a single change', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      yProject.set('name', 'Updated Name');

      expect(yProject.get('name')).toBe('Updated Name');

      undoManager.undo();

      expect(yProject.get('name')).toBe('Test Project');
    });

    it('should undo adding a context', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

      const newContext = new Y.Map();
      newContext.set('id', 'ctx-2');
      newContext.set('name', 'New Context');
      const positions = new Y.Map();
      positions.set('flow', new Y.Map([['x', 0], ['y', 0]]));
      positions.set('strategic', new Y.Map([['x', 0], ['y', 0]]));
      positions.set('distillation', new Y.Map([['x', 0], ['y', 0]]));
      positions.set('shared', new Y.Map([['y', 0]]));
      newContext.set('positions', positions);
      yContexts.push([newContext]);

      expect(yContexts.length).toBe(2);

      undoManager.undo();

      expect(yContexts.length).toBe(1);
      expect((yContexts.get(0) as Y.Map<unknown>).get('id')).toBe('ctx-1');
    });

    it('should undo deleting a context', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

      expect(yContexts.length).toBe(1);

      yContexts.delete(0);

      expect(yContexts.length).toBe(0);

      undoManager.undo();

      expect(yContexts.length).toBe(1);
      expect((yContexts.get(0) as Y.Map<unknown>).get('id')).toBe('ctx-1');
    });

    it('should undo moving a context position', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;
      const yContext = yContexts.get(0);
      const yPositions = yContext.get('positions') as Y.Map<Y.Map<unknown>>;
      const yFlow = yPositions.get('flow') as Y.Map<number>;

      yFlow.set('x', 500);

      expect(yFlow.get('x')).toBe(500);

      undoManager.undo();

      expect(yFlow.get('x')).toBe(100);
    });

    it('should return false when there is nothing to undo', () => {
      const ydoc = new Y.Doc();
      const undoManager = createUndoManager(ydoc);

      expect(undoManager.canUndo()).toBe(false);
    });
  });

  describe('redo', () => {
    it('should redo an undone change', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      yProject.set('name', 'Updated Name');

      undoManager.undo();
      expect(yProject.get('name')).toBe('Test Project');

      undoManager.redo();
      expect(yProject.get('name')).toBe('Updated Name');
    });

    it('should redo adding a context after undo', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

      const newContext = new Y.Map();
      newContext.set('id', 'ctx-2');
      newContext.set('name', 'New Context');
      const positions = new Y.Map();
      positions.set('flow', new Y.Map([['x', 0], ['y', 0]]));
      positions.set('strategic', new Y.Map([['x', 0], ['y', 0]]));
      positions.set('distillation', new Y.Map([['x', 0], ['y', 0]]));
      positions.set('shared', new Y.Map([['y', 0]]));
      newContext.set('positions', positions);
      yContexts.push([newContext]);

      undoManager.undo();
      expect(yContexts.length).toBe(1);

      undoManager.redo();
      expect(yContexts.length).toBe(2);
    });

    it('should return false when there is nothing to redo', () => {
      const ydoc = new Y.Doc();
      const undoManager = createUndoManager(ydoc);

      expect(undoManager.canRedo()).toBe(false);
    });

    it('should clear redo stack when new changes are made after undo', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      yProject.set('name', 'First Update');

      undoManager.undo();
      expect(undoManager.canRedo()).toBe(true);

      yProject.set('name', 'Second Update');
      expect(undoManager.canRedo()).toBe(false);
    });
  });

  describe('multiple operations', () => {
    it('should undo multiple changes in order', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      yProject.set('name', 'First Update');
      yProject.set('name', 'Second Update');
      yProject.set('name', 'Third Update');

      expect(yProject.get('name')).toBe('Third Update');

      undoManager.undo();
      expect(yProject.get('name')).toBe('Second Update');

      undoManager.undo();
      expect(yProject.get('name')).toBe('First Update');

      undoManager.undo();
      expect(yProject.get('name')).toBe('Test Project');
    });

    it('should handle interleaved undo and redo', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      yProject.set('name', 'First');
      yProject.set('name', 'Second');

      undoManager.undo();
      expect(yProject.get('name')).toBe('First');

      undoManager.redo();
      expect(yProject.get('name')).toBe('Second');

      undoManager.undo();
      undoManager.undo();
      expect(yProject.get('name')).toBe('Test Project');

      undoManager.redo();
      expect(yProject.get('name')).toBe('First');
    });
  });

  describe('clear', () => {
    it('should clear undo and redo stacks', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');
      yProject.set('name', 'Updated');

      undoManager.undo();
      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(true);

      undoManager.clear();
      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(false);
    });
  });

  describe('stopCapturing and resumeCapturing', () => {
    it('should not track changes when capturing is stopped', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');

      undoManager.stopCapturing();
      yProject.set('name', 'Updated During Stop');
      undoManager.resumeCapturing();

      expect(yProject.get('name')).toBe('Updated During Stop');
      expect(undoManager.canUndo()).toBe(false);
    });

    it('should resume tracking changes after resumeCapturing', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      const yProject = ydoc.getMap('project');

      undoManager.stopCapturing();
      yProject.set('name', 'Skipped');
      undoManager.resumeCapturing();

      yProject.set('name', 'Tracked');

      expect(undoManager.canUndo()).toBe(true);
      undoManager.undo();
      expect(yProject.get('name')).toBe('Skipped');
    });
  });

  describe('destroy', () => {
    it('should clean up the undo manager', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const undoManager = createUndoManager(ydoc);

      undoManager.destroy();

      const yProject = ydoc.getMap('project');
      yProject.set('name', 'After Destroy');

      expect(undoManager.canUndo()).toBe(false);
    });
  });
});
