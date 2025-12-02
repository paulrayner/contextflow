import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addFlowStageMutation,
  updateFlowStageMutation,
  deleteFlowStageMutation,
} from '../flowMutations';
import type { Project, FlowStageMarker } from '../../types';

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
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: {
      flowStages: [
        { name: 'Ingestion', position: 0 },
        { name: 'Processing', position: 50 },
        { name: 'Output', position: 100 },
      ],
    },
    temporal: {
      enabled: false,
      keyframes: [],
    },
  };
}

describe('flowMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('addFlowStageMutation', () => {
    it('should add a new flow stage to the Y.Doc', () => {
      const newStage: FlowStageMarker = {
        name: 'Validation',
        position: 25,
      };

      addFlowStageMutation(ydoc, newStage);

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(4);
      expect(result.viewConfig.flowStages[3].name).toBe('Validation');
      expect(result.viewConfig.flowStages[3].position).toBe(25);
    });

    it('should add a stage with optional fields', () => {
      const newStage: FlowStageMarker = {
        name: 'Enrichment',
        position: 75,
        description: 'Adds metadata to records',
        owner: 'Data Team',
        notes: 'Requires external API access',
      };

      addFlowStageMutation(ydoc, newStage);

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(4);
      const addedStage = result.viewConfig.flowStages[3];
      expect(addedStage.description).toBe('Adds metadata to records');
      expect(addedStage.owner).toBe('Data Team');
      expect(addedStage.notes).toBe('Requires external API access');
    });

    it('should add stage to empty stages array', () => {
      const emptyProject: Project = {
        ...createTestProject(),
        viewConfig: { flowStages: [] },
      };
      const emptyYdoc = projectToYDoc(emptyProject);

      addFlowStageMutation(emptyYdoc, { name: 'First', position: 50 });

      const result = yDocToProject(emptyYdoc);
      expect(result.viewConfig.flowStages).toHaveLength(1);
      expect(result.viewConfig.flowStages[0].name).toBe('First');
    });
  });

  describe('updateFlowStageMutation', () => {
    it('should update the name of an existing stage', () => {
      updateFlowStageMutation(ydoc, 0, { name: 'Data Ingestion' });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages[0].name).toBe('Data Ingestion');
      expect(result.viewConfig.flowStages[0].position).toBe(0);
    });

    it('should update the position of an existing stage', () => {
      updateFlowStageMutation(ydoc, 1, { position: 60 });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages[1].position).toBe(60);
      expect(result.viewConfig.flowStages[1].name).toBe('Processing');
    });

    it('should update description', () => {
      updateFlowStageMutation(ydoc, 0, { description: 'Initial data capture' });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages[0].description).toBe('Initial data capture');
    });

    it('should update owner', () => {
      updateFlowStageMutation(ydoc, 0, { owner: 'Platform Team' });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages[0].owner).toBe('Platform Team');
    });

    it('should update notes', () => {
      updateFlowStageMutation(ydoc, 0, { notes: 'Critical path component' });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages[0].notes).toBe('Critical path component');
    });

    it('should update multiple fields at once', () => {
      updateFlowStageMutation(ydoc, 0, {
        name: 'New Name',
        position: 10,
        description: 'New description',
        owner: 'New owner',
        notes: 'New notes',
      });

      const result = yDocToProject(ydoc);
      const stage = result.viewConfig.flowStages[0];
      expect(stage.name).toBe('New Name');
      expect(stage.position).toBe(10);
      expect(stage.description).toBe('New description');
      expect(stage.owner).toBe('New owner');
      expect(stage.notes).toBe('New notes');
    });

    it('should not modify other stages', () => {
      updateFlowStageMutation(ydoc, 0, { name: 'Updated First' });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages[0].name).toBe('Updated First');
      expect(result.viewConfig.flowStages[1].name).toBe('Processing');
      expect(result.viewConfig.flowStages[2].name).toBe('Output');
    });

    it('should do nothing for out-of-bounds index', () => {
      updateFlowStageMutation(ydoc, 99, { name: 'New Name' });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(3);
      expect(result.viewConfig.flowStages[0].name).toBe('Ingestion');
    });

    it('should do nothing for negative index', () => {
      updateFlowStageMutation(ydoc, -1, { name: 'New Name' });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(3);
      expect(result.viewConfig.flowStages[0].name).toBe('Ingestion');
    });

    it('should clear optional fields when set to undefined', () => {
      // First set some optional fields
      updateFlowStageMutation(ydoc, 0, {
        description: 'Some description',
        owner: 'Some owner',
        notes: 'Some notes',
      });

      // Then clear them
      updateFlowStageMutation(ydoc, 0, {
        description: undefined,
        owner: undefined,
        notes: undefined,
      });

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages[0].description).toBeUndefined();
      expect(result.viewConfig.flowStages[0].owner).toBeUndefined();
      expect(result.viewConfig.flowStages[0].notes).toBeUndefined();
    });
  });

  describe('deleteFlowStageMutation', () => {
    it('should delete a stage by index', () => {
      deleteFlowStageMutation(ydoc, 1);

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(2);
      expect(result.viewConfig.flowStages[0].name).toBe('Ingestion');
      expect(result.viewConfig.flowStages[1].name).toBe('Output');
    });

    it('should delete the first stage', () => {
      deleteFlowStageMutation(ydoc, 0);

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(2);
      expect(result.viewConfig.flowStages[0].name).toBe('Processing');
    });

    it('should delete the last stage', () => {
      deleteFlowStageMutation(ydoc, 2);

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(2);
      expect(result.viewConfig.flowStages[1].name).toBe('Processing');
    });

    it('should do nothing for out-of-bounds index', () => {
      deleteFlowStageMutation(ydoc, 99);

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(3);
    });

    it('should do nothing for negative index', () => {
      deleteFlowStageMutation(ydoc, -1);

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(3);
    });

    it('should handle deleting all stages', () => {
      deleteFlowStageMutation(ydoc, 0);
      deleteFlowStageMutation(ydoc, 0);
      deleteFlowStageMutation(ydoc, 0);

      const result = yDocToProject(ydoc);
      expect(result.viewConfig.flowStages).toHaveLength(0);
    });
  });

  describe('undo integration', () => {
    it('should be undoable when combined with CollabUndoManager', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addFlowStageMutation(ydoc, { name: 'NewStage', position: 25 });

      expect(yDocToProject(ydoc).viewConfig.flowStages).toHaveLength(4);

      undoManager.undo();

      expect(yDocToProject(ydoc).viewConfig.flowStages).toHaveLength(3);
    });

    it('should undo stage updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateFlowStageMutation(ydoc, 0, { name: 'Changed Name' });

      expect(yDocToProject(ydoc).viewConfig.flowStages[0].name).toBe('Changed Name');

      undoManager.undo();

      expect(yDocToProject(ydoc).viewConfig.flowStages[0].name).toBe('Ingestion');
    });

    it('should undo stage deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteFlowStageMutation(ydoc, 1);

      expect(yDocToProject(ydoc).viewConfig.flowStages).toHaveLength(2);

      undoManager.undo();

      expect(yDocToProject(ydoc).viewConfig.flowStages).toHaveLength(3);
      expect(yDocToProject(ydoc).viewConfig.flowStages[1].name).toBe('Processing');
    });

    it('should redo stage addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addFlowStageMutation(ydoc, { name: 'NewStage', position: 25 });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).viewConfig.flowStages).toHaveLength(4);
      expect(yDocToProject(ydoc).viewConfig.flowStages[3].name).toBe('NewStage');
    });

    it('should redo stage updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateFlowStageMutation(ydoc, 0, { name: 'Changed Name' });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).viewConfig.flowStages[0].name).toBe('Changed Name');
    });

    it('should redo stage deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteFlowStageMutation(ydoc, 1);
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).viewConfig.flowStages).toHaveLength(2);
    });
  });
});
