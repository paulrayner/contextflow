/**
 * Two-Browser Sync Integration Test (collab-006)
 *
 * This test validates that the Yjs sync layer works correctly
 * when two Y.Doc instances sync updates between them.
 *
 * These tests simulate two-browser sync by using Yjs's built-in
 * update mechanism to propagate changes between two documents.
 * This validates that:
 * 1. All mutations correctly modify the Y.Doc structure
 * 2. Updates propagate correctly between documents
 * 3. Concurrent edits merge correctly (Yjs CRDT behavior)
 *
 * Run with: npm test -- --run twoBrowserSync
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import type { Project, BoundedContext, Relationship, FlowStageMarker, User, UserNeed, Team, Group } from '../../types';
import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addContextMutation,
  updateContextMutation,
  deleteContextMutation,
} from '../contextMutations';
import {
  addRelationshipMutation,
  updateRelationshipMutation,
  deleteRelationshipMutation,
} from '../relationshipMutations';
import {
  addFlowStageMutation,
  updateFlowStageMutation,
  deleteFlowStageMutation,
} from '../flowMutations';
import {
  addUserMutation,
  updateUserMutation,
  deleteUserMutation,
} from '../userMutations';
import {
  addUserNeedMutation,
  updateUserNeedMutation,
  deleteUserNeedMutation,
} from '../userNeedMutations';
import {
  addTeamMutation,
  updateTeamMutation,
  deleteTeamMutation,
} from '../metadataMutations';
import {
  addGroupMutation,
  updateGroupMutation,
  deleteGroupMutation,
} from '../groupMutations';
import { toggleTemporalMutation, addKeyframeMutation } from '../keyframeMutations';

function createTestProject(): Project {
  return {
    id: `test-project-${Date.now()}`,
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
      flowStages: [],
    },
    temporal: {
      enabled: false,
      keyframes: [],
    },
  };
}

function createTestContext(id: string, name: string): BoundedContext {
  return {
    id,
    name,
    evolutionStage: 'custom-built',
    positions: {
      flow: { x: 100 },
      strategic: { x: 200 },
      distillation: { x: 300, y: 300 },
      shared: { y: 100 },
    },
  };
}

interface SyncedDocs {
  docA: Y.Doc;
  docB: Y.Doc;
}

function createSyncedDocs(project: Project): SyncedDocs {
  // Create docA with the initial project state
  const docA = projectToYDoc(project);

  // Create docB as an empty doc that will sync with docA
  const docB = new Y.Doc();

  // Connect docs via Yjs sync protocol (simulates network sync)
  // Updates from A -> B
  docA.on('update', (update: Uint8Array) => {
    Y.applyUpdate(docB, update);
  });
  // Updates from B -> A
  docB.on('update', (update: Uint8Array) => {
    Y.applyUpdate(docA, update);
  });

  // Initial sync: apply full state from A to B
  const fullState = Y.encodeStateAsUpdate(docA);
  Y.applyUpdate(docB, fullState);

  return { docA, docB };
}

describe('Two-Browser Sync Integration', () => {
  describe('Context mutations', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('addContext syncs from A to B', () => {
      const context = createTestContext('ctx-1', 'New Context');
      addContextMutation(docA, context);

      const projectB = yDocToProject(docB);
      expect(projectB.contexts).toHaveLength(1);
      expect(projectB.contexts[0].name).toBe('New Context');
      expect(projectB.contexts[0].id).toBe('ctx-1');
    });

    it('updateContext syncs from A to B', () => {
      const context = createTestContext('ctx-1', 'Original Name');
      addContextMutation(docA, context);

      updateContextMutation(docA, 'ctx-1', { name: 'Updated Name' });

      const projectB = yDocToProject(docB);
      expect(projectB.contexts[0].name).toBe('Updated Name');
    });

    it('deleteContext syncs from A to B', () => {
      const context = createTestContext('ctx-1', 'To Be Deleted');
      addContextMutation(docA, context);

      expect(yDocToProject(docB).contexts).toHaveLength(1);

      deleteContextMutation(docA, 'ctx-1');

      const projectB = yDocToProject(docB);
      expect(projectB.contexts).toHaveLength(0);
    });

    it('bidirectional sync: changes in B appear in A', () => {
      const context = createTestContext('ctx-1', 'Created in B');
      addContextMutation(docB, context);

      const projectA = yDocToProject(docA);
      expect(projectA.contexts).toHaveLength(1);
      expect(projectA.contexts[0].name).toBe('Created in B');
    });
  });

  describe('Relationship mutations', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      project.contexts = [
        createTestContext('ctx-1', 'Context One'),
        createTestContext('ctx-2', 'Context Two'),
      ];
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('addRelationship syncs from A to B', () => {
      const relationship: Relationship = {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'customer-supplier',
      };
      addRelationshipMutation(docA, relationship);

      const projectB = yDocToProject(docB);
      expect(projectB.relationships).toHaveLength(1);
      expect(projectB.relationships[0].pattern).toBe('customer-supplier');
    });

    it('updateRelationship syncs from A to B', () => {
      const relationship: Relationship = {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'customer-supplier',
      };
      addRelationshipMutation(docA, relationship);

      updateRelationshipMutation(docA, 'rel-1', { pattern: 'partnership' });

      const projectB = yDocToProject(docB);
      expect(projectB.relationships[0].pattern).toBe('partnership');
    });

    it('deleteRelationship syncs from A to B', () => {
      const relationship: Relationship = {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'customer-supplier',
      };
      addRelationshipMutation(docA, relationship);

      expect(yDocToProject(docB).relationships).toHaveLength(1);

      deleteRelationshipMutation(docA, 'rel-1');

      const projectB = yDocToProject(docB);
      expect(projectB.relationships).toHaveLength(0);
    });
  });

  describe('FlowStage mutations', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('addFlowStage syncs from A to B', () => {
      const stage: FlowStageMarker = { name: 'Discovery', position: 100 };
      addFlowStageMutation(docA, stage);

      const projectB = yDocToProject(docB);
      expect(projectB.viewConfig.flowStages).toHaveLength(1);
      expect(projectB.viewConfig.flowStages[0].name).toBe('Discovery');
    });

    it('updateFlowStage syncs from A to B', () => {
      const stage: FlowStageMarker = { name: 'Discovery', position: 100 };
      addFlowStageMutation(docA, stage);

      updateFlowStageMutation(docA, 0, { name: 'Research' });

      const projectB = yDocToProject(docB);
      expect(projectB.viewConfig.flowStages[0].name).toBe('Research');
    });

    it('deleteFlowStage syncs from A to B', () => {
      const stage: FlowStageMarker = { name: 'Discovery', position: 100 };
      addFlowStageMutation(docA, stage);

      expect(yDocToProject(docB).viewConfig.flowStages).toHaveLength(1);

      deleteFlowStageMutation(docA, 0);

      const projectB = yDocToProject(docB);
      expect(projectB.viewConfig.flowStages).toHaveLength(0);
    });
  });

  describe('User mutations', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('addUser syncs from A to B', () => {
      const user: User = { id: 'user-1', name: 'Test User', position: 50 };
      addUserMutation(docA, user);

      const projectB = yDocToProject(docB);
      expect(projectB.users).toHaveLength(1);
      expect(projectB.users[0].name).toBe('Test User');
    });

    it('updateUser syncs from A to B', () => {
      const user: User = { id: 'user-1', name: 'Original User', position: 50 };
      addUserMutation(docA, user);

      updateUserMutation(docA, 'user-1', { name: 'Updated User' });

      const projectB = yDocToProject(docB);
      expect(projectB.users[0].name).toBe('Updated User');
    });

    it('deleteUser syncs from A to B', () => {
      const user: User = { id: 'user-1', name: 'To Delete', position: 50 };
      addUserMutation(docA, user);

      expect(yDocToProject(docB).users).toHaveLength(1);

      deleteUserMutation(docA, 'user-1');

      const projectB = yDocToProject(docB);
      expect(projectB.users).toHaveLength(0);
    });
  });

  describe('UserNeed mutations', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('addUserNeed syncs from A to B', () => {
      const need: UserNeed = { id: 'need-1', name: 'Track Orders', position: 50, visibility: true };
      addUserNeedMutation(docA, need);

      const projectB = yDocToProject(docB);
      expect(projectB.userNeeds).toHaveLength(1);
      expect(projectB.userNeeds[0].name).toBe('Track Orders');
    });

    it('updateUserNeed syncs from A to B', () => {
      const need: UserNeed = { id: 'need-1', name: 'Original Need', position: 50, visibility: true };
      addUserNeedMutation(docA, need);

      updateUserNeedMutation(docA, 'need-1', { name: 'Updated Need' });

      const projectB = yDocToProject(docB);
      expect(projectB.userNeeds[0].name).toBe('Updated Need');
    });

    it('deleteUserNeed syncs from A to B', () => {
      const need: UserNeed = { id: 'need-1', name: 'To Delete', position: 50, visibility: true };
      addUserNeedMutation(docA, need);

      expect(yDocToProject(docB).userNeeds).toHaveLength(1);

      deleteUserNeedMutation(docA, 'need-1');

      const projectB = yDocToProject(docB);
      expect(projectB.userNeeds).toHaveLength(0);
    });
  });

  describe('Team mutations', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('addTeam syncs from A to B', () => {
      const team: Team = { id: 'team-1', name: 'Platform Team', topologyType: 'platform' };
      addTeamMutation(docA, team);

      const projectB = yDocToProject(docB);
      expect(projectB.teams).toHaveLength(1);
      expect(projectB.teams[0].name).toBe('Platform Team');
    });

    it('updateTeam syncs from A to B', () => {
      const team: Team = { id: 'team-1', name: 'Original Team', topologyType: 'stream-aligned' };
      addTeamMutation(docA, team);

      updateTeamMutation(docA, 'team-1', { name: 'Updated Team' });

      const projectB = yDocToProject(docB);
      expect(projectB.teams[0].name).toBe('Updated Team');
    });

    it('deleteTeam syncs from A to B', () => {
      const team: Team = { id: 'team-1', name: 'To Delete', topologyType: 'stream-aligned' };
      addTeamMutation(docA, team);

      expect(yDocToProject(docB).teams).toHaveLength(1);

      deleteTeamMutation(docA, 'team-1');

      const projectB = yDocToProject(docB);
      expect(projectB.teams).toHaveLength(0);
    });
  });

  describe('Group mutations', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      project.contexts = [
        createTestContext('ctx-1', 'Context One'),
        createTestContext('ctx-2', 'Context Two'),
      ];
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('addGroup syncs from A to B', () => {
      const group: Group = {
        id: 'group-1',
        label: 'Test Group',
        color: '#3b82f6',
        contextIds: ['ctx-1', 'ctx-2'],
      };
      addGroupMutation(docA, group);

      const projectB = yDocToProject(docB);
      expect(projectB.groups).toHaveLength(1);
      expect(projectB.groups[0].label).toBe('Test Group');
      expect(projectB.groups[0].contextIds).toEqual(['ctx-1', 'ctx-2']);
    });

    it('updateGroup syncs from A to B', () => {
      const group: Group = {
        id: 'group-1',
        label: 'Original Group',
        color: '#3b82f6',
        contextIds: ['ctx-1'],
      };
      addGroupMutation(docA, group);

      updateGroupMutation(docA, 'group-1', { label: 'Updated Group' });

      const projectB = yDocToProject(docB);
      expect(projectB.groups[0].label).toBe('Updated Group');
    });

    it('deleteGroup syncs from A to B', () => {
      const group: Group = {
        id: 'group-1',
        label: 'To Delete',
        color: '#3b82f6',
        contextIds: ['ctx-1'],
      };
      addGroupMutation(docA, group);

      expect(yDocToProject(docB).groups).toHaveLength(1);

      deleteGroupMutation(docA, 'group-1');

      const projectB = yDocToProject(docB);
      expect(projectB.groups).toHaveLength(0);
    });
  });

  describe('Temporal mutations', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      project.contexts = [createTestContext('ctx-1', 'Context One')];
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('toggleTemporal syncs from A to B', () => {
      toggleTemporalMutation(docA, true);

      const projectB = yDocToProject(docB);
      expect(projectB.temporal?.enabled).toBe(true);
    });

    it('addKeyframe syncs from A to B', () => {
      toggleTemporalMutation(docA, true);

      addKeyframeMutation(docA, {
        id: 'kf-1',
        date: '2025',
        label: 'Future State',
        positions: { 'ctx-1': { x: 100, y: 100 } },
        activeContextIds: ['ctx-1'],
      });

      const projectB = yDocToProject(docB);
      expect(projectB.temporal?.keyframes).toHaveLength(1);
      expect(projectB.temporal?.keyframes[0].label).toBe('Future State');
    });
  });

  describe('Concurrent edits', () => {
    let docA: Y.Doc;
    let docB: Y.Doc;

    beforeEach(() => {
      const project = createTestProject();
      project.contexts = [createTestContext('ctx-1', 'Shared Context')];
      ({ docA, docB } = createSyncedDocs(project));
    });

    afterEach(() => {
      docA?.destroy();
      docB?.destroy();
    });

    it('concurrent updates to different fields merge correctly', () => {
      // A updates name, B updates purpose (concurrently)
      updateContextMutation(docA, 'ctx-1', { name: 'Updated by A' });
      updateContextMutation(docB, 'ctx-1', { purpose: 'Purpose by B' });

      // Both changes should be present in both docs
      const projectA = yDocToProject(docA);
      const projectB = yDocToProject(docB);

      expect(projectA.contexts[0].name).toBe('Updated by A');
      expect(projectA.contexts[0].purpose).toBe('Purpose by B');

      expect(projectB.contexts[0].name).toBe('Updated by A');
      expect(projectB.contexts[0].purpose).toBe('Purpose by B');
    });

    it('rapid mutations sync correctly', () => {
      // Add 5 contexts rapidly from A
      for (let i = 1; i <= 5; i++) {
        addContextMutation(docA, createTestContext(`ctx-rapid-${i}`, `Rapid Context ${i}`));
      }

      const projectB = yDocToProject(docB);
      expect(projectB.contexts).toHaveLength(6); // 1 original + 5 new

      for (let i = 1; i <= 5; i++) {
        const ctx = projectB.contexts.find(c => c.id === `ctx-rapid-${i}`);
        expect(ctx).toBeDefined();
        expect(ctx?.name).toBe(`Rapid Context ${i}`);
      }
    });

    it('alternating edits between docs sync correctly', () => {
      // A adds a context
      addContextMutation(docA, createTestContext('ctx-a', 'Context from A'));

      // B adds a context
      addContextMutation(docB, createTestContext('ctx-b', 'Context from B'));

      // A adds another
      addContextMutation(docA, createTestContext('ctx-a2', 'Context 2 from A'));

      // Both docs should have all 4 contexts (1 original + 3 new)
      const projectA = yDocToProject(docA);
      const projectB = yDocToProject(docB);

      expect(projectA.contexts).toHaveLength(4);
      expect(projectB.contexts).toHaveLength(4);

      expect(projectA.contexts.find(c => c.id === 'ctx-a')).toBeDefined();
      expect(projectA.contexts.find(c => c.id === 'ctx-b')).toBeDefined();
      expect(projectA.contexts.find(c => c.id === 'ctx-a2')).toBeDefined();

      expect(projectB.contexts.find(c => c.id === 'ctx-a')).toBeDefined();
      expect(projectB.contexts.find(c => c.id === 'ctx-b')).toBeDefined();
      expect(projectB.contexts.find(c => c.id === 'ctx-a2')).toBeDefined();
    });
  });
});
