import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addGroupMutation,
  updateGroupMutation,
  deleteGroupMutation,
  addContextToGroupMutation,
  removeContextFromGroupMutation,
} from '../groupMutations';
import type { Project, Group } from '../../types';

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
      {
        id: 'ctx-2',
        name: 'Context Two',
        evolutionStage: 'genesis',
        positions: {
          flow: { x: 50 },
          strategic: { x: 60 },
          distillation: { x: 70, y: 80 },
          shared: { y: 90 },
        },
      },
      {
        id: 'ctx-3',
        name: 'Context Three',
        evolutionStage: 'product/rental',
        positions: {
          flow: { x: 150 },
          strategic: { x: 160 },
          distillation: { x: 170, y: 180 },
          shared: { y: 190 },
        },
      },
    ],
    relationships: [],
    groups: [
      {
        id: 'grp-1',
        label: 'Core Platform',
        contextIds: ['ctx-1'],
      },
    ],
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

describe('groupMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('addGroupMutation', () => {
    it('should add a new group to the Y.Doc', () => {
      const newGroup: Group = {
        id: 'grp-2',
        label: 'Data Platform',
        contextIds: ['ctx-2'],
      };

      addGroupMutation(ydoc, newGroup);

      const result = yDocToProject(ydoc);
      expect(result.groups).toHaveLength(2);
      expect(result.groups[1].id).toBe('grp-2');
      expect(result.groups[1].label).toBe('Data Platform');
      expect(result.groups[1].contextIds).toEqual(['ctx-2']);
    });

    it('should add a group with optional fields', () => {
      const newGroup: Group = {
        id: 'grp-3',
        label: 'Analytics Cluster',
        contextIds: ['ctx-2', 'ctx-3'],
        color: '#FF5733',
        notes: 'Handles all analytics processing',
      };

      addGroupMutation(ydoc, newGroup);

      const result = yDocToProject(ydoc);
      expect(result.groups).toHaveLength(2);
      const addedGroup = result.groups[1];
      expect(addedGroup.color).toBe('#FF5733');
      expect(addedGroup.notes).toBe('Handles all analytics processing');
    });

    it('should add a group with empty contextIds', () => {
      const newGroup: Group = {
        id: 'grp-empty',
        label: 'Empty Group',
        contextIds: [],
      };

      addGroupMutation(ydoc, newGroup);

      const result = yDocToProject(ydoc);
      expect(result.groups).toHaveLength(2);
      expect(result.groups[1].contextIds).toEqual([]);
    });

    it('should add a group with multiple contextIds', () => {
      const newGroup: Group = {
        id: 'grp-multi',
        label: 'Multi-Context Group',
        contextIds: ['ctx-1', 'ctx-2', 'ctx-3'],
      };

      addGroupMutation(ydoc, newGroup);

      const result = yDocToProject(ydoc);
      expect(result.groups[1].contextIds).toEqual(['ctx-1', 'ctx-2', 'ctx-3']);
    });
  });

  describe('updateGroupMutation', () => {
    it('should update the label of an existing group', () => {
      updateGroupMutation(ydoc, 'grp-1', { label: 'Updated Platform' });

      const result = yDocToProject(ydoc);
      expect(result.groups[0].label).toBe('Updated Platform');
    });

    it('should update the color', () => {
      updateGroupMutation(ydoc, 'grp-1', { color: '#00FF00' });

      const result = yDocToProject(ydoc);
      expect(result.groups[0].color).toBe('#00FF00');
    });

    it('should update notes', () => {
      updateGroupMutation(ydoc, 'grp-1', { notes: 'Updated notes' });

      const result = yDocToProject(ydoc);
      expect(result.groups[0].notes).toBe('Updated notes');
    });

    it('should update multiple fields at once', () => {
      updateGroupMutation(ydoc, 'grp-1', {
        label: 'New Label',
        color: '#0000FF',
        notes: 'New notes',
      });

      const result = yDocToProject(ydoc);
      const group = result.groups[0];
      expect(group.label).toBe('New Label');
      expect(group.color).toBe('#0000FF');
      expect(group.notes).toBe('New notes');
    });

    it('should not modify other groups', () => {
      // Add a second group first
      const secondGroup: Group = {
        id: 'grp-2',
        label: 'Second Group',
        contextIds: ['ctx-2'],
      };
      addGroupMutation(ydoc, secondGroup);

      // Update only the first group
      updateGroupMutation(ydoc, 'grp-1', { label: 'Updated First' });

      const result = yDocToProject(ydoc);
      expect(result.groups[0].label).toBe('Updated First');
      expect(result.groups[1].label).toBe('Second Group');
    });

    it('should do nothing for non-existent group', () => {
      updateGroupMutation(ydoc, 'non-existent', { label: 'New Label' });

      const result = yDocToProject(ydoc);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].label).toBe('Core Platform');
    });

    it('should clear optional fields when set to undefined', () => {
      // First set some optional fields
      updateGroupMutation(ydoc, 'grp-1', {
        color: '#FF0000',
        notes: 'Some notes',
      });

      // Then clear them
      updateGroupMutation(ydoc, 'grp-1', {
        color: undefined,
        notes: undefined,
      });

      const result = yDocToProject(ydoc);
      expect(result.groups[0].color).toBeUndefined();
      expect(result.groups[0].notes).toBeUndefined();
    });
  });

  describe('deleteGroupMutation', () => {
    it('should delete an existing group', () => {
      deleteGroupMutation(ydoc, 'grp-1');

      const result = yDocToProject(ydoc);
      expect(result.groups).toHaveLength(0);
    });

    it('should delete the correct group when multiple exist', () => {
      // Add a second group
      const secondGroup: Group = {
        id: 'grp-2',
        label: 'Second Group',
        contextIds: ['ctx-2'],
      };
      addGroupMutation(ydoc, secondGroup);

      // Delete the first one
      deleteGroupMutation(ydoc, 'grp-1');

      const result = yDocToProject(ydoc);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].id).toBe('grp-2');
      expect(result.groups[0].label).toBe('Second Group');
    });

    it('should do nothing for non-existent group', () => {
      deleteGroupMutation(ydoc, 'non-existent');

      const result = yDocToProject(ydoc);
      expect(result.groups).toHaveLength(1);
    });
  });

  describe('addContextToGroupMutation', () => {
    it('should add a context to an existing group', () => {
      addContextToGroupMutation(ydoc, 'grp-1', 'ctx-2');

      const result = yDocToProject(ydoc);
      expect(result.groups[0].contextIds).toEqual(['ctx-1', 'ctx-2']);
    });

    it('should add multiple contexts sequentially', () => {
      addContextToGroupMutation(ydoc, 'grp-1', 'ctx-2');
      addContextToGroupMutation(ydoc, 'grp-1', 'ctx-3');

      const result = yDocToProject(ydoc);
      expect(result.groups[0].contextIds).toEqual(['ctx-1', 'ctx-2', 'ctx-3']);
    });

    it('should do nothing for non-existent group', () => {
      addContextToGroupMutation(ydoc, 'non-existent', 'ctx-2');

      const result = yDocToProject(ydoc);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].contextIds).toEqual(['ctx-1']);
    });

    it('should prevent duplicate contextIds', () => {
      // ctx-1 is already in the group from test setup
      addContextToGroupMutation(ydoc, 'grp-1', 'ctx-1');

      const result = yDocToProject(ydoc);
      // Should still be just one ctx-1, not two
      expect(result.groups[0].contextIds).toEqual(['ctx-1']);
    });
  });

  describe('removeContextFromGroupMutation', () => {
    it('should remove a context from an existing group', () => {
      removeContextFromGroupMutation(ydoc, 'grp-1', 'ctx-1');

      const result = yDocToProject(ydoc);
      expect(result.groups[0].contextIds).toEqual([]);
    });

    it('should remove only the specified context', () => {
      // First add more contexts
      addContextToGroupMutation(ydoc, 'grp-1', 'ctx-2');
      addContextToGroupMutation(ydoc, 'grp-1', 'ctx-3');

      // Remove the middle one
      removeContextFromGroupMutation(ydoc, 'grp-1', 'ctx-2');

      const result = yDocToProject(ydoc);
      expect(result.groups[0].contextIds).toEqual(['ctx-1', 'ctx-3']);
    });

    it('should do nothing for non-existent group', () => {
      removeContextFromGroupMutation(ydoc, 'non-existent', 'ctx-1');

      const result = yDocToProject(ydoc);
      expect(result.groups[0].contextIds).toEqual(['ctx-1']);
    });

    it('should do nothing if contextId not in group', () => {
      removeContextFromGroupMutation(ydoc, 'grp-1', 'ctx-99');

      const result = yDocToProject(ydoc);
      expect(result.groups[0].contextIds).toEqual(['ctx-1']);
    });

    it('should not add duplicates (adding existing context is no-op)', () => {
      // Try to add duplicate (should be no-op)
      addContextToGroupMutation(ydoc, 'grp-1', 'ctx-1');

      const result = yDocToProject(ydoc);
      // Still only one ctx-1
      expect(result.groups[0].contextIds).toEqual(['ctx-1']);
    });
  });

  describe('undo integration', () => {
    it('should be undoable when combined with CollabUndoManager', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addGroupMutation(ydoc, {
        id: 'grp-new',
        label: 'New Group',
        contextIds: ['ctx-2'],
      });

      expect(yDocToProject(ydoc).groups).toHaveLength(2);

      undoManager.undo();

      expect(yDocToProject(ydoc).groups).toHaveLength(1);
      expect(yDocToProject(ydoc).groups[0].id).toBe('grp-1');
    });

    it('should undo group updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateGroupMutation(ydoc, 'grp-1', { label: 'Changed Label' });

      expect(yDocToProject(ydoc).groups[0].label).toBe('Changed Label');

      undoManager.undo();

      expect(yDocToProject(ydoc).groups[0].label).toBe('Core Platform');
    });

    it('should undo group deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteGroupMutation(ydoc, 'grp-1');

      expect(yDocToProject(ydoc).groups).toHaveLength(0);

      undoManager.undo();

      expect(yDocToProject(ydoc).groups).toHaveLength(1);
      expect(yDocToProject(ydoc).groups[0].id).toBe('grp-1');
    });

    it('should undo adding context to group', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addContextToGroupMutation(ydoc, 'grp-1', 'ctx-2');

      expect(yDocToProject(ydoc).groups[0].contextIds).toEqual(['ctx-1', 'ctx-2']);

      undoManager.undo();

      expect(yDocToProject(ydoc).groups[0].contextIds).toEqual(['ctx-1']);
    });

    it('should undo removing context from group', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      removeContextFromGroupMutation(ydoc, 'grp-1', 'ctx-1');

      expect(yDocToProject(ydoc).groups[0].contextIds).toEqual([]);

      undoManager.undo();

      expect(yDocToProject(ydoc).groups[0].contextIds).toEqual(['ctx-1']);
    });
  });
});
