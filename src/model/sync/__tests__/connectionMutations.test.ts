import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addUserNeedConnectionMutation,
  updateUserNeedConnectionMutation,
  deleteUserNeedConnectionMutation,
  addNeedContextConnectionMutation,
  updateNeedContextConnectionMutation,
  deleteNeedContextConnectionMutation,
} from '../connectionMutations';
import type { Project, UserNeedConnection, NeedContextConnection } from '../../types';

function createTestProject(): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [
      {
        id: 'context-1',
        name: 'Order Context',
        evolutionStage: 'custom-built',
        positions: {
          flow: { x: 100 },
          strategic: { x: 50 },
          distillation: { x: 150, y: 150 },
          shared: { y: 100 },
        },
      },
      {
        id: 'context-2',
        name: 'Payment Context',
        evolutionStage: 'product/rental',
        positions: {
          flow: { x: 200 },
          strategic: { x: 60 },
          distillation: { x: 250, y: 250 },
          shared: { y: 200 },
        },
      },
    ],
    relationships: [],
    groups: [],
    repos: [],
    people: [],
    teams: [],
    users: [
      { id: 'user-1', name: 'Customer', position: 20 },
      { id: 'user-2', name: 'Admin', position: 40 },
    ],
    userNeeds: [
      { id: 'need-1', name: 'Fast checkout', position: 30 },
      { id: 'need-2', name: 'Track orders', position: 50 },
    ],
    userNeedConnections: [
      { id: 'unc-1', userId: 'user-1', userNeedId: 'need-1' },
      { id: 'unc-2', userId: 'user-1', userNeedId: 'need-2', notes: 'Primary need' },
    ],
    needContextConnections: [
      { id: 'ncc-1', userNeedId: 'need-1', contextId: 'context-1' },
      { id: 'ncc-2', userNeedId: 'need-2', contextId: 'context-2', notes: 'Fulfilled by' },
    ],
    viewConfig: {
      flowStages: [],
    },
    temporal: {
      enabled: false,
      keyframes: [],
    },
  };
}

describe('connectionMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('addUserNeedConnectionMutation', () => {
    it('should add a new user-need connection to the Y.Doc', () => {
      const newConnection: UserNeedConnection = {
        id: 'unc-new',
        userId: 'user-2',
        userNeedId: 'need-1',
      };

      addUserNeedConnectionMutation(ydoc, newConnection);

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections).toHaveLength(3);
      expect(result.userNeedConnections[2].id).toBe('unc-new');
      expect(result.userNeedConnections[2].userId).toBe('user-2');
      expect(result.userNeedConnections[2].userNeedId).toBe('need-1');
    });

    it('should add a connection with notes', () => {
      const newConnection: UserNeedConnection = {
        id: 'unc-new',
        userId: 'user-2',
        userNeedId: 'need-2',
        notes: 'Secondary connection',
      };

      addUserNeedConnectionMutation(ydoc, newConnection);

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections).toHaveLength(3);
      expect(result.userNeedConnections[2].notes).toBe('Secondary connection');
    });

    it('should add connection to empty connections array', () => {
      const emptyProject: Project = {
        ...createTestProject(),
        userNeedConnections: [],
      };
      const emptyYdoc = projectToYDoc(emptyProject);

      addUserNeedConnectionMutation(emptyYdoc, {
        id: 'first',
        userId: 'user-1',
        userNeedId: 'need-1',
      });

      const result = yDocToProject(emptyYdoc);
      expect(result.userNeedConnections).toHaveLength(1);
      expect(result.userNeedConnections[0].id).toBe('first');
    });
  });

  describe('updateUserNeedConnectionMutation', () => {
    it('should update the notes of an existing connection', () => {
      updateUserNeedConnectionMutation(ydoc, 'unc-1', { notes: 'Updated notes' });

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections[0].notes).toBe('Updated notes');
    });

    it('should not modify other connections', () => {
      updateUserNeedConnectionMutation(ydoc, 'unc-1', { notes: 'Updated first' });

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections[0].notes).toBe('Updated first');
      expect(result.userNeedConnections[1].notes).toBe('Primary need');
    });

    it('should do nothing for non-existent connection id', () => {
      updateUserNeedConnectionMutation(ydoc, 'non-existent', { notes: 'New notes' });

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections).toHaveLength(2);
      expect(result.userNeedConnections[0].notes).toBeUndefined();
    });

    it('should clear notes when set to undefined', () => {
      updateUserNeedConnectionMutation(ydoc, 'unc-2', { notes: undefined });

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections[1].notes).toBeUndefined();
    });
  });

  describe('deleteUserNeedConnectionMutation', () => {
    it('should delete a connection by id', () => {
      deleteUserNeedConnectionMutation(ydoc, 'unc-1');

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections).toHaveLength(1);
      expect(result.userNeedConnections[0].id).toBe('unc-2');
    });

    it('should delete the last connection', () => {
      deleteUserNeedConnectionMutation(ydoc, 'unc-2');

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections).toHaveLength(1);
      expect(result.userNeedConnections[0].id).toBe('unc-1');
    });

    it('should do nothing for non-existent connection id', () => {
      deleteUserNeedConnectionMutation(ydoc, 'non-existent');

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections).toHaveLength(2);
    });

    it('should handle deleting all connections', () => {
      deleteUserNeedConnectionMutation(ydoc, 'unc-1');
      deleteUserNeedConnectionMutation(ydoc, 'unc-2');

      const result = yDocToProject(ydoc);
      expect(result.userNeedConnections).toHaveLength(0);
    });
  });

  describe('addNeedContextConnectionMutation', () => {
    it('should add a new need-context connection to the Y.Doc', () => {
      const newConnection: NeedContextConnection = {
        id: 'ncc-new',
        userNeedId: 'need-1',
        contextId: 'context-2',
      };

      addNeedContextConnectionMutation(ydoc, newConnection);

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections).toHaveLength(3);
      expect(result.needContextConnections[2].id).toBe('ncc-new');
      expect(result.needContextConnections[2].userNeedId).toBe('need-1');
      expect(result.needContextConnections[2].contextId).toBe('context-2');
    });

    it('should add a connection with notes', () => {
      const newConnection: NeedContextConnection = {
        id: 'ncc-new',
        userNeedId: 'need-2',
        contextId: 'context-1',
        notes: 'Also fulfilled by',
      };

      addNeedContextConnectionMutation(ydoc, newConnection);

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections).toHaveLength(3);
      expect(result.needContextConnections[2].notes).toBe('Also fulfilled by');
    });

    it('should add connection to empty connections array', () => {
      const emptyProject: Project = {
        ...createTestProject(),
        needContextConnections: [],
      };
      const emptyYdoc = projectToYDoc(emptyProject);

      addNeedContextConnectionMutation(emptyYdoc, {
        id: 'first',
        userNeedId: 'need-1',
        contextId: 'context-1',
      });

      const result = yDocToProject(emptyYdoc);
      expect(result.needContextConnections).toHaveLength(1);
      expect(result.needContextConnections[0].id).toBe('first');
    });
  });

  describe('updateNeedContextConnectionMutation', () => {
    it('should update the notes of an existing connection', () => {
      updateNeedContextConnectionMutation(ydoc, 'ncc-1', { notes: 'Updated notes' });

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections[0].notes).toBe('Updated notes');
    });

    it('should not modify other connections', () => {
      updateNeedContextConnectionMutation(ydoc, 'ncc-1', { notes: 'Updated first' });

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections[0].notes).toBe('Updated first');
      expect(result.needContextConnections[1].notes).toBe('Fulfilled by');
    });

    it('should do nothing for non-existent connection id', () => {
      updateNeedContextConnectionMutation(ydoc, 'non-existent', { notes: 'New notes' });

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections).toHaveLength(2);
      expect(result.needContextConnections[0].notes).toBeUndefined();
    });

    it('should clear notes when set to undefined', () => {
      updateNeedContextConnectionMutation(ydoc, 'ncc-2', { notes: undefined });

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections[1].notes).toBeUndefined();
    });
  });

  describe('deleteNeedContextConnectionMutation', () => {
    it('should delete a connection by id', () => {
      deleteNeedContextConnectionMutation(ydoc, 'ncc-1');

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections).toHaveLength(1);
      expect(result.needContextConnections[0].id).toBe('ncc-2');
    });

    it('should delete the last connection', () => {
      deleteNeedContextConnectionMutation(ydoc, 'ncc-2');

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections).toHaveLength(1);
      expect(result.needContextConnections[0].id).toBe('ncc-1');
    });

    it('should do nothing for non-existent connection id', () => {
      deleteNeedContextConnectionMutation(ydoc, 'non-existent');

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections).toHaveLength(2);
    });

    it('should handle deleting all connections', () => {
      deleteNeedContextConnectionMutation(ydoc, 'ncc-1');
      deleteNeedContextConnectionMutation(ydoc, 'ncc-2');

      const result = yDocToProject(ydoc);
      expect(result.needContextConnections).toHaveLength(0);
    });
  });

  describe('undo integration', () => {
    it('should undo user-need connection addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addUserNeedConnectionMutation(ydoc, {
        id: 'new-unc',
        userId: 'user-2',
        userNeedId: 'need-1',
      });

      expect(yDocToProject(ydoc).userNeedConnections).toHaveLength(3);

      undoManager.undo();

      expect(yDocToProject(ydoc).userNeedConnections).toHaveLength(2);
    });

    it('should undo user-need connection update', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateUserNeedConnectionMutation(ydoc, 'unc-1', { notes: 'Changed notes' });

      expect(yDocToProject(ydoc).userNeedConnections[0].notes).toBe('Changed notes');

      undoManager.undo();

      expect(yDocToProject(ydoc).userNeedConnections[0].notes).toBeUndefined();
    });

    it('should undo user-need connection deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteUserNeedConnectionMutation(ydoc, 'unc-1');

      expect(yDocToProject(ydoc).userNeedConnections).toHaveLength(1);

      undoManager.undo();

      expect(yDocToProject(ydoc).userNeedConnections).toHaveLength(2);
      expect(yDocToProject(ydoc).userNeedConnections[0].id).toBe('unc-1');
    });

    it('should undo need-context connection addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addNeedContextConnectionMutation(ydoc, {
        id: 'new-ncc',
        userNeedId: 'need-1',
        contextId: 'context-2',
      });

      expect(yDocToProject(ydoc).needContextConnections).toHaveLength(3);

      undoManager.undo();

      expect(yDocToProject(ydoc).needContextConnections).toHaveLength(2);
    });

    it('should undo need-context connection update', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateNeedContextConnectionMutation(ydoc, 'ncc-1', { notes: 'Changed notes' });

      expect(yDocToProject(ydoc).needContextConnections[0].notes).toBe('Changed notes');

      undoManager.undo();

      expect(yDocToProject(ydoc).needContextConnections[0].notes).toBeUndefined();
    });

    it('should undo need-context connection deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteNeedContextConnectionMutation(ydoc, 'ncc-1');

      expect(yDocToProject(ydoc).needContextConnections).toHaveLength(1);

      undoManager.undo();

      expect(yDocToProject(ydoc).needContextConnections).toHaveLength(2);
      expect(yDocToProject(ydoc).needContextConnections[0].id).toBe('ncc-1');
    });

    it('should redo user-need connection addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addUserNeedConnectionMutation(ydoc, {
        id: 'new-unc',
        userId: 'user-2',
        userNeedId: 'need-1',
      });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).userNeedConnections).toHaveLength(3);
      expect(yDocToProject(ydoc).userNeedConnections[2].id).toBe('new-unc');
    });

    it('should redo need-context connection deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteNeedContextConnectionMutation(ydoc, 'ncc-1');
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).needContextConnections).toHaveLength(1);
    });
  });
});
