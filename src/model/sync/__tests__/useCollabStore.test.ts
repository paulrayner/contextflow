import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import * as Y from 'yjs';

import { useCollabStore, type CollabStore, type CollabStoreOptions } from '../useCollabStore';
import { projectToYDoc, yDocToProject } from '../projectSync';
import type { Project, BoundedContext } from '../../types';

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

describe('useCollabStore', () => {
  let project: Project;
  let store: CollabStore;
  let onProjectChange: Mock<(project: Project) => void>;

  beforeEach(() => {
    project = createTestProject();
    onProjectChange = vi.fn();
  });

  afterEach(() => {
    store?.destroy();
  });

  describe('initialization', () => {
    it('should initialize from a project', () => {
      store = useCollabStore(project, { onProjectChange });

      expect(store.getYDoc()).toBeInstanceOf(Y.Doc);
      expect(store.getProject().id).toBe('test-project');
      expect(store.getProject().contexts).toHaveLength(1);
    });

    it('should call onProjectChange callback when initialized', () => {
      store = useCollabStore(project, { onProjectChange });

      // Initial sync should NOT trigger callback (only mutations)
      expect(onProjectChange).not.toHaveBeenCalled();
    });
  });

  describe('addContext', () => {
    beforeEach(() => {
      store = useCollabStore(project, { onProjectChange });
    });

    it('should add a new context via Yjs mutation', () => {
      const newContext: BoundedContext = {
        id: 'ctx-2',
        name: 'Context Two',
        evolutionStage: 'genesis',
        positions: {
          flow: { x: 50 },
          strategic: { x: 60 },
          distillation: { x: 70, y: 80 },
          shared: { y: 90 },
        },
      };

      store.addContext(newContext);

      const result = store.getProject();
      expect(result.contexts).toHaveLength(2);
      expect(result.contexts[1].id).toBe('ctx-2');
    });

    it('should trigger onProjectChange callback', () => {
      const newContext: BoundedContext = {
        id: 'ctx-2',
        name: 'Context Two',
        evolutionStage: 'genesis',
        positions: {
          flow: { x: 50 },
          strategic: { x: 60 },
          distillation: { x: 70, y: 80 },
          shared: { y: 90 },
        },
      };

      store.addContext(newContext);

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts).toHaveLength(2);
    });
  });

  describe('updateContext', () => {
    beforeEach(() => {
      store = useCollabStore(project, { onProjectChange });
    });

    it('should update an existing context via Yjs mutation', () => {
      store.updateContext('ctx-1', { name: 'Updated Name' });

      const result = store.getProject();
      expect(result.contexts[0].name).toBe('Updated Name');
    });

    it('should trigger onProjectChange callback', () => {
      store.updateContext('ctx-1', { name: 'Updated Name' });

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts[0].name).toBe('Updated Name');
    });
  });

  describe('deleteContext', () => {
    beforeEach(() => {
      store = useCollabStore(project, { onProjectChange });
    });

    it('should delete a context via Yjs mutation', () => {
      store.deleteContext('ctx-1');

      const result = store.getProject();
      expect(result.contexts).toHaveLength(0);
    });

    it('should trigger onProjectChange callback', () => {
      store.deleteContext('ctx-1');

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts).toHaveLength(0);
    });
  });

  describe('updateContextPosition', () => {
    beforeEach(() => {
      store = useCollabStore(project, { onProjectChange });
    });

    it('should update context position via Yjs mutation', () => {
      store.updateContextPosition('ctx-1', {
        flow: { x: 500 },
        strategic: { x: 200 },
        distillation: { x: 300, y: 300 },
        shared: { y: 100 },
      });

      const result = store.getProject();
      expect(result.contexts[0].positions.flow.x).toBe(500);
    });

    it('should trigger onProjectChange callback', () => {
      store.updateContextPosition('ctx-1', {
        flow: { x: 500 },
        strategic: { x: 200 },
        distillation: { x: 300, y: 300 },
        shared: { y: 100 },
      });

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts[0].positions.flow.x).toBe(500);
    });
  });

  describe('undo/redo', () => {
    beforeEach(() => {
      store = useCollabStore(project, { onProjectChange });
    });

    it('should report canUndo as false initially', () => {
      expect(store.canUndo()).toBe(false);
    });

    it('should report canRedo as false initially', () => {
      expect(store.canRedo()).toBe(false);
    });

    it('should report canUndo as true after a mutation', () => {
      store.updateContext('ctx-1', { name: 'Updated Name' });

      expect(store.canUndo()).toBe(true);
    });

    it('should undo an add operation', () => {
      const newContext: BoundedContext = {
        id: 'ctx-2',
        name: 'Context Two',
        evolutionStage: 'genesis',
        positions: {
          flow: { x: 50 },
          strategic: { x: 60 },
          distillation: { x: 70, y: 80 },
          shared: { y: 90 },
        },
      };

      store.addContext(newContext);
      expect(store.getProject().contexts).toHaveLength(2);

      store.undo();
      expect(store.getProject().contexts).toHaveLength(1);
      expect(store.getProject().contexts[0].id).toBe('ctx-1');
    });

    it('should undo an update operation', () => {
      store.updateContext('ctx-1', { name: 'Updated Name' });
      expect(store.getProject().contexts[0].name).toBe('Updated Name');

      store.undo();
      expect(store.getProject().contexts[0].name).toBe('Context One');
    });

    it('should undo a delete operation', () => {
      store.deleteContext('ctx-1');
      expect(store.getProject().contexts).toHaveLength(0);

      store.undo();
      expect(store.getProject().contexts).toHaveLength(1);
      expect(store.getProject().contexts[0].id).toBe('ctx-1');
    });

    it('should undo a position update', () => {
      store.updateContextPosition('ctx-1', {
        flow: { x: 500 },
        strategic: { x: 200 },
        distillation: { x: 300, y: 300 },
        shared: { y: 100 },
      });
      expect(store.getProject().contexts[0].positions.flow.x).toBe(500);

      store.undo();
      expect(store.getProject().contexts[0].positions.flow.x).toBe(100);
    });

    it('should report canRedo as true after undo', () => {
      store.updateContext('ctx-1', { name: 'Updated Name' });
      store.undo();

      expect(store.canRedo()).toBe(true);
    });

    it('should redo an undone operation', () => {
      store.updateContext('ctx-1', { name: 'Updated Name' });
      store.undo();
      expect(store.getProject().contexts[0].name).toBe('Context One');

      store.redo();
      expect(store.getProject().contexts[0].name).toBe('Updated Name');
    });

    it('should trigger onProjectChange callback on undo', () => {
      store.updateContext('ctx-1', { name: 'Updated Name' });
      onProjectChange.mockClear();

      store.undo();

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts[0].name).toBe('Context One');
    });

    it('should trigger onProjectChange callback on redo', () => {
      store.updateContext('ctx-1', { name: 'Updated Name' });
      store.undo();
      onProjectChange.mockClear();

      store.redo();

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts[0].name).toBe('Updated Name');
    });
  });

  describe('destroy', () => {
    it('should stop observing changes after destroy', () => {
      store = useCollabStore(project, { onProjectChange });
      store.destroy();

      // Direct Y.Doc mutation should NOT trigger callback
      const ydoc = store.getYDoc();
      const yProject = ydoc.getMap('project');
      const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;
      const yContext = yContexts.get(0);
      yContext.set('name', 'Direct Change');

      expect(onProjectChange).not.toHaveBeenCalled();
    });

    it('should allow calling destroy multiple times safely', () => {
      store = useCollabStore(project, { onProjectChange });
      store.destroy();
      store.destroy();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to a new project', () => {
      store = useCollabStore(project, { onProjectChange });

      const newProject = createTestProject();
      newProject.id = 'new-project';
      newProject.name = 'New Project';
      newProject.contexts = [];

      store.reset(newProject);

      expect(store.getProject().id).toBe('new-project');
      expect(store.getProject().name).toBe('New Project');
      expect(store.getProject().contexts).toHaveLength(0);
    });

    it('should clear undo/redo history on reset', () => {
      store = useCollabStore(project, { onProjectChange });
      store.updateContext('ctx-1', { name: 'Updated Name' });
      expect(store.canUndo()).toBe(true);

      const newProject = createTestProject();
      newProject.id = 'new-project';
      store.reset(newProject);

      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);
    });
  });
});
