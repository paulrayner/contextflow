import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { projectToYDoc, yDocToProject } from '../projectSync';
import {
  addTeamMutation,
  updateTeamMutation,
  deleteTeamMutation,
  addRepoMutation,
  updateRepoMutation,
  deleteRepoMutation,
  addPersonMutation,
  updatePersonMutation,
  deletePersonMutation,
} from '../metadataMutations';
import type { Project, Team, Repo, Person } from '../../types';

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
        teamId: 'team-1',
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
    repos: [
      {
        id: 'repo-1',
        name: 'order-service',
        teamIds: ['team-1'],
        contributors: [{ personId: 'person-1' }],
        contextId: 'context-1',
      },
      {
        id: 'repo-2',
        name: 'payment-service',
        teamIds: ['team-2'],
        contributors: [],
        remoteUrl: 'https://github.com/acme/payment',
      },
    ],
    people: [
      { id: 'person-1', displayName: 'Alice', emails: ['alice@example.com'] },
      { id: 'person-2', displayName: 'Bob', emails: ['bob@example.com'], teamIds: ['team-1'] },
    ],
    teams: [
      { id: 'team-1', name: 'Orders Team', topologyType: 'stream-aligned' },
      { id: 'team-2', name: 'Payments Team', topologyType: 'platform', jiraBoard: 'PAY' },
    ],
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

describe('metadataMutations', () => {
  let project: Project;
  let ydoc: Y.Doc;

  beforeEach(() => {
    project = createTestProject();
    ydoc = projectToYDoc(project);
  });

  describe('Team mutations', () => {
    describe('addTeamMutation', () => {
      it('should add a new team to the Y.Doc', () => {
        const newTeam: Team = {
          id: 'team-new',
          name: 'New Team',
          topologyType: 'enabling',
        };

        addTeamMutation(ydoc, newTeam);

        const result = yDocToProject(ydoc);
        expect(result.teams).toHaveLength(3);
        expect(result.teams[2].id).toBe('team-new');
        expect(result.teams[2].name).toBe('New Team');
        expect(result.teams[2].topologyType).toBe('enabling');
      });

      it('should add a team with jiraBoard', () => {
        const newTeam: Team = {
          id: 'team-new',
          name: 'DevOps',
          jiraBoard: 'DEVOPS',
        };

        addTeamMutation(ydoc, newTeam);

        const result = yDocToProject(ydoc);
        expect(result.teams[2].jiraBoard).toBe('DEVOPS');
      });

      it('should add team to empty teams array', () => {
        const emptyProject: Project = {
          ...createTestProject(),
          teams: [],
        };
        const emptyYdoc = projectToYDoc(emptyProject);

        addTeamMutation(emptyYdoc, {
          id: 'first-team',
          name: 'First Team',
        });

        const result = yDocToProject(emptyYdoc);
        expect(result.teams).toHaveLength(1);
        expect(result.teams[0].id).toBe('first-team');
      });
    });

    describe('updateTeamMutation', () => {
      it('should update the name of an existing team', () => {
        updateTeamMutation(ydoc, 'team-1', { name: 'Updated Orders Team' });

        const result = yDocToProject(ydoc);
        expect(result.teams[0].name).toBe('Updated Orders Team');
      });

      it('should update topologyType', () => {
        updateTeamMutation(ydoc, 'team-1', { topologyType: 'platform' });

        const result = yDocToProject(ydoc);
        expect(result.teams[0].topologyType).toBe('platform');
      });

      it('should update jiraBoard', () => {
        updateTeamMutation(ydoc, 'team-1', { jiraBoard: 'ORD' });

        const result = yDocToProject(ydoc);
        expect(result.teams[0].jiraBoard).toBe('ORD');
      });

      it('should not modify other teams', () => {
        updateTeamMutation(ydoc, 'team-1', { name: 'Updated' });

        const result = yDocToProject(ydoc);
        expect(result.teams[1].name).toBe('Payments Team');
      });

      it('should do nothing for non-existent team id', () => {
        updateTeamMutation(ydoc, 'non-existent', { name: 'Updated' });

        const result = yDocToProject(ydoc);
        expect(result.teams).toHaveLength(2);
        expect(result.teams[0].name).toBe('Orders Team');
      });

      it('should clear optional field when set to undefined', () => {
        updateTeamMutation(ydoc, 'team-2', { jiraBoard: undefined });

        const result = yDocToProject(ydoc);
        expect(result.teams[1].jiraBoard).toBeUndefined();
      });
    });

    describe('deleteTeamMutation', () => {
      it('should delete a team by id', () => {
        deleteTeamMutation(ydoc, 'team-1');

        const result = yDocToProject(ydoc);
        expect(result.teams).toHaveLength(1);
        expect(result.teams[0].id).toBe('team-2');
      });

      it('should do nothing for non-existent team id', () => {
        deleteTeamMutation(ydoc, 'non-existent');

        const result = yDocToProject(ydoc);
        expect(result.teams).toHaveLength(2);
      });

      it('should handle deleting all teams', () => {
        deleteTeamMutation(ydoc, 'team-1');
        deleteTeamMutation(ydoc, 'team-2');

        const result = yDocToProject(ydoc);
        expect(result.teams).toHaveLength(0);
      });

      it('should clear teamId from contexts when team is deleted', () => {
        deleteTeamMutation(ydoc, 'team-1');

        const result = yDocToProject(ydoc);
        expect(result.contexts[0].teamId).toBeUndefined();
      });
    });
  });

  describe('Repo mutations', () => {
    describe('addRepoMutation', () => {
      it('should add a new repo to the Y.Doc', () => {
        const newRepo: Repo = {
          id: 'repo-new',
          name: 'new-service',
          teamIds: ['team-1'],
          contributors: [],
        };

        addRepoMutation(ydoc, newRepo);

        const result = yDocToProject(ydoc);
        expect(result.repos).toHaveLength(3);
        expect(result.repos[2].id).toBe('repo-new');
        expect(result.repos[2].name).toBe('new-service');
      });

      it('should add a repo with all fields', () => {
        const newRepo: Repo = {
          id: 'repo-new',
          name: 'full-service',
          teamIds: ['team-1', 'team-2'],
          contributors: [{ personId: 'person-1' }, { personId: 'person-2' }],
          remoteUrl: 'https://github.com/acme/full',
          contextId: 'context-2',
          analysisSummary: 'A well-structured service',
        };

        addRepoMutation(ydoc, newRepo);

        const result = yDocToProject(ydoc);
        expect(result.repos[2].remoteUrl).toBe('https://github.com/acme/full');
        expect(result.repos[2].contextId).toBe('context-2');
        expect(result.repos[2].analysisSummary).toBe('A well-structured service');
        expect(result.repos[2].teamIds).toEqual(['team-1', 'team-2']);
        expect(result.repos[2].contributors).toEqual([{ personId: 'person-1' }, { personId: 'person-2' }]);
      });

      it('should add repo to empty repos array', () => {
        const emptyProject: Project = {
          ...createTestProject(),
          repos: [],
        };
        const emptyYdoc = projectToYDoc(emptyProject);

        addRepoMutation(emptyYdoc, {
          id: 'first-repo',
          name: 'first-service',
          teamIds: [],
          contributors: [],
        });

        const result = yDocToProject(emptyYdoc);
        expect(result.repos).toHaveLength(1);
        expect(result.repos[0].id).toBe('first-repo');
      });
    });

    describe('updateRepoMutation', () => {
      it('should update the name of an existing repo', () => {
        updateRepoMutation(ydoc, 'repo-1', { name: 'updated-order-service' });

        const result = yDocToProject(ydoc);
        expect(result.repos[0].name).toBe('updated-order-service');
      });

      it('should update remoteUrl', () => {
        updateRepoMutation(ydoc, 'repo-1', { remoteUrl: 'https://github.com/acme/order' });

        const result = yDocToProject(ydoc);
        expect(result.repos[0].remoteUrl).toBe('https://github.com/acme/order');
      });

      it('should update contextId', () => {
        updateRepoMutation(ydoc, 'repo-2', { contextId: 'context-2' });

        const result = yDocToProject(ydoc);
        expect(result.repos[1].contextId).toBe('context-2');
      });

      it('should not modify other repos', () => {
        updateRepoMutation(ydoc, 'repo-1', { name: 'Updated' });

        const result = yDocToProject(ydoc);
        expect(result.repos[1].name).toBe('payment-service');
      });

      it('should do nothing for non-existent repo id', () => {
        updateRepoMutation(ydoc, 'non-existent', { name: 'Updated' });

        const result = yDocToProject(ydoc);
        expect(result.repos).toHaveLength(2);
        expect(result.repos[0].name).toBe('order-service');
      });

      it('should clear optional field when set to undefined', () => {
        updateRepoMutation(ydoc, 'repo-2', { remoteUrl: undefined });

        const result = yDocToProject(ydoc);
        expect(result.repos[1].remoteUrl).toBeUndefined();
      });
    });

    describe('deleteRepoMutation', () => {
      it('should delete a repo by id', () => {
        deleteRepoMutation(ydoc, 'repo-1');

        const result = yDocToProject(ydoc);
        expect(result.repos).toHaveLength(1);
        expect(result.repos[0].id).toBe('repo-2');
      });

      it('should do nothing for non-existent repo id', () => {
        deleteRepoMutation(ydoc, 'non-existent');

        const result = yDocToProject(ydoc);
        expect(result.repos).toHaveLength(2);
      });

      it('should handle deleting all repos', () => {
        deleteRepoMutation(ydoc, 'repo-1');
        deleteRepoMutation(ydoc, 'repo-2');

        const result = yDocToProject(ydoc);
        expect(result.repos).toHaveLength(0);
      });
    });
  });

  describe('Person mutations', () => {
    describe('addPersonMutation', () => {
      it('should add a new person to the Y.Doc', () => {
        const newPerson: Person = {
          id: 'person-new',
          displayName: 'Charlie',
          emails: ['charlie@example.com'],
        };

        addPersonMutation(ydoc, newPerson);

        const result = yDocToProject(ydoc);
        expect(result.people).toHaveLength(3);
        expect(result.people[2].id).toBe('person-new');
        expect(result.people[2].displayName).toBe('Charlie');
        expect(result.people[2].emails).toEqual(['charlie@example.com']);
      });

      it('should add a person with teamIds', () => {
        const newPerson: Person = {
          id: 'person-new',
          displayName: 'Diana',
          emails: ['diana@example.com'],
          teamIds: ['team-1', 'team-2'],
        };

        addPersonMutation(ydoc, newPerson);

        const result = yDocToProject(ydoc);
        expect(result.people[2].teamIds).toEqual(['team-1', 'team-2']);
      });

      it('should add a person with multiple emails', () => {
        const newPerson: Person = {
          id: 'person-new',
          displayName: 'Eve',
          emails: ['eve@example.com', 'eve.work@company.com'],
        };

        addPersonMutation(ydoc, newPerson);

        const result = yDocToProject(ydoc);
        expect(result.people[2].emails).toEqual(['eve@example.com', 'eve.work@company.com']);
      });

      it('should add person to empty people array', () => {
        const emptyProject: Project = {
          ...createTestProject(),
          people: [],
        };
        const emptyYdoc = projectToYDoc(emptyProject);

        addPersonMutation(emptyYdoc, {
          id: 'first-person',
          displayName: 'First',
          emails: ['first@example.com'],
        });

        const result = yDocToProject(emptyYdoc);
        expect(result.people).toHaveLength(1);
        expect(result.people[0].id).toBe('first-person');
      });
    });

    describe('updatePersonMutation', () => {
      it('should update the displayName of an existing person', () => {
        updatePersonMutation(ydoc, 'person-1', { displayName: 'Alice Smith' });

        const result = yDocToProject(ydoc);
        expect(result.people[0].displayName).toBe('Alice Smith');
      });

      it('should update emails', () => {
        updatePersonMutation(ydoc, 'person-1', { emails: ['alice.new@example.com'] });

        const result = yDocToProject(ydoc);
        expect(result.people[0].emails).toEqual(['alice.new@example.com']);
      });

      it('should update teamIds', () => {
        updatePersonMutation(ydoc, 'person-1', { teamIds: ['team-2'] });

        const result = yDocToProject(ydoc);
        expect(result.people[0].teamIds).toEqual(['team-2']);
      });

      it('should not modify other people', () => {
        updatePersonMutation(ydoc, 'person-1', { displayName: 'Updated' });

        const result = yDocToProject(ydoc);
        expect(result.people[1].displayName).toBe('Bob');
      });

      it('should do nothing for non-existent person id', () => {
        updatePersonMutation(ydoc, 'non-existent', { displayName: 'Updated' });

        const result = yDocToProject(ydoc);
        expect(result.people).toHaveLength(2);
        expect(result.people[0].displayName).toBe('Alice');
      });

      it('should clear teamIds when set to undefined', () => {
        updatePersonMutation(ydoc, 'person-2', { teamIds: undefined });

        const result = yDocToProject(ydoc);
        expect(result.people[1].teamIds).toBeUndefined();
      });
    });

    describe('deletePersonMutation', () => {
      it('should delete a person by id', () => {
        deletePersonMutation(ydoc, 'person-1');

        const result = yDocToProject(ydoc);
        expect(result.people).toHaveLength(1);
        expect(result.people[0].id).toBe('person-2');
      });

      it('should do nothing for non-existent person id', () => {
        deletePersonMutation(ydoc, 'non-existent');

        const result = yDocToProject(ydoc);
        expect(result.people).toHaveLength(2);
      });

      it('should handle deleting all people', () => {
        deletePersonMutation(ydoc, 'person-1');
        deletePersonMutation(ydoc, 'person-2');

        const result = yDocToProject(ydoc);
        expect(result.people).toHaveLength(0);
      });

      it('should remove person from repo contributors when deleted', () => {
        deletePersonMutation(ydoc, 'person-1');

        const result = yDocToProject(ydoc);
        expect(result.repos[0].contributors).toEqual([]);
      });
    });
  });

  describe('undo integration', () => {
    it('should undo team addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addTeamMutation(ydoc, {
        id: 'new-team',
        name: 'New Team',
      });

      expect(yDocToProject(ydoc).teams).toHaveLength(3);

      undoManager.undo();

      expect(yDocToProject(ydoc).teams).toHaveLength(2);
    });

    it('should undo team update', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      updateTeamMutation(ydoc, 'team-1', { name: 'Changed Name' });

      expect(yDocToProject(ydoc).teams[0].name).toBe('Changed Name');

      undoManager.undo();

      expect(yDocToProject(ydoc).teams[0].name).toBe('Orders Team');
    });

    it('should undo team deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deleteTeamMutation(ydoc, 'team-1');

      expect(yDocToProject(ydoc).teams).toHaveLength(1);

      undoManager.undo();

      expect(yDocToProject(ydoc).teams).toHaveLength(2);
      expect(yDocToProject(ydoc).teams[0].id).toBe('team-1');
    });

    it('should undo repo addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addRepoMutation(ydoc, {
        id: 'new-repo',
        name: 'new-service',
        teamIds: [],
        contributors: [],
      });

      expect(yDocToProject(ydoc).repos).toHaveLength(3);

      undoManager.undo();

      expect(yDocToProject(ydoc).repos).toHaveLength(2);
    });

    it('should undo person deletion', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      deletePersonMutation(ydoc, 'person-1');

      expect(yDocToProject(ydoc).people).toHaveLength(1);

      undoManager.undo();

      expect(yDocToProject(ydoc).people).toHaveLength(2);
      expect(yDocToProject(ydoc).people[0].id).toBe('person-1');
    });

    it('should redo team addition', async () => {
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      addTeamMutation(ydoc, {
        id: 'new-team',
        name: 'New Team',
      });
      undoManager.undo();
      undoManager.redo();

      expect(yDocToProject(ydoc).teams).toHaveLength(3);
      expect(yDocToProject(ydoc).teams[2].id).toBe('new-team');
    });
  });
});
