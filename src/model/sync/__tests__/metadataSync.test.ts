import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import {
  repoToYMap,
  yMapToRepo,
  personToYMap,
  yMapToPerson,
  teamToYMap,
  yMapToTeam,
} from '../metadataSync';
import type { Repo, Person, Team } from '../../types';

describe('metadataSync', () => {
  describe('repoToYMap / yMapToRepo', () => {
    it('converts a repo with required fields only', () => {
      const repo: Repo = {
        id: 'repo-1',
        name: 'order-service',
        teamIds: ['team-1'],
        contributors: [{ personId: 'person-1' }],
      };

      const yMap = repoToYMap(repo);

      expect(yMap.get('id')).toBe('repo-1');
      expect(yMap.get('name')).toBe('order-service');
      expect(yMap.get('remoteUrl')).toBeNull();
      expect(yMap.get('contextId')).toBeNull();
      expect(yMap.get('analysisSummary')).toBeNull();

      const teamIds = yMap.get('teamIds') as Y.Array<string>;
      expect(teamIds.length).toBe(1);
      expect(teamIds.get(0)).toBe('team-1');

      const contributors = yMap.get('contributors') as Y.Array<Y.Map<unknown>>;
      expect(contributors.length).toBe(1);
      expect(contributors.get(0).get('personId')).toBe('person-1');
    });

    it('converts a repo with all fields populated', () => {
      const repo: Repo = {
        id: 'repo-2',
        name: 'billing-api',
        remoteUrl: 'https://github.com/acme/billing-api',
        contextId: 'ctx-billing',
        teamIds: ['team-1', 'team-2'],
        contributors: [{ personId: 'p1' }, { personId: 'p2' }],
        analysisSummary: 'Well-structured microservice',
      };

      const yMap = repoToYMap(repo);

      expect(yMap.get('remoteUrl')).toBe('https://github.com/acme/billing-api');
      expect(yMap.get('contextId')).toBe('ctx-billing');
      expect(yMap.get('analysisSummary')).toBe('Well-structured microservice');
    });

    it('round-trips a repo', () => {
      const original: Repo = {
        id: 'repo-rt',
        name: 'inventory',
        remoteUrl: 'git@github.com:acme/inventory.git',
        contextId: 'ctx-inv',
        teamIds: ['t1', 't2'],
        contributors: [{ personId: 'p1' }],
        analysisSummary: 'Legacy codebase',
      };

      const result = yMapToRepo(repoToYMap(original));
      expect(result).toEqual(original);
    });

    it('round-trips a minimal repo', () => {
      const original: Repo = {
        id: 'repo-min',
        name: 'minimal',
        teamIds: [],
        contributors: [],
      };

      const result = yMapToRepo(repoToYMap(original));
      expect(result).toEqual(original);
    });
  });

  describe('personToYMap / yMapToPerson', () => {
    it('converts a person with required fields only', () => {
      const person: Person = {
        id: 'person-1',
        displayName: 'Alice Smith',
        emails: ['alice@example.com'],
      };

      const yMap = personToYMap(person);

      expect(yMap.get('id')).toBe('person-1');
      expect(yMap.get('displayName')).toBe('Alice Smith');
      expect(yMap.get('teamIds')).toBeNull();

      const emails = yMap.get('emails') as Y.Array<string>;
      expect(emails.length).toBe(1);
      expect(emails.get(0)).toBe('alice@example.com');
    });

    it('converts a person with all fields populated', () => {
      const person: Person = {
        id: 'person-2',
        displayName: 'Bob Jones',
        emails: ['bob@work.com', 'bob@personal.com'],
        teamIds: ['team-1', 'team-2'],
      };

      const yMap = personToYMap(person);

      const teamIds = yMap.get('teamIds') as Y.Array<string>;
      expect(teamIds.length).toBe(2);
      expect(teamIds.get(0)).toBe('team-1');
    });

    it('round-trips a person', () => {
      const original: Person = {
        id: 'person-rt',
        displayName: 'Charlie Brown',
        emails: ['charlie@example.com', 'cb@other.com'],
        teamIds: ['t1'],
      };

      const result = yMapToPerson(personToYMap(original));
      expect(result).toEqual(original);
    });

    it('round-trips a minimal person', () => {
      const original: Person = {
        id: 'person-min',
        displayName: 'Minimal Person',
        emails: [],
      };

      const result = yMapToPerson(personToYMap(original));
      expect(result).toEqual(original);
    });
  });

  describe('teamToYMap / yMapToTeam', () => {
    it('converts a team with required fields only', () => {
      const team: Team = {
        id: 'team-1',
        name: 'Platform Team',
      };

      const yMap = teamToYMap(team);

      expect(yMap.get('id')).toBe('team-1');
      expect(yMap.get('name')).toBe('Platform Team');
      expect(yMap.get('jiraBoard')).toBeNull();
      expect(yMap.get('topologyType')).toBeNull();
    });

    it('converts a team with all fields populated', () => {
      const team: Team = {
        id: 'team-2',
        name: 'Orders Squad',
        jiraBoard: 'https://jira.example.com/boards/123',
        topologyType: 'stream-aligned',
      };

      const yMap = teamToYMap(team);

      expect(yMap.get('jiraBoard')).toBe('https://jira.example.com/boards/123');
      expect(yMap.get('topologyType')).toBe('stream-aligned');
    });

    it('handles all topology types', () => {
      const topologyTypes: Team['topologyType'][] = [
        'stream-aligned',
        'platform',
        'enabling',
        'complicated-subsystem',
        'unknown',
      ];

      for (const topologyType of topologyTypes) {
        const team: Team = { id: 't', name: 'T', topologyType };
        const yMap = teamToYMap(team);
        expect(yMap.get('topologyType')).toBe(topologyType);
      }
    });

    it('round-trips a team', () => {
      const original: Team = {
        id: 'team-rt',
        name: 'Data Team',
        jiraBoard: 'DATA',
        topologyType: 'platform',
      };

      const result = yMapToTeam(teamToYMap(original));
      expect(result).toEqual(original);
    });

    it('round-trips a minimal team', () => {
      const original: Team = {
        id: 'team-min',
        name: 'Minimal',
      };

      const result = yMapToTeam(teamToYMap(original));
      expect(result).toEqual(original);
    });
  });
});
