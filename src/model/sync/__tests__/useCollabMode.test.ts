import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import * as Y from 'yjs';

import {
  initializeCollabMode,
  destroyCollabMode,
  getCollabStore,
  isCollabModeActive,
  getCollabMutations,
  getCollabUndoRedo,
} from '../useCollabMode';
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

describe('useCollabMode', () => {
  let project: Project;

  beforeEach(() => {
    project = createTestProject();
    destroyCollabMode(); // Ensure clean state
  });

  afterEach(() => {
    destroyCollabMode();
  });

  describe('when collab mode is disabled', () => {
    it('should return isCollabModeActive as false', () => {
      expect(isCollabModeActive()).toBe(false);
    });

    it('should return null for getCollabStore', () => {
      expect(getCollabStore()).toBe(null);
    });

    it('should return no-op mutations when not initialized', () => {
      const mutations = getCollabMutations();

      // These should not throw
      expect(() => {
        mutations.addContext({
          id: 'test',
          name: 'Test',
          evolutionStage: 'genesis',
          positions: {
            flow: { x: 0 },
            strategic: { x: 0 },
            distillation: { x: 0, y: 0 },
            shared: { y: 0 },
          },
        });
      }).not.toThrow();

      expect(() => mutations.updateContext('ctx-1', { name: 'Updated' })).not.toThrow();
      expect(() => mutations.deleteContext('ctx-1')).not.toThrow();
      expect(() => {
        mutations.updateContextPosition('ctx-1', {
          flow: { x: 0 },
          strategic: { x: 0 },
          distillation: { x: 0, y: 0 },
          shared: { y: 0 },
        });
      }).not.toThrow();
    });

    it('should return null undo/redo state when not initialized', () => {
      const undoRedo = getCollabUndoRedo();
      expect(undoRedo.canUndo).toBe(null);
      expect(undoRedo.canRedo).toBe(null);
    });
  });

  describe('when collab mode is enabled', () => {
    let onProjectChange: Mock<(project: Project) => void>;

    beforeEach(() => {
      onProjectChange = vi.fn();
      initializeCollabMode(project, { onProjectChange });
    });

    it('should return isCollabModeActive as true', () => {
      expect(isCollabModeActive()).toBe(true);
    });

    it('should return the store for getCollabStore', () => {
      expect(getCollabStore()).not.toBe(null);
    });

    it('should return canUndo as false initially', () => {
      const undoRedo = getCollabUndoRedo();
      expect(undoRedo.canUndo).toBe(false);
    });

    it('should return canRedo as false initially', () => {
      const undoRedo = getCollabUndoRedo();
      expect(undoRedo.canRedo).toBe(false);
    });

    it('should add a context and trigger callback', () => {
      const mutations = getCollabMutations();

      mutations.addContext({
        id: 'ctx-2',
        name: 'Context Two',
        evolutionStage: 'genesis',
        positions: {
          flow: { x: 50 },
          strategic: { x: 60 },
          distillation: { x: 70, y: 80 },
          shared: { y: 90 },
        },
      });

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts).toHaveLength(2);
    });

    it('should update a context', () => {
      const mutations = getCollabMutations();

      mutations.updateContext('ctx-1', { name: 'Updated Name' });

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts[0].name).toBe('Updated Name');
    });

    it('should delete a context', () => {
      const mutations = getCollabMutations();

      mutations.deleteContext('ctx-1');

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts).toHaveLength(0);
    });

    it('should update context position', () => {
      const mutations = getCollabMutations();

      mutations.updateContextPosition('ctx-1', {
        flow: { x: 500 },
        strategic: { x: 200 },
        distillation: { x: 300, y: 300 },
        shared: { y: 100 },
      });

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      const updatedProject = onProjectChange.mock.calls[0][0];
      expect(updatedProject.contexts[0].positions.flow.x).toBe(500);
    });

    it('should report canUndo as true after mutation', () => {
      const mutations = getCollabMutations();

      mutations.updateContext('ctx-1', { name: 'Updated Name' });

      const undoRedo = getCollabUndoRedo();
      expect(undoRedo.canUndo).toBe(true);
    });

    it('should undo a mutation', () => {
      const mutations = getCollabMutations();
      const undoRedo = getCollabUndoRedo();

      mutations.updateContext('ctx-1', { name: 'Updated Name' });

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      expect(onProjectChange.mock.calls[0][0].contexts[0].name).toBe('Updated Name');

      onProjectChange.mockClear();

      undoRedo.undo();

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      expect(onProjectChange.mock.calls[0][0].contexts[0].name).toBe('Context One');
    });

    it('should redo an undone mutation', () => {
      const mutations = getCollabMutations();
      const undoRedo = getCollabUndoRedo();

      mutations.updateContext('ctx-1', { name: 'Updated Name' });
      undoRedo.undo();

      onProjectChange.mockClear();

      undoRedo.redo();

      expect(onProjectChange).toHaveBeenCalledTimes(1);
      expect(onProjectChange.mock.calls[0][0].contexts[0].name).toBe('Updated Name');
    });

    it('should report canRedo as true after undo', () => {
      const mutations = getCollabMutations();
      const undoRedo = getCollabUndoRedo();

      mutations.updateContext('ctx-1', { name: 'Updated Name' });
      undoRedo.undo();

      expect(undoRedo.canRedo).toBe(true);
    });
  });

  describe('project switching', () => {
    let onProjectChange: Mock<(project: Project) => void>;

    beforeEach(() => {
      onProjectChange = vi.fn();
      initializeCollabMode(project, { onProjectChange });
    });

    it('should reset to a new project', () => {
      const mutations = getCollabMutations();
      mutations.updateContext('ctx-1', { name: 'Updated Name' });

      const newProject = createTestProject();
      newProject.id = 'new-project';
      newProject.name = 'New Project';
      newProject.contexts = [];

      destroyCollabMode();
      initializeCollabMode(newProject, { onProjectChange });

      const store = getCollabStore();
      expect(store).not.toBe(null);
      expect(store!.getProject().id).toBe('new-project');
      expect(store!.getProject().contexts).toHaveLength(0);

      const undoRedo = getCollabUndoRedo();
      expect(undoRedo.canUndo).toBe(false);
    });
  });

  describe('multiple initializations', () => {
    it('should handle re-initialization correctly', () => {
      const onProjectChange1: Mock<(project: Project) => void> = vi.fn();
      initializeCollabMode(project, { onProjectChange: onProjectChange1 });

      const mutations = getCollabMutations();
      mutations.updateContext('ctx-1', { name: 'First Update' });
      expect(onProjectChange1).toHaveBeenCalledTimes(1);

      // Re-initialize with new callback
      const onProjectChange2: Mock<(project: Project) => void> = vi.fn();
      const newProject = createTestProject();
      newProject.name = 'New Project';

      destroyCollabMode();
      initializeCollabMode(newProject, { onProjectChange: onProjectChange2 });

      const newMutations = getCollabMutations();
      newMutations.updateContext('ctx-1', { name: 'Second Update' });

      expect(onProjectChange2).toHaveBeenCalledTimes(1);
      expect(onProjectChange2.mock.calls[0][0].contexts[0].name).toBe('Second Update');
    });
  });
});
