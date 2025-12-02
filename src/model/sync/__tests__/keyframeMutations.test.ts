import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addKeyframeMutation,
  updateKeyframeMutation,
  deleteKeyframeMutation,
  updateKeyframeContextPositionMutation,
  toggleTemporalMutation,
} from '../keyframeMutations';
import type { Project, TemporalKeyframe } from '../../types';

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
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: {
      flowStages: [],
    },
    temporal: {
      enabled: true,
      keyframes: [
        {
          id: 'keyframe-1',
          date: '2024',
          label: 'Current State',
          positions: {
            'context-1': { x: 30, y: 40 },
            'context-2': { x: 50, y: 60 },
          },
          activeContextIds: ['context-1', 'context-2'],
        },
        {
          id: 'keyframe-2',
          date: '2025',
          positions: {
            'context-1': { x: 35, y: 45 },
            'context-2': { x: 55, y: 65 },
          },
          activeContextIds: ['context-1', 'context-2'],
        },
      ],
    },
  };
}

describe('keyframeMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('addKeyframeMutation', () => {
    it('should add a new keyframe to the Y.Doc', () => {
      const newKeyframe: TemporalKeyframe = {
        id: 'keyframe-new',
        date: '2026',
        positions: {
          'context-1': { x: 40, y: 50 },
        },
        activeContextIds: ['context-1'],
      };

      addKeyframeMutation(ydoc, newKeyframe);

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes).toHaveLength(3);
      expect(result.temporal?.keyframes[2].id).toBe('keyframe-new');
      expect(result.temporal?.keyframes[2].date).toBe('2026');
      expect(result.temporal?.keyframes[2].positions['context-1']).toEqual({ x: 40, y: 50 });
      expect(result.temporal?.keyframes[2].activeContextIds).toEqual(['context-1']);
    });

    it('should add a keyframe with label', () => {
      const newKeyframe: TemporalKeyframe = {
        id: 'keyframe-new',
        date: '2026',
        label: 'Future Vision',
        positions: {
          'context-1': { x: 40, y: 50 },
        },
        activeContextIds: ['context-1'],
      };

      addKeyframeMutation(ydoc, newKeyframe);

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[2].label).toBe('Future Vision');
    });

    it('should add keyframe to empty keyframes array', () => {
      const emptyProject: Project = {
        ...createTestProject(),
        temporal: {
          enabled: true,
          keyframes: [],
        },
      };
      const emptyYdoc = projectToYDoc(emptyProject);

      addKeyframeMutation(emptyYdoc, {
        id: 'first',
        date: '2024',
        positions: {},
        activeContextIds: [],
      });

      const result = yDocToProject(emptyYdoc);
      expect(result.temporal?.keyframes).toHaveLength(1);
      expect(result.temporal?.keyframes[0].id).toBe('first');
    });

    it('should add keyframe with multiple context positions', () => {
      const newKeyframe: TemporalKeyframe = {
        id: 'keyframe-multi',
        date: '2026',
        positions: {
          'context-1': { x: 10, y: 20 },
          'context-2': { x: 30, y: 40 },
        },
        activeContextIds: ['context-1', 'context-2'],
      };

      addKeyframeMutation(ydoc, newKeyframe);

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[2].positions).toEqual({
        'context-1': { x: 10, y: 20 },
        'context-2': { x: 30, y: 40 },
      });
    });
  });

  describe('updateKeyframeMutation', () => {
    it('should update the label of an existing keyframe', () => {
      updateKeyframeMutation(ydoc, 'keyframe-1', { label: 'Updated Label' });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].label).toBe('Updated Label');
    });

    it('should update the date of an existing keyframe', () => {
      updateKeyframeMutation(ydoc, 'keyframe-1', { date: '2024-Q2' });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].date).toBe('2024-Q2');
    });

    it('should not modify other keyframes', () => {
      updateKeyframeMutation(ydoc, 'keyframe-1', { label: 'Updated First' });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].label).toBe('Updated First');
      expect(result.temporal?.keyframes[1].label).toBeUndefined();
    });

    it('should do nothing for non-existent keyframe id', () => {
      updateKeyframeMutation(ydoc, 'non-existent', { label: 'New Label' });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes).toHaveLength(2);
      expect(result.temporal?.keyframes[0].label).toBe('Current State');
    });

    it('should clear label when set to undefined', () => {
      updateKeyframeMutation(ydoc, 'keyframe-1', { label: undefined });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].label).toBeUndefined();
    });

    it('should update activeContextIds', () => {
      updateKeyframeMutation(ydoc, 'keyframe-1', { activeContextIds: ['context-1'] });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].activeContextIds).toEqual(['context-1']);
    });
  });

  describe('deleteKeyframeMutation', () => {
    it('should delete a keyframe by id', () => {
      deleteKeyframeMutation(ydoc, 'keyframe-1');

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes).toHaveLength(1);
      expect(result.temporal?.keyframes[0].id).toBe('keyframe-2');
    });

    it('should delete the last keyframe', () => {
      deleteKeyframeMutation(ydoc, 'keyframe-2');

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes).toHaveLength(1);
      expect(result.temporal?.keyframes[0].id).toBe('keyframe-1');
    });

    it('should do nothing for non-existent keyframe id', () => {
      deleteKeyframeMutation(ydoc, 'non-existent');

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes).toHaveLength(2);
    });

    it('should handle deleting all keyframes', () => {
      deleteKeyframeMutation(ydoc, 'keyframe-1');
      deleteKeyframeMutation(ydoc, 'keyframe-2');

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes).toHaveLength(0);
    });
  });

  describe('updateKeyframeContextPositionMutation', () => {
    it('should update position of an existing context in keyframe', () => {
      updateKeyframeContextPositionMutation(ydoc, 'keyframe-1', 'context-1', { x: 99, y: 88 });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].positions['context-1']).toEqual({ x: 99, y: 88 });
    });

    it('should add position for a new context in keyframe', () => {
      updateKeyframeContextPositionMutation(ydoc, 'keyframe-1', 'context-3', { x: 70, y: 80 });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].positions['context-3']).toEqual({ x: 70, y: 80 });
    });

    it('should not modify other contexts in the same keyframe', () => {
      updateKeyframeContextPositionMutation(ydoc, 'keyframe-1', 'context-1', { x: 99, y: 88 });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].positions['context-1']).toEqual({ x: 99, y: 88 });
      expect(result.temporal?.keyframes[0].positions['context-2']).toEqual({ x: 50, y: 60 });
    });

    it('should not modify other keyframes', () => {
      updateKeyframeContextPositionMutation(ydoc, 'keyframe-1', 'context-1', { x: 99, y: 88 });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[1].positions['context-1']).toEqual({ x: 35, y: 45 });
    });

    it('should do nothing for non-existent keyframe id', () => {
      updateKeyframeContextPositionMutation(ydoc, 'non-existent', 'context-1', { x: 99, y: 88 });

      const result = yDocToProject(ydoc);
      expect(result.temporal?.keyframes[0].positions['context-1']).toEqual({ x: 30, y: 40 });
    });
  });

  describe('toggleTemporalMutation', () => {
    it('should enable temporal mode when disabled', () => {
      const disabledProject: Project = {
        ...createTestProject(),
        temporal: {
          enabled: false,
          keyframes: [],
        },
      };
      const disabledYdoc = projectToYDoc(disabledProject);

      toggleTemporalMutation(disabledYdoc, true);

      const result = yDocToProject(disabledYdoc);
      expect(result.temporal?.enabled).toBe(true);
    });

    it('should disable temporal mode when enabled', () => {
      toggleTemporalMutation(ydoc, false);

      const result = yDocToProject(ydoc);
      expect(result.temporal?.enabled).toBe(false);
    });

    it('should preserve keyframes when toggling', () => {
      toggleTemporalMutation(ydoc, false);

      const result = yDocToProject(ydoc);
      expect(result.temporal?.enabled).toBe(false);
      expect(result.temporal?.keyframes).toHaveLength(2);
    });

    it('should handle toggling back on', () => {
      toggleTemporalMutation(ydoc, false);
      toggleTemporalMutation(ydoc, true);

      const result = yDocToProject(ydoc);
      expect(result.temporal?.enabled).toBe(true);
      expect(result.temporal?.keyframes).toHaveLength(2);
    });

    it('should be idempotent when setting same value', () => {
      toggleTemporalMutation(ydoc, true);

      const result = yDocToProject(ydoc);
      expect(result.temporal?.enabled).toBe(true);
      expect(result.temporal?.keyframes).toHaveLength(2);
    });
  });

  describe('undo integration', () => {
    it('should undo keyframe addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addKeyframeMutation(ydoc, {
        id: 'new-keyframe',
        date: '2026',
        positions: {},
        activeContextIds: [],
      });

      expect(yDocToProject(ydoc).temporal?.keyframes).toHaveLength(3);

      undoManager.undo();

      expect(yDocToProject(ydoc).temporal?.keyframes).toHaveLength(2);
    });

    it('should undo keyframe update', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateKeyframeMutation(ydoc, 'keyframe-1', { label: 'Changed Label' });

      expect(yDocToProject(ydoc).temporal?.keyframes[0].label).toBe('Changed Label');

      undoManager.undo();

      expect(yDocToProject(ydoc).temporal?.keyframes[0].label).toBe('Current State');
    });

    it('should undo keyframe deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteKeyframeMutation(ydoc, 'keyframe-1');

      expect(yDocToProject(ydoc).temporal?.keyframes).toHaveLength(1);

      undoManager.undo();

      expect(yDocToProject(ydoc).temporal?.keyframes).toHaveLength(2);
      expect(yDocToProject(ydoc).temporal?.keyframes[0].id).toBe('keyframe-1');
    });

    it('should undo context position update in keyframe', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateKeyframeContextPositionMutation(ydoc, 'keyframe-1', 'context-1', { x: 99, y: 88 });

      expect(yDocToProject(ydoc).temporal?.keyframes[0].positions['context-1']).toEqual({ x: 99, y: 88 });

      undoManager.undo();

      expect(yDocToProject(ydoc).temporal?.keyframes[0].positions['context-1']).toEqual({ x: 30, y: 40 });
    });

    it('should redo keyframe addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addKeyframeMutation(ydoc, {
        id: 'new-keyframe',
        date: '2026',
        positions: {},
        activeContextIds: [],
      });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).temporal?.keyframes).toHaveLength(3);
      expect(yDocToProject(ydoc).temporal?.keyframes[2].id).toBe('new-keyframe');
    });

    it('should redo keyframe deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteKeyframeMutation(ydoc, 'keyframe-1');
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).temporal?.keyframes).toHaveLength(1);
    });

    it('should undo temporal mode toggle', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      expect(yDocToProject(ydoc).temporal?.enabled).toBe(true);

      toggleTemporalMutation(ydoc, false);
      expect(yDocToProject(ydoc).temporal?.enabled).toBe(false);

      undoManager.undo();
      expect(yDocToProject(ydoc).temporal?.enabled).toBe(true);
    });

    it('should redo temporal mode toggle', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      toggleTemporalMutation(ydoc, false);
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).temporal?.enabled).toBe(false);
    });
  });
});
