import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addUserNeedMutation,
  updateUserNeedMutation,
  deleteUserNeedMutation,
  updateUserNeedPositionMutation,
} from '../userNeedMutations';
import type { Project, UserNeed } from '../../types';

function createTestProject(): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [],
    relationships: [],
    groups: [],
    repos: [],
    people: [],
    teams: [],
    users: [],
    userNeeds: [
      { id: 'need-1', name: 'Fast checkout', position: 20 },
      { id: 'need-2', name: 'Track orders', position: 40, description: 'Real-time tracking' },
      { id: 'need-3', name: 'Hidden need', position: 60, visibility: false },
    ],
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

describe('userNeedMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('addUserNeedMutation', () => {
    it('should add a new user need to the Y.Doc', () => {
      const newNeed: UserNeed = {
        id: 'need-new',
        name: 'New Need',
        position: 80,
      };

      addUserNeedMutation(ydoc, newNeed);

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(4);
      expect(result.userNeeds[3].id).toBe('need-new');
      expect(result.userNeeds[3].name).toBe('New Need');
      expect(result.userNeeds[3].position).toBe(80);
    });

    it('should add a user need with optional fields', () => {
      const newNeed: UserNeed = {
        id: 'need-new',
        name: 'Complex Need',
        position: 90,
        description: 'A detailed description',
        visibility: false,
      };

      addUserNeedMutation(ydoc, newNeed);

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(4);
      const addedNeed = result.userNeeds[3];
      expect(addedNeed.description).toBe('A detailed description');
      expect(addedNeed.visibility).toBe(false);
    });

    it('should add user need to empty userNeeds array', () => {
      const emptyProject: Project = {
        ...createTestProject(),
        userNeeds: [],
      };
      const emptyYdoc = projectToYDoc(emptyProject);

      addUserNeedMutation(emptyYdoc, { id: 'first', name: 'First Need', position: 50 });

      const result = yDocToProject(emptyYdoc);
      expect(result.userNeeds).toHaveLength(1);
      expect(result.userNeeds[0].name).toBe('First Need');
    });
  });

  describe('updateUserNeedMutation', () => {
    it('should update the name of an existing user need', () => {
      updateUserNeedMutation(ydoc, 'need-1', { name: 'Updated checkout' });

      const result = yDocToProject(ydoc);
      expect(result.userNeeds[0].name).toBe('Updated checkout');
      expect(result.userNeeds[0].position).toBe(20);
    });

    it('should update the position of an existing user need', () => {
      updateUserNeedMutation(ydoc, 'need-1', { position: 35 });

      const result = yDocToProject(ydoc);
      expect(result.userNeeds[0].position).toBe(35);
      expect(result.userNeeds[0].name).toBe('Fast checkout');
    });

    it('should update the description', () => {
      updateUserNeedMutation(ydoc, 'need-1', { description: 'One-click purchase' });

      const result = yDocToProject(ydoc);
      expect(result.userNeeds[0].description).toBe('One-click purchase');
    });

    it('should update visibility flag', () => {
      updateUserNeedMutation(ydoc, 'need-1', { visibility: false });

      const result = yDocToProject(ydoc);
      expect(result.userNeeds[0].visibility).toBe(false);
    });

    it('should update multiple fields at once', () => {
      updateUserNeedMutation(ydoc, 'need-1', {
        name: 'New Name',
        position: 45,
        description: 'New description',
        visibility: false,
      });

      const result = yDocToProject(ydoc);
      const need = result.userNeeds[0];
      expect(need.name).toBe('New Name');
      expect(need.position).toBe(45);
      expect(need.description).toBe('New description');
      expect(need.visibility).toBe(false);
    });

    it('should not modify other user needs', () => {
      updateUserNeedMutation(ydoc, 'need-1', { name: 'Updated First' });

      const result = yDocToProject(ydoc);
      expect(result.userNeeds[0].name).toBe('Updated First');
      expect(result.userNeeds[1].name).toBe('Track orders');
      expect(result.userNeeds[2].name).toBe('Hidden need');
    });

    it('should do nothing for non-existent user need id', () => {
      updateUserNeedMutation(ydoc, 'non-existent', { name: 'New Name' });

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(3);
      expect(result.userNeeds[0].name).toBe('Fast checkout');
    });

    it('should clear optional fields when set to undefined', () => {
      updateUserNeedMutation(ydoc, 'need-2', {
        description: undefined,
      });

      const result = yDocToProject(ydoc);
      expect(result.userNeeds[1].description).toBeUndefined();
    });
  });

  describe('deleteUserNeedMutation', () => {
    it('should delete a user need by id', () => {
      deleteUserNeedMutation(ydoc, 'need-2');

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(2);
      expect(result.userNeeds[0].id).toBe('need-1');
      expect(result.userNeeds[1].id).toBe('need-3');
    });

    it('should delete the first user need', () => {
      deleteUserNeedMutation(ydoc, 'need-1');

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(2);
      expect(result.userNeeds[0].id).toBe('need-2');
    });

    it('should delete the last user need', () => {
      deleteUserNeedMutation(ydoc, 'need-3');

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(2);
      expect(result.userNeeds[1].id).toBe('need-2');
    });

    it('should do nothing for non-existent user need id', () => {
      deleteUserNeedMutation(ydoc, 'non-existent');

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(3);
    });

    it('should handle deleting all user needs', () => {
      deleteUserNeedMutation(ydoc, 'need-1');
      deleteUserNeedMutation(ydoc, 'need-2');
      deleteUserNeedMutation(ydoc, 'need-3');

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(0);
    });
  });

  describe('updateUserNeedPositionMutation', () => {
    it('should update user need position', () => {
      updateUserNeedPositionMutation(ydoc, 'need-1', 75);

      const result = yDocToProject(ydoc);
      expect(result.userNeeds[0].position).toBe(75);
    });

    it('should not modify other fields', () => {
      updateUserNeedPositionMutation(ydoc, 'need-2', 55);

      const result = yDocToProject(ydoc);
      expect(result.userNeeds[1].position).toBe(55);
      expect(result.userNeeds[1].name).toBe('Track orders');
      expect(result.userNeeds[1].description).toBe('Real-time tracking');
    });

    it('should do nothing for non-existent user need id', () => {
      updateUserNeedPositionMutation(ydoc, 'non-existent', 99);

      const result = yDocToProject(ydoc);
      expect(result.userNeeds).toHaveLength(3);
      expect(result.userNeeds[0].position).toBe(20);
    });
  });

  describe('undo integration', () => {
    it('should be undoable when combined with CollabUndoManager', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addUserNeedMutation(ydoc, { id: 'new-need', name: 'New Need', position: 50 });

      expect(yDocToProject(ydoc).userNeeds).toHaveLength(4);

      undoManager.undo();

      expect(yDocToProject(ydoc).userNeeds).toHaveLength(3);
    });

    it('should undo user need updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateUserNeedMutation(ydoc, 'need-1', { name: 'Changed Name' });

      expect(yDocToProject(ydoc).userNeeds[0].name).toBe('Changed Name');

      undoManager.undo();

      expect(yDocToProject(ydoc).userNeeds[0].name).toBe('Fast checkout');
    });

    it('should undo user need deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteUserNeedMutation(ydoc, 'need-2');

      expect(yDocToProject(ydoc).userNeeds).toHaveLength(2);

      undoManager.undo();

      expect(yDocToProject(ydoc).userNeeds).toHaveLength(3);
      expect(yDocToProject(ydoc).userNeeds[1].name).toBe('Track orders');
    });

    it('should undo position updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateUserNeedPositionMutation(ydoc, 'need-1', 99);

      expect(yDocToProject(ydoc).userNeeds[0].position).toBe(99);

      undoManager.undo();

      expect(yDocToProject(ydoc).userNeeds[0].position).toBe(20);
    });

    it('should redo user need addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addUserNeedMutation(ydoc, { id: 'new-need', name: 'New Need', position: 50 });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).userNeeds).toHaveLength(4);
      expect(yDocToProject(ydoc).userNeeds[3].name).toBe('New Need');
    });

    it('should redo user need updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateUserNeedMutation(ydoc, 'need-1', { name: 'Changed Name' });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).userNeeds[0].name).toBe('Changed Name');
    });

    it('should redo user need deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteUserNeedMutation(ydoc, 'need-2');
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).userNeeds).toHaveLength(2);
    });
  });
});
