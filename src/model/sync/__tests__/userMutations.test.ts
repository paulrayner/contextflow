import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addUserMutation,
  updateUserMutation,
  deleteUserMutation,
  updateUserPositionMutation,
} from '../userMutations';
import type { Project, User } from '../../types';

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
    users: [
      { id: 'user-1', name: 'End User', position: 20 },
      { id: 'user-2', name: 'Admin', position: 40, description: 'System administrator' },
      { id: 'user-3', name: 'External Partner', position: 60, isExternal: true },
    ],
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

describe('userMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('addUserMutation', () => {
    it('should add a new user to the Y.Doc', () => {
      const newUser: User = {
        id: 'user-new',
        name: 'New User',
        position: 80,
      };

      addUserMutation(ydoc, newUser);

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(4);
      expect(result.users[3].id).toBe('user-new');
      expect(result.users[3].name).toBe('New User');
      expect(result.users[3].position).toBe(80);
    });

    it('should add a user with optional fields', () => {
      const newUser: User = {
        id: 'user-new',
        name: 'External User',
        position: 90,
        description: 'A partner from outside',
        isExternal: true,
      };

      addUserMutation(ydoc, newUser);

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(4);
      const addedUser = result.users[3];
      expect(addedUser.description).toBe('A partner from outside');
      expect(addedUser.isExternal).toBe(true);
    });

    it('should add user to empty users array', () => {
      const emptyProject: Project = {
        ...createTestProject(),
        users: [],
      };
      const emptyYdoc = projectToYDoc(emptyProject);

      addUserMutation(emptyYdoc, { id: 'first', name: 'First User', position: 50 });

      const result = yDocToProject(emptyYdoc);
      expect(result.users).toHaveLength(1);
      expect(result.users[0].name).toBe('First User');
    });
  });

  describe('updateUserMutation', () => {
    it('should update the name of an existing user', () => {
      updateUserMutation(ydoc, 'user-1', { name: 'Updated End User' });

      const result = yDocToProject(ydoc);
      expect(result.users[0].name).toBe('Updated End User');
      expect(result.users[0].position).toBe(20);
    });

    it('should update the position of an existing user', () => {
      updateUserMutation(ydoc, 'user-1', { position: 35 });

      const result = yDocToProject(ydoc);
      expect(result.users[0].position).toBe(35);
      expect(result.users[0].name).toBe('End User');
    });

    it('should update the description', () => {
      updateUserMutation(ydoc, 'user-1', { description: 'Primary end user persona' });

      const result = yDocToProject(ydoc);
      expect(result.users[0].description).toBe('Primary end user persona');
    });

    it('should update isExternal flag', () => {
      updateUserMutation(ydoc, 'user-1', { isExternal: true });

      const result = yDocToProject(ydoc);
      expect(result.users[0].isExternal).toBe(true);
    });

    it('should update multiple fields at once', () => {
      updateUserMutation(ydoc, 'user-1', {
        name: 'New Name',
        position: 45,
        description: 'New description',
        isExternal: true,
      });

      const result = yDocToProject(ydoc);
      const user = result.users[0];
      expect(user.name).toBe('New Name');
      expect(user.position).toBe(45);
      expect(user.description).toBe('New description');
      expect(user.isExternal).toBe(true);
    });

    it('should not modify other users', () => {
      updateUserMutation(ydoc, 'user-1', { name: 'Updated First' });

      const result = yDocToProject(ydoc);
      expect(result.users[0].name).toBe('Updated First');
      expect(result.users[1].name).toBe('Admin');
      expect(result.users[2].name).toBe('External Partner');
    });

    it('should do nothing for non-existent user id', () => {
      updateUserMutation(ydoc, 'non-existent', { name: 'New Name' });

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(3);
      expect(result.users[0].name).toBe('End User');
    });

    it('should clear optional fields when set to undefined', () => {
      updateUserMutation(ydoc, 'user-2', {
        description: undefined,
      });

      const result = yDocToProject(ydoc);
      expect(result.users[1].description).toBeUndefined();
    });
  });

  describe('deleteUserMutation', () => {
    it('should delete a user by id', () => {
      deleteUserMutation(ydoc, 'user-2');

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(2);
      expect(result.users[0].id).toBe('user-1');
      expect(result.users[1].id).toBe('user-3');
    });

    it('should delete the first user', () => {
      deleteUserMutation(ydoc, 'user-1');

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(2);
      expect(result.users[0].id).toBe('user-2');
    });

    it('should delete the last user', () => {
      deleteUserMutation(ydoc, 'user-3');

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(2);
      expect(result.users[1].id).toBe('user-2');
    });

    it('should do nothing for non-existent user id', () => {
      deleteUserMutation(ydoc, 'non-existent');

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(3);
    });

    it('should handle deleting all users', () => {
      deleteUserMutation(ydoc, 'user-1');
      deleteUserMutation(ydoc, 'user-2');
      deleteUserMutation(ydoc, 'user-3');

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(0);
    });
  });

  describe('updateUserPositionMutation', () => {
    it('should update user position', () => {
      updateUserPositionMutation(ydoc, 'user-1', 75);

      const result = yDocToProject(ydoc);
      expect(result.users[0].position).toBe(75);
    });

    it('should not modify other fields', () => {
      updateUserPositionMutation(ydoc, 'user-2', 55);

      const result = yDocToProject(ydoc);
      expect(result.users[1].position).toBe(55);
      expect(result.users[1].name).toBe('Admin');
      expect(result.users[1].description).toBe('System administrator');
    });

    it('should do nothing for non-existent user id', () => {
      updateUserPositionMutation(ydoc, 'non-existent', 99);

      const result = yDocToProject(ydoc);
      expect(result.users).toHaveLength(3);
      expect(result.users[0].position).toBe(20);
    });
  });

  describe('undo integration', () => {
    it('should be undoable when combined with CollabUndoManager', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addUserMutation(ydoc, { id: 'new-user', name: 'New User', position: 50 });

      expect(yDocToProject(ydoc).users).toHaveLength(4);

      undoManager.undo();

      expect(yDocToProject(ydoc).users).toHaveLength(3);
    });

    it('should undo user updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateUserMutation(ydoc, 'user-1', { name: 'Changed Name' });

      expect(yDocToProject(ydoc).users[0].name).toBe('Changed Name');

      undoManager.undo();

      expect(yDocToProject(ydoc).users[0].name).toBe('End User');
    });

    it('should undo user deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteUserMutation(ydoc, 'user-2');

      expect(yDocToProject(ydoc).users).toHaveLength(2);

      undoManager.undo();

      expect(yDocToProject(ydoc).users).toHaveLength(3);
      expect(yDocToProject(ydoc).users[1].name).toBe('Admin');
    });

    it('should undo position updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateUserPositionMutation(ydoc, 'user-1', 99);

      expect(yDocToProject(ydoc).users[0].position).toBe(99);

      undoManager.undo();

      expect(yDocToProject(ydoc).users[0].position).toBe(20);
    });

    it('should redo user addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addUserMutation(ydoc, { id: 'new-user', name: 'New User', position: 50 });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).users).toHaveLength(4);
      expect(yDocToProject(ydoc).users[3].name).toBe('New User');
    });

    it('should redo user updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateUserMutation(ydoc, 'user-1', { name: 'Changed Name' });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).users[0].name).toBe('Changed Name');
    });

    it('should redo user deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteUserMutation(ydoc, 'user-2');
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).users).toHaveLength(2);
    });
  });
});
