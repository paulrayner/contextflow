import * as Y from 'yjs';
import type { Repo, Person, Team, ContributorRef } from '../types';

export function populateRepoYMap(yMap: Y.Map<unknown>, repo: Repo): void {
  yMap.set('id', repo.id);
  yMap.set('name', repo.name);
  yMap.set('remoteUrl', repo.remoteUrl ?? null);
  yMap.set('contextId', repo.contextId ?? null);
  yMap.set('analysisSummary', repo.analysisSummary ?? null);

  const yTeamIds = new Y.Array<string>();
  yTeamIds.push(repo.teamIds);
  yMap.set('teamIds', yTeamIds);

  const yContributors = new Y.Array<Y.Map<unknown>>();
  for (const contributor of repo.contributors) {
    const yContributor = new Y.Map<unknown>();
    yContributor.set('personId', contributor.personId);
    yContributors.push([yContributor]);
  }
  yMap.set('contributors', yContributors);
}

export function repoToYMap(repo: Repo): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('repo');
  populateRepoYMap(yMap, repo);
  return yMap;
}

export function yMapToRepo(yMap: Y.Map<unknown>): Repo {
  const yTeamIds = yMap.get('teamIds') as Y.Array<string>;
  const teamIds: string[] = [];
  for (let i = 0; i < yTeamIds.length; i++) {
    teamIds.push(yTeamIds.get(i));
  }

  const yContributors = yMap.get('contributors') as Y.Array<Y.Map<unknown>>;
  const contributors: ContributorRef[] = [];
  for (let i = 0; i < yContributors.length; i++) {
    const yContributor = yContributors.get(i);
    contributors.push({ personId: yContributor.get('personId') as string });
  }

  const repo: Repo = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    teamIds,
    contributors,
  };

  const remoteUrl = yMap.get('remoteUrl');
  if (remoteUrl !== null) {
    repo.remoteUrl = remoteUrl as string;
  }

  const contextId = yMap.get('contextId');
  if (contextId !== null) {
    repo.contextId = contextId as string;
  }

  const analysisSummary = yMap.get('analysisSummary');
  if (analysisSummary !== null) {
    repo.analysisSummary = analysisSummary as string;
  }

  return repo;
}

export function populatePersonYMap(yMap: Y.Map<unknown>, person: Person): void {
  yMap.set('id', person.id);
  yMap.set('displayName', person.displayName);

  const yEmails = new Y.Array<string>();
  yEmails.push(person.emails);
  yMap.set('emails', yEmails);

  if (person.teamIds) {
    const yTeamIds = new Y.Array<string>();
    yTeamIds.push(person.teamIds);
    yMap.set('teamIds', yTeamIds);
  } else {
    yMap.set('teamIds', null);
  }
}

export function personToYMap(person: Person): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('person');
  populatePersonYMap(yMap, person);
  return yMap;
}

export function yMapToPerson(yMap: Y.Map<unknown>): Person {
  const yEmails = yMap.get('emails') as Y.Array<string>;
  const emails: string[] = [];
  for (let i = 0; i < yEmails.length; i++) {
    emails.push(yEmails.get(i));
  }

  const person: Person = {
    id: yMap.get('id') as string,
    displayName: yMap.get('displayName') as string,
    emails,
  };

  const yTeamIds = yMap.get('teamIds');
  if (yTeamIds !== null) {
    const teamIds: string[] = [];
    const yArr = yTeamIds as Y.Array<string>;
    for (let i = 0; i < yArr.length; i++) {
      teamIds.push(yArr.get(i));
    }
    person.teamIds = teamIds;
  }

  return person;
}

export function populateTeamYMap(yMap: Y.Map<unknown>, team: Team): void {
  yMap.set('id', team.id);
  yMap.set('name', team.name);
  yMap.set('jiraBoard', team.jiraBoard ?? null);
  yMap.set('topologyType', team.topologyType ?? null);
}

export function teamToYMap(team: Team): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('team');
  populateTeamYMap(yMap, team);
  return yMap;
}

export function yMapToTeam(yMap: Y.Map<unknown>): Team {
  const team: Team = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
  };

  const jiraBoard = yMap.get('jiraBoard');
  if (jiraBoard !== null) {
    team.jiraBoard = jiraBoard as string;
  }

  const topologyType = yMap.get('topologyType');
  if (topologyType !== null) {
    team.topologyType = topologyType as Team['topologyType'];
  }

  return team;
}
