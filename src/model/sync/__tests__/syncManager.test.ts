import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest';
import * as Y from 'yjs';
import type { Project } from '../../types';
import { SyncManager } from '../syncManager';
import { projectToYDoc } from '../projectSync';

const createMinimalProject = (overrides?: Partial<Project>): Project => ({
  id: 'test-project-1',
  name: 'Test Project',
  contexts: [],
  relationships: [],
  repos: [],
  people: [],
  teams: [],
  groups: [],
  users: [],
  userNeeds: [],
  userNeedConnections: [],
  needContextConnections: [],
  viewConfig: { flowStages: [] },
  ...overrides,
});

describe('SyncManager', () => {
  let ydoc: Y.Doc;
  let syncManager: SyncManager;
  let onProjectChange: Mock<(project: Project) => void>;

  beforeEach(() => {
    ydoc = new Y.Doc();
    onProjectChange = vi.fn();
    syncManager = new SyncManager(ydoc, onProjectChange);
  });

  afterEach(() => {
    syncManager.destroy();
    ydoc.destroy();
  });

  describe('initialization', () => {
    it('creates a sync manager with a Y.Doc', () => {
      expect(syncManager).toBeDefined();
    });

    it('does not fire callback on initialization', () => {
      expect(onProjectChange).not.toHaveBeenCalled();
    });
  });

  describe('observing Yjs changes', () => {
    it('fires callback when project map changes', () => {
      const project = createMinimalProject();
      const sourceDoc = projectToYDoc(project);

      // Apply updates from source doc to our doc
      const update = Y.encodeStateAsUpdate(sourceDoc);
      Y.applyUpdate(ydoc, update);

      expect(onProjectChange).toHaveBeenCalled();
      const receivedProject = onProjectChange.mock.calls[0][0];
      expect(receivedProject.id).toBe('test-project-1');
      expect(receivedProject.name).toBe('Test Project');

      sourceDoc.destroy();
    });

    it('fires callback with full project data when contexts are added', () => {
      const project = createMinimalProject({
        contexts: [{
          id: 'ctx-1',
          name: 'Test Context',
          evolutionStage: 'custom-built',
          positions: {
            strategic: { x: 0 },
            flow: { x: 0 },
            distillation: { x: 0, y: 0 },
            shared: { y: 0 },
          },
        }],
      });
      const sourceDoc = projectToYDoc(project);
      const update = Y.encodeStateAsUpdate(sourceDoc);
      Y.applyUpdate(ydoc, update);

      expect(onProjectChange).toHaveBeenCalled();
      const receivedProject = onProjectChange.mock.calls[0][0];
      expect(receivedProject.contexts).toHaveLength(1);
      expect(receivedProject.contexts[0].name).toBe('Test Context');

      sourceDoc.destroy();
    });

    it('fires callback when relationships are updated', () => {
      const project = createMinimalProject({
        relationships: [{
          id: 'rel-1',
          fromContextId: 'ctx-a',
          toContextId: 'ctx-b',
          pattern: 'customer-supplier',
        }],
      });
      const sourceDoc = projectToYDoc(project);
      const update = Y.encodeStateAsUpdate(sourceDoc);
      Y.applyUpdate(ydoc, update);

      const receivedProject = onProjectChange.mock.calls[0][0];
      expect(receivedProject.relationships).toHaveLength(1);
      expect(receivedProject.relationships[0].pattern).toBe('customer-supplier');

      sourceDoc.destroy();
    });
  });

  describe('batching updates', () => {
    it('batches multiple rapid changes into single callback', async () => {
      const project = createMinimalProject();

      // Simulate multiple rapid updates
      ydoc.transact(() => {
        const yProject = ydoc.getMap('project');
        yProject.set('id', project.id);
        yProject.set('name', project.name);
        yProject.set('version', null);
        yProject.set('createdAt', null);
        yProject.set('updatedAt', null);
        yProject.set('temporal', null);

        const yContexts = new Y.Array();
        yProject.set('contexts', yContexts);
        const yRelationships = new Y.Array();
        yProject.set('relationships', yRelationships);
        const yRepos = new Y.Array();
        yProject.set('repos', yRepos);
        const yPeople = new Y.Array();
        yProject.set('people', yPeople);
        const yTeams = new Y.Array();
        yProject.set('teams', yTeams);
        const yGroups = new Y.Array();
        yProject.set('groups', yGroups);
        const yUsers = new Y.Array();
        yProject.set('users', yUsers);
        const yUserNeeds = new Y.Array();
        yProject.set('userNeeds', yUserNeeds);
        const yUserNeedConnections = new Y.Array();
        yProject.set('userNeedConnections', yUserNeedConnections);
        const yNeedContextConnections = new Y.Array();
        yProject.set('needContextConnections', yNeedContextConnections);
        const yViewConfig = new Y.Map();
        const yFlowStages = new Y.Array();
        yViewConfig.set('flowStages', yFlowStages);
        yProject.set('viewConfig', yViewConfig);
      });

      // Transaction batches updates, should only fire once
      expect(onProjectChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('stops observing after destroy', () => {
      syncManager.destroy();

      // Make changes after destroy
      const project = createMinimalProject();
      const sourceDoc = projectToYDoc(project);
      const update = Y.encodeStateAsUpdate(sourceDoc);
      Y.applyUpdate(ydoc, update);

      expect(onProjectChange).not.toHaveBeenCalled();

      sourceDoc.destroy();
    });
  });

  describe('pause and resume', () => {
    it('pauses observation when paused', () => {
      syncManager.pause();

      const project = createMinimalProject();
      const sourceDoc = projectToYDoc(project);
      const update = Y.encodeStateAsUpdate(sourceDoc);
      Y.applyUpdate(ydoc, update);

      expect(onProjectChange).not.toHaveBeenCalled();

      sourceDoc.destroy();
    });

    it('resumes observation after resume', () => {
      syncManager.pause();
      syncManager.resume();

      const project = createMinimalProject();
      const sourceDoc = projectToYDoc(project);
      const update = Y.encodeStateAsUpdate(sourceDoc);
      Y.applyUpdate(ydoc, update);

      expect(onProjectChange).toHaveBeenCalled();

      sourceDoc.destroy();
    });
  });
});
