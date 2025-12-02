import * as Y from 'yjs';
import type { Team, Repo, Person } from '../types';
import {
  populateTeamYMap,
  populateRepoYMap,
  populatePersonYMap,
} from './metadataSync';

// Team mutations

export function addTeamMutation(ydoc: Y.Doc, team: Team): void {
  const yProject = ydoc.getMap('project');
  const yTeams = yProject.get('teams') as Y.Array<Y.Map<unknown>>;

  const yTeam = new Y.Map<unknown>();
  populateTeamYMap(yTeam, team);
  yTeams.push([yTeam]);
}

export function updateTeamMutation(
  ydoc: Y.Doc,
  teamId: string,
  updates: Partial<Team>
): void {
  const yTeam = findTeamById(ydoc, teamId);
  if (!yTeam) return;

  ydoc.transact(() => {
    applyTeamUpdates(yTeam, updates);
  });
}

export function deleteTeamMutation(ydoc: Y.Doc, teamId: string): void {
  const yProject = ydoc.getMap('project');
  const yTeams = yProject.get('teams') as Y.Array<Y.Map<unknown>>;

  const index = findEntityIndexById(yTeams, teamId);
  if (index === -1) return;

  ydoc.transact(() => {
    yTeams.delete(index);
    clearTeamIdFromContexts(yProject, teamId);
  });
}

// Repo mutations

export function addRepoMutation(ydoc: Y.Doc, repo: Repo): void {
  const yProject = ydoc.getMap('project');
  const yRepos = yProject.get('repos') as Y.Array<Y.Map<unknown>>;

  const yRepo = new Y.Map<unknown>();
  populateRepoYMap(yRepo, repo);
  yRepos.push([yRepo]);
}

export function updateRepoMutation(
  ydoc: Y.Doc,
  repoId: string,
  updates: Partial<Repo>
): void {
  const yRepo = findRepoById(ydoc, repoId);
  if (!yRepo) return;

  ydoc.transact(() => {
    applyRepoUpdates(yRepo, updates);
  });
}

export function deleteRepoMutation(ydoc: Y.Doc, repoId: string): void {
  const yProject = ydoc.getMap('project');
  const yRepos = yProject.get('repos') as Y.Array<Y.Map<unknown>>;

  const index = findEntityIndexById(yRepos, repoId);
  if (index === -1) return;

  yRepos.delete(index);
}

// Person mutations

export function addPersonMutation(ydoc: Y.Doc, person: Person): void {
  const yProject = ydoc.getMap('project');
  const yPeople = yProject.get('people') as Y.Array<Y.Map<unknown>>;

  const yPerson = new Y.Map<unknown>();
  populatePersonYMap(yPerson, person);
  yPeople.push([yPerson]);
}

export function updatePersonMutation(
  ydoc: Y.Doc,
  personId: string,
  updates: Partial<Person>
): void {
  const yPerson = findPersonById(ydoc, personId);
  if (!yPerson) return;

  ydoc.transact(() => {
    applyPersonUpdates(yPerson, updates);
  });
}

export function deletePersonMutation(ydoc: Y.Doc, personId: string): void {
  const yProject = ydoc.getMap('project');
  const yPeople = yProject.get('people') as Y.Array<Y.Map<unknown>>;

  const index = findEntityIndexById(yPeople, personId);
  if (index === -1) return;

  ydoc.transact(() => {
    yPeople.delete(index);
    removePersonFromRepoContributors(yProject, personId);
  });
}

// Helper functions

function findTeamById(ydoc: Y.Doc, teamId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yTeams = yProject.get('teams') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yTeams.length; i++) {
    const yTeam = yTeams.get(i);
    if (yTeam.get('id') === teamId) {
      return yTeam;
    }
  }
  return null;
}

function findRepoById(ydoc: Y.Doc, repoId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yRepos = yProject.get('repos') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yRepos.length; i++) {
    const yRepo = yRepos.get(i);
    if (yRepo.get('id') === repoId) {
      return yRepo;
    }
  }
  return null;
}

function findPersonById(ydoc: Y.Doc, personId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yPeople = yProject.get('people') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yPeople.length; i++) {
    const yPerson = yPeople.get(i);
    if (yPerson.get('id') === personId) {
      return yPerson;
    }
  }
  return null;
}

function findEntityIndexById(
  yArray: Y.Array<Y.Map<unknown>>,
  entityId: string
): number {
  for (let i = 0; i < yArray.length; i++) {
    const yEntity = yArray.get(i);
    if (yEntity.get('id') === entityId) {
      return i;
    }
  }
  return -1;
}

function applyTeamUpdates(yTeam: Y.Map<unknown>, updates: Partial<Team>): void {
  if ('name' in updates) {
    yTeam.set('name', updates.name);
  }

  if ('jiraBoard' in updates) {
    yTeam.set('jiraBoard', updates.jiraBoard ?? null);
  }

  if ('topologyType' in updates) {
    yTeam.set('topologyType', updates.topologyType ?? null);
  }
}

function applyRepoUpdates(yRepo: Y.Map<unknown>, updates: Partial<Repo>): void {
  if ('name' in updates) {
    yRepo.set('name', updates.name);
  }

  if ('remoteUrl' in updates) {
    yRepo.set('remoteUrl', updates.remoteUrl ?? null);
  }

  if ('contextId' in updates) {
    yRepo.set('contextId', updates.contextId ?? null);
  }

  if ('analysisSummary' in updates) {
    yRepo.set('analysisSummary', updates.analysisSummary ?? null);
  }
}

function applyPersonUpdates(
  yPerson: Y.Map<unknown>,
  updates: Partial<Person>
): void {
  if ('displayName' in updates) {
    yPerson.set('displayName', updates.displayName);
  }

  if ('emails' in updates && updates.emails) {
    const yEmails = new Y.Array<string>();
    yEmails.push(updates.emails);
    yPerson.set('emails', yEmails);
  }

  if ('teamIds' in updates) {
    if (updates.teamIds) {
      const yTeamIds = new Y.Array<string>();
      yTeamIds.push(updates.teamIds);
      yPerson.set('teamIds', yTeamIds);
    } else {
      yPerson.set('teamIds', null);
    }
  }
}

function clearTeamIdFromContexts(
  yProject: Y.Map<unknown>,
  teamId: string
): void {
  const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yContexts.length; i++) {
    const yContext = yContexts.get(i);
    if (yContext.get('teamId') === teamId) {
      yContext.set('teamId', null);
    }
  }
}

function removePersonFromRepoContributors(
  yProject: Y.Map<unknown>,
  personId: string
): void {
  const yRepos = yProject.get('repos') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yRepos.length; i++) {
    const yRepo = yRepos.get(i);
    const yContributors = yRepo.get('contributors') as Y.Array<Y.Map<unknown>>;

    // Find and remove contributors with this personId
    for (let j = yContributors.length - 1; j >= 0; j--) {
      const yContributor = yContributors.get(j);
      if (yContributor.get('personId') === personId) {
        yContributors.delete(j);
      }
    }
  }
}
