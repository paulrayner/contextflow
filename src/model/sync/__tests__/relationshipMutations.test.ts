import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addRelationshipMutation,
  updateRelationshipMutation,
  deleteRelationshipMutation,
} from '../relationshipMutations';
import type { Project, Relationship } from '../../types';

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
    ],
    relationships: [
      {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'customer-supplier',
      },
    ],
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

describe('relationshipMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('addRelationshipMutation', () => {
    it('should add a new relationship to the Y.Doc', () => {
      const newRelationship: Relationship = {
        id: 'rel-2',
        fromContextId: 'ctx-2',
        toContextId: 'ctx-1',
        pattern: 'conformist',
      };

      addRelationshipMutation(ydoc, newRelationship);

      const result = yDocToProject(ydoc);
      expect(result.relationships).toHaveLength(2);
      expect(result.relationships[1].id).toBe('rel-2');
      expect(result.relationships[1].fromContextId).toBe('ctx-2');
      expect(result.relationships[1].toContextId).toBe('ctx-1');
      expect(result.relationships[1].pattern).toBe('conformist');
    });

    it('should add a relationship with optional fields', () => {
      const newRelationship: Relationship = {
        id: 'rel-3',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'anti-corruption-layer',
        communicationMode: 'async',
        description: 'ACL protects downstream from upstream changes',
      };

      addRelationshipMutation(ydoc, newRelationship);

      const result = yDocToProject(ydoc);
      expect(result.relationships).toHaveLength(2);
      const addedRel = result.relationships[1];
      expect(addedRel.communicationMode).toBe('async');
      expect(addedRel.description).toBe('ACL protects downstream from upstream changes');
    });

    it('should add a relationship with all pattern types', () => {
      const patterns: Relationship['pattern'][] = [
        'shared-kernel',
        'partnership',
        'open-host-service',
        'published-language',
        'separate-ways',
      ];

      for (const pattern of patterns) {
        const rel: Relationship = {
          id: `rel-${pattern}`,
          fromContextId: 'ctx-1',
          toContextId: 'ctx-2',
          pattern,
        };
        addRelationshipMutation(ydoc, rel);
      }

      const result = yDocToProject(ydoc);
      expect(result.relationships).toHaveLength(6); // 1 original + 5 new
    });
  });

  describe('updateRelationshipMutation', () => {
    it('should update the pattern of an existing relationship', () => {
      updateRelationshipMutation(ydoc, 'rel-1', { pattern: 'conformist' });

      const result = yDocToProject(ydoc);
      expect(result.relationships[0].pattern).toBe('conformist');
    });

    it('should update fromContextId and toContextId', () => {
      updateRelationshipMutation(ydoc, 'rel-1', {
        fromContextId: 'ctx-2',
        toContextId: 'ctx-1',
      });

      const result = yDocToProject(ydoc);
      expect(result.relationships[0].fromContextId).toBe('ctx-2');
      expect(result.relationships[0].toContextId).toBe('ctx-1');
    });

    it('should update communicationMode', () => {
      updateRelationshipMutation(ydoc, 'rel-1', { communicationMode: 'sync' });

      const result = yDocToProject(ydoc);
      expect(result.relationships[0].communicationMode).toBe('sync');
    });

    it('should update description', () => {
      updateRelationshipMutation(ydoc, 'rel-1', {
        description: 'Updated description',
      });

      const result = yDocToProject(ydoc);
      expect(result.relationships[0].description).toBe('Updated description');
    });

    it('should update multiple fields at once', () => {
      updateRelationshipMutation(ydoc, 'rel-1', {
        pattern: 'partnership',
        communicationMode: 'async',
        description: 'Equal collaboration',
      });

      const result = yDocToProject(ydoc);
      const rel = result.relationships[0];
      expect(rel.pattern).toBe('partnership');
      expect(rel.communicationMode).toBe('async');
      expect(rel.description).toBe('Equal collaboration');
    });

    it('should not modify other relationships', () => {
      // Add a second relationship first
      const secondRel: Relationship = {
        id: 'rel-2',
        fromContextId: 'ctx-2',
        toContextId: 'ctx-1',
        pattern: 'conformist',
      };
      addRelationshipMutation(ydoc, secondRel);

      // Update only the first relationship
      updateRelationshipMutation(ydoc, 'rel-1', { pattern: 'partnership' });

      const result = yDocToProject(ydoc);
      expect(result.relationships[0].pattern).toBe('partnership');
      expect(result.relationships[1].pattern).toBe('conformist');
    });

    it('should do nothing for non-existent relationship', () => {
      updateRelationshipMutation(ydoc, 'non-existent', { pattern: 'conformist' });

      const result = yDocToProject(ydoc);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].pattern).toBe('customer-supplier');
    });

    it('should clear optional fields when set to undefined', () => {
      // First set some optional fields
      updateRelationshipMutation(ydoc, 'rel-1', {
        communicationMode: 'sync',
        description: 'Some description',
      });

      // Then clear them
      updateRelationshipMutation(ydoc, 'rel-1', {
        communicationMode: undefined,
        description: undefined,
      });

      const result = yDocToProject(ydoc);
      expect(result.relationships[0].communicationMode).toBeUndefined();
      expect(result.relationships[0].description).toBeUndefined();
    });
  });

  describe('deleteRelationshipMutation', () => {
    it('should delete an existing relationship', () => {
      deleteRelationshipMutation(ydoc, 'rel-1');

      const result = yDocToProject(ydoc);
      expect(result.relationships).toHaveLength(0);
    });

    it('should delete the correct relationship when multiple exist', () => {
      // Add a second relationship
      const secondRel: Relationship = {
        id: 'rel-2',
        fromContextId: 'ctx-2',
        toContextId: 'ctx-1',
        pattern: 'conformist',
      };
      addRelationshipMutation(ydoc, secondRel);

      // Delete the first one
      deleteRelationshipMutation(ydoc, 'rel-1');

      const result = yDocToProject(ydoc);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].id).toBe('rel-2');
      expect(result.relationships[0].pattern).toBe('conformist');
    });

    it('should do nothing for non-existent relationship', () => {
      deleteRelationshipMutation(ydoc, 'non-existent');

      const result = yDocToProject(ydoc);
      expect(result.relationships).toHaveLength(1);
    });
  });

  describe('undo integration', () => {
    it('should be undoable when combined with CollabUndoManager', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addRelationshipMutation(ydoc, {
        id: 'rel-new',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'shared-kernel',
      });

      expect(yDocToProject(ydoc).relationships).toHaveLength(2);

      undoManager.undo();

      expect(yDocToProject(ydoc).relationships).toHaveLength(1);
      expect(yDocToProject(ydoc).relationships[0].id).toBe('rel-1');
    });

    it('should undo relationship updates', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateRelationshipMutation(ydoc, 'rel-1', { pattern: 'partnership' });

      expect(yDocToProject(ydoc).relationships[0].pattern).toBe('partnership');

      undoManager.undo();

      expect(yDocToProject(ydoc).relationships[0].pattern).toBe('customer-supplier');
    });

    it('should undo relationship deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteRelationshipMutation(ydoc, 'rel-1');

      expect(yDocToProject(ydoc).relationships).toHaveLength(0);

      undoManager.undo();

      expect(yDocToProject(ydoc).relationships).toHaveLength(1);
      expect(yDocToProject(ydoc).relationships[0].id).toBe('rel-1');
    });
  });
});
