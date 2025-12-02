import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addContextMutation,
  updateContextMutation,
  deleteContextMutation,
  updateContextPositionMutation,
} from '../contextMutations';
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

describe('contextMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('addContextMutation', () => {
    it('should add a new context to the Y.Doc', () => {
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

      addContextMutation(ydoc, newContext);

      const result = yDocToProject(ydoc);
      expect(result.contexts).toHaveLength(2);
      expect(result.contexts[1].id).toBe('ctx-2');
      expect(result.contexts[1].name).toBe('Context Two');
      expect(result.contexts[1].evolutionStage).toBe('genesis');
    });

    it('should add a context with optional fields', () => {
      const newContext: BoundedContext = {
        id: 'ctx-3',
        name: 'Context Three',
        evolutionStage: 'product/rental',
        purpose: 'Test purpose',
        strategicClassification: 'core',
        ownership: 'ours',
        notes: 'Some notes',
        positions: {
          flow: { x: 10 },
          strategic: { x: 20 },
          distillation: { x: 30, y: 40 },
          shared: { y: 50 },
        },
      };

      addContextMutation(ydoc, newContext);

      const result = yDocToProject(ydoc);
      expect(result.contexts).toHaveLength(2);
      const addedContext = result.contexts[1];
      expect(addedContext.purpose).toBe('Test purpose');
      expect(addedContext.strategicClassification).toBe('core');
      expect(addedContext.ownership).toBe('ours');
      expect(addedContext.notes).toBe('Some notes');
    });

    it('should add a context with issues', () => {
      const newContext: BoundedContext = {
        id: 'ctx-4',
        name: 'Context Four',
        evolutionStage: 'commodity/utility',
        positions: {
          flow: { x: 10 },
          strategic: { x: 20 },
          distillation: { x: 30, y: 40 },
          shared: { y: 50 },
        },
        issues: [
          { id: 'issue-1', title: 'First Issue', severity: 'warning' },
          { id: 'issue-2', title: 'Second Issue', severity: 'critical', description: 'Bad stuff' },
        ],
      };

      addContextMutation(ydoc, newContext);

      const result = yDocToProject(ydoc);
      expect(result.contexts[1].issues).toHaveLength(2);
      expect(result.contexts[1].issues![0].title).toBe('First Issue');
      expect(result.contexts[1].issues![1].description).toBe('Bad stuff');
    });
  });

  describe('updateContextMutation', () => {
    it('should update the name of an existing context', () => {
      updateContextMutation(ydoc, 'ctx-1', { name: 'Updated Name' });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].name).toBe('Updated Name');
    });

    it('should update multiple fields at once', () => {
      updateContextMutation(ydoc, 'ctx-1', {
        name: 'Updated Name',
        purpose: 'New purpose',
        strategicClassification: 'core',
        ownership: 'external',
      });

      const result = yDocToProject(ydoc);
      const ctx = result.contexts[0];
      expect(ctx.name).toBe('Updated Name');
      expect(ctx.purpose).toBe('New purpose');
      expect(ctx.strategicClassification).toBe('core');
      expect(ctx.ownership).toBe('external');
    });

    it('should update evolutionStage', () => {
      updateContextMutation(ydoc, 'ctx-1', { evolutionStage: 'genesis' });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].evolutionStage).toBe('genesis');
    });

    it('should update boundaryIntegrity and boundaryNotes', () => {
      updateContextMutation(ydoc, 'ctx-1', {
        boundaryIntegrity: 'strong',
        boundaryNotes: 'Well-defined API',
      });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].boundaryIntegrity).toBe('strong');
      expect(result.contexts[0].boundaryNotes).toBe('Well-defined API');
    });

    it('should set isLegacy', () => {
      updateContextMutation(ydoc, 'ctx-1', { isLegacy: true });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].isLegacy).toBe(true);
    });

    it('should update codeSize', () => {
      updateContextMutation(ydoc, 'ctx-1', {
        codeSize: { loc: 5000, bucket: 'medium' },
      });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].codeSize?.loc).toBe(5000);
      expect(result.contexts[0].codeSize?.bucket).toBe('medium');
    });

    it('should not modify other contexts', () => {
      // Add a second context first
      const secondContext: BoundedContext = {
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
      addContextMutation(ydoc, secondContext);

      // Update only the first context
      updateContextMutation(ydoc, 'ctx-1', { name: 'Updated First' });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].name).toBe('Updated First');
      expect(result.contexts[1].name).toBe('Context Two');
    });

    it('should do nothing for non-existent context', () => {
      updateContextMutation(ydoc, 'non-existent', { name: 'Should Not Work' });

      const result = yDocToProject(ydoc);
      expect(result.contexts).toHaveLength(1);
      expect(result.contexts[0].name).toBe('Context One');
    });
  });

  describe('deleteContextMutation', () => {
    it('should delete an existing context', () => {
      deleteContextMutation(ydoc, 'ctx-1');

      const result = yDocToProject(ydoc);
      expect(result.contexts).toHaveLength(0);
    });

    it('should delete the correct context when multiple exist', () => {
      // Add a second context
      const secondContext: BoundedContext = {
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
      addContextMutation(ydoc, secondContext);

      // Delete the first one
      deleteContextMutation(ydoc, 'ctx-1');

      const result = yDocToProject(ydoc);
      expect(result.contexts).toHaveLength(1);
      expect(result.contexts[0].id).toBe('ctx-2');
      expect(result.contexts[0].name).toBe('Context Two');
    });

    it('should do nothing for non-existent context', () => {
      deleteContextMutation(ydoc, 'non-existent');

      const result = yDocToProject(ydoc);
      expect(result.contexts).toHaveLength(1);
    });
  });

  describe('updateContextPositionMutation', () => {
    it('should update flow position', () => {
      updateContextPositionMutation(ydoc, 'ctx-1', {
        flow: { x: 500 },
        strategic: { x: 200 },
        distillation: { x: 300, y: 300 },
        shared: { y: 100 },
      });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].positions.flow.x).toBe(500);
    });

    it('should update strategic position', () => {
      updateContextPositionMutation(ydoc, 'ctx-1', {
        flow: { x: 100 },
        strategic: { x: 750 },
        distillation: { x: 300, y: 300 },
        shared: { y: 100 },
      });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].positions.strategic.x).toBe(750);
    });

    it('should update distillation position', () => {
      updateContextPositionMutation(ydoc, 'ctx-1', {
        flow: { x: 100 },
        strategic: { x: 200 },
        distillation: { x: 800, y: 900 },
        shared: { y: 100 },
      });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].positions.distillation.x).toBe(800);
      expect(result.contexts[0].positions.distillation.y).toBe(900);
    });

    it('should update shared y position', () => {
      updateContextPositionMutation(ydoc, 'ctx-1', {
        flow: { x: 100 },
        strategic: { x: 200 },
        distillation: { x: 300, y: 300 },
        shared: { y: 600 },
      });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].positions.shared.y).toBe(600);
    });

    it('should update all positions at once', () => {
      updateContextPositionMutation(ydoc, 'ctx-1', {
        flow: { x: 10 },
        strategic: { x: 20 },
        distillation: { x: 30, y: 40 },
        shared: { y: 50 },
      });

      const result = yDocToProject(ydoc);
      const pos = result.contexts[0].positions;
      expect(pos.flow.x).toBe(10);
      expect(pos.strategic.x).toBe(20);
      expect(pos.distillation.x).toBe(30);
      expect(pos.distillation.y).toBe(40);
      expect(pos.shared.y).toBe(50);
    });

    it('should not modify other context positions', () => {
      // Add a second context
      const secondContext: BoundedContext = {
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
      addContextMutation(ydoc, secondContext);

      // Update only the first context's position
      updateContextPositionMutation(ydoc, 'ctx-1', {
        flow: { x: 999 },
        strategic: { x: 999 },
        distillation: { x: 999, y: 999 },
        shared: { y: 999 },
      });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].positions.flow.x).toBe(999);
      expect(result.contexts[1].positions.flow.x).toBe(50);
    });

    it('should do nothing for non-existent context', () => {
      updateContextPositionMutation(ydoc, 'non-existent', {
        flow: { x: 999 },
        strategic: { x: 999 },
        distillation: { x: 999, y: 999 },
        shared: { y: 999 },
      });

      const result = yDocToProject(ydoc);
      expect(result.contexts[0].positions.flow.x).toBe(100);
    });
  });

  describe('undo integration', () => {
    it('should be undoable when combined with CollabUndoManager', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addContextMutation(ydoc, {
        id: 'ctx-new',
        name: 'New Context',
        evolutionStage: 'genesis',
        positions: {
          flow: { x: 10 },
          strategic: { x: 20 },
          distillation: { x: 30, y: 40 },
          shared: { y: 50 },
        },
      });

      expect(yDocToProject(ydoc).contexts).toHaveLength(2);

      undoManager.undo();

      expect(yDocToProject(ydoc).contexts).toHaveLength(1);
      expect(yDocToProject(ydoc).contexts[0].id).toBe('ctx-1');
    });

    it('should undo context updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateContextMutation(ydoc, 'ctx-1', { name: 'Updated Name' });

      expect(yDocToProject(ydoc).contexts[0].name).toBe('Updated Name');

      undoManager.undo();

      expect(yDocToProject(ydoc).contexts[0].name).toBe('Context One');
    });

    it('should undo context deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteContextMutation(ydoc, 'ctx-1');

      expect(yDocToProject(ydoc).contexts).toHaveLength(0);

      undoManager.undo();

      expect(yDocToProject(ydoc).contexts).toHaveLength(1);
      expect(yDocToProject(ydoc).contexts[0].id).toBe('ctx-1');
    });

    it('should undo position updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateContextPositionMutation(ydoc, 'ctx-1', {
        flow: { x: 999 },
        strategic: { x: 999 },
        distillation: { x: 999, y: 999 },
        shared: { y: 999 },
      });

      expect(yDocToProject(ydoc).contexts[0].positions.flow.x).toBe(999);

      undoManager.undo();

      expect(yDocToProject(ydoc).contexts[0].positions.flow.x).toBe(100);
    });
  });
});
