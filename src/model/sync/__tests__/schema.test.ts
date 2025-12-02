/**
 * Schema Type Tests
 *
 * These tests verify that the Yjs schema types align with the Project structure
 * from types.ts. This ensures type safety when converting between Project and Yjs.
 */

import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import type {
  YjsProject,
  YjsBoundedContext,
  YjsRelationship,
  YjsGroup,
  YjsRepo,
  YjsPerson,
  YjsTeam,
  YjsFlowStageMarker,
  YjsUser,
  YjsUserNeed,
  YjsUserNeedConnection,
  YjsNeedContextConnection,
  YjsTemporal,
  YjsTemporalKeyframe,
  YjsViewConfig,
  YjsPositions,
  YjsCodeSize,
  YjsIssue,
  YjsContributorRef,
} from '../schema';
import { isYMap, isYArray, isYDoc } from '../schema';
import type {
  Project,
  BoundedContext,
  Relationship,
  Group,
  Repo,
  Person,
  Team,
  FlowStageMarker,
  User,
  UserNeed,
  UserNeedConnection,
  NeedContextConnection,
  TemporalKeyframe,
  Issue,
  ContributorRef,
} from '../../types';

describe('Yjs Schema Type Definitions', () => {
  describe('Type Exports', () => {
    it('exports YjsProject type', () => {
      // Type assertion test - this will fail to compile if type doesn't exist
      const assertType: YjsProject = {} as YjsProject;
      expect(assertType).toBeDefined();
    });

    it('exports YjsBoundedContext type', () => {
      const assertType: YjsBoundedContext = {} as YjsBoundedContext;
      expect(assertType).toBeDefined();
    });

    it('exports YjsRelationship type', () => {
      const assertType: YjsRelationship = {} as YjsRelationship;
      expect(assertType).toBeDefined();
    });

    it('exports YjsGroup type', () => {
      const assertType: YjsGroup = {} as YjsGroup;
      expect(assertType).toBeDefined();
    });

    it('exports YjsRepo type', () => {
      const assertType: YjsRepo = {} as YjsRepo;
      expect(assertType).toBeDefined();
    });

    it('exports YjsPerson type', () => {
      const assertType: YjsPerson = {} as YjsPerson;
      expect(assertType).toBeDefined();
    });

    it('exports YjsTeam type', () => {
      const assertType: YjsTeam = {} as YjsTeam;
      expect(assertType).toBeDefined();
    });

    it('exports YjsFlowStageMarker type', () => {
      const assertType: YjsFlowStageMarker = {} as YjsFlowStageMarker;
      expect(assertType).toBeDefined();
    });

    it('exports YjsUser type', () => {
      const assertType: YjsUser = {} as YjsUser;
      expect(assertType).toBeDefined();
    });

    it('exports YjsUserNeed type', () => {
      const assertType: YjsUserNeed = {} as YjsUserNeed;
      expect(assertType).toBeDefined();
    });

    it('exports YjsUserNeedConnection type', () => {
      const assertType: YjsUserNeedConnection = {} as YjsUserNeedConnection;
      expect(assertType).toBeDefined();
    });

    it('exports YjsNeedContextConnection type', () => {
      const assertType: YjsNeedContextConnection =
        {} as YjsNeedContextConnection;
      expect(assertType).toBeDefined();
    });

    it('exports YjsTemporal type', () => {
      const assertType: YjsTemporal = {} as YjsTemporal;
      expect(assertType).toBeDefined();
    });

    it('exports YjsTemporalKeyframe type', () => {
      const assertType: YjsTemporalKeyframe = {} as YjsTemporalKeyframe;
      expect(assertType).toBeDefined();
    });

    it('exports YjsViewConfig type', () => {
      const assertType: YjsViewConfig = {} as YjsViewConfig;
      expect(assertType).toBeDefined();
    });

    it('exports YjsPositions type', () => {
      const assertType: YjsPositions = {} as YjsPositions;
      expect(assertType).toBeDefined();
    });

    it('exports YjsCodeSize type', () => {
      const assertType: YjsCodeSize = {} as YjsCodeSize;
      expect(assertType).toBeDefined();
    });

    it('exports YjsIssue type', () => {
      const assertType: YjsIssue = {} as YjsIssue;
      expect(assertType).toBeDefined();
    });

    it('exports YjsContributorRef type', () => {
      const assertType: YjsContributorRef = {} as YjsContributorRef;
      expect(assertType).toBeDefined();
    });
  });

  describe('Type Guards', () => {
    it('isYMap correctly identifies Y.Map instances', () => {
      const ymap = new Y.Map();
      const notYMap = {};

      expect(isYMap(ymap)).toBe(true);
      expect(isYMap(notYMap)).toBe(false);
      expect(isYMap(null)).toBe(false);
      expect(isYMap(undefined)).toBe(false);
    });

    it('isYArray correctly identifies Y.Array instances', () => {
      const yarray = new Y.Array();
      const notYArray: unknown[] = [];

      expect(isYArray(yarray)).toBe(true);
      expect(isYArray(notYArray)).toBe(false);
      expect(isYArray(null)).toBe(false);
      expect(isYArray(undefined)).toBe(false);
    });

    it('isYDoc correctly identifies Y.Doc instances', () => {
      const ydoc = new Y.Doc();
      const notYDoc = {};

      expect(isYDoc(ydoc)).toBe(true);
      expect(isYDoc(notYDoc)).toBe(false);
      expect(isYDoc(null)).toBe(false);
      expect(isYDoc(undefined)).toBe(false);
    });
  });

  describe('Structural Alignment with Project Types', () => {
    it('YjsBoundedContext scalar fields match BoundedContext', () => {
      // Create a minimal BoundedContext to verify structure
      const context: BoundedContext = {
        id: 'test-id',
        name: 'Test Context',
        evolutionStage: 'custom-built',
        positions: {
          strategic: { x: 50 },
          flow: { x: 50 },
          distillation: { x: 50, y: 50 },
          shared: { y: 50 },
        },
      };

      // Verify all scalar fields can be represented
      const yjsContext: Partial<YjsBoundedContext> = {
        id: context.id,
        name: context.name,
        evolutionStage: context.evolutionStage,
        purpose: context.purpose ?? null,
        strategicClassification: context.strategicClassification ?? null,
        ownership: context.ownership ?? null,
        boundaryIntegrity: context.boundaryIntegrity ?? null,
        boundaryNotes: context.boundaryNotes ?? null,
        isLegacy: context.isLegacy,
        notes: context.notes ?? null,
        teamId: context.teamId ?? null,
      };

      expect(yjsContext.id).toBe(context.id);
      expect(yjsContext.name).toBe(context.name);
      expect(yjsContext.evolutionStage).toBe(context.evolutionStage);
    });

    it('YjsRelationship fields match Relationship', () => {
      const relationship: Relationship = {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'customer-supplier',
      };

      const yjsRelationship: YjsRelationship = {
        id: relationship.id,
        fromContextId: relationship.fromContextId,
        toContextId: relationship.toContextId,
        pattern: relationship.pattern,
        communicationMode: relationship.communicationMode ?? null,
        description: relationship.description ?? null,
      };

      expect(yjsRelationship.id).toBe(relationship.id);
      expect(yjsRelationship.fromContextId).toBe(relationship.fromContextId);
      expect(yjsRelationship.toContextId).toBe(relationship.toContextId);
      expect(yjsRelationship.pattern).toBe(relationship.pattern);
    });

    it('YjsGroup fields match Group', () => {
      const group: Group = {
        id: 'grp-1',
        label: 'Data Platform',
        contextIds: ['ctx-1', 'ctx-2'],
      };

      // YjsGroup uses Y.Array for contextIds, so we verify structure
      const yjsGroup: Omit<YjsGroup, 'contextIds'> & {
        contextIds: string[];
      } = {
        id: group.id,
        label: group.label,
        color: group.color ?? null,
        contextIds: group.contextIds,
        notes: group.notes ?? null,
      };

      expect(yjsGroup.id).toBe(group.id);
      expect(yjsGroup.label).toBe(group.label);
      expect(yjsGroup.contextIds).toEqual(group.contextIds);
    });

    it('YjsUser fields match User', () => {
      const user: User = {
        id: 'user-1',
        name: 'Customer',
        position: 75,
      };

      const yjsUser: YjsUser = {
        id: user.id,
        name: user.name,
        description: user.description ?? null,
        position: user.position,
        isExternal: user.isExternal,
      };

      expect(yjsUser.id).toBe(user.id);
      expect(yjsUser.name).toBe(user.name);
      expect(yjsUser.position).toBe(user.position);
    });

    it('YjsUserNeed fields match UserNeed', () => {
      const userNeed: UserNeed = {
        id: 'need-1',
        name: 'View account history',
        position: 50,
      };

      const yjsUserNeed: YjsUserNeed = {
        id: userNeed.id,
        name: userNeed.name,
        description: userNeed.description ?? null,
        position: userNeed.position,
        visibility: userNeed.visibility,
      };

      expect(yjsUserNeed.id).toBe(userNeed.id);
      expect(yjsUserNeed.name).toBe(userNeed.name);
      expect(yjsUserNeed.position).toBe(userNeed.position);
    });

    it('YjsIssue fields match Issue', () => {
      const issue: Issue = {
        id: 'issue-1',
        title: 'High coupling',
        severity: 'warning',
      };

      const yjsIssue: YjsIssue = {
        id: issue.id,
        title: issue.title,
        description: issue.description ?? null,
        severity: issue.severity,
      };

      expect(yjsIssue.id).toBe(issue.id);
      expect(yjsIssue.title).toBe(issue.title);
      expect(yjsIssue.severity).toBe(issue.severity);
    });

    it('YjsContributorRef fields match ContributorRef', () => {
      const contributor: ContributorRef = {
        personId: 'person-1',
      };

      const yjsContributor: YjsContributorRef = {
        personId: contributor.personId,
      };

      expect(yjsContributor.personId).toBe(contributor.personId);
    });
  });

  describe('Nested Y.Map Structure', () => {
    it('creates nested Y.Map for positions', () => {
      const ydoc = new Y.Doc();
      const ycontext = ydoc.getMap('context');

      // Create nested positions structure
      const ypositions = new Y.Map();

      const ystrategic = new Y.Map();
      ystrategic.set('x', 50);
      ypositions.set('strategic', ystrategic);

      const yflow = new Y.Map();
      yflow.set('x', 75);
      ypositions.set('flow', yflow);

      const ydistillation = new Y.Map();
      ydistillation.set('x', 60);
      ydistillation.set('y', 40);
      ypositions.set('distillation', ydistillation);

      const yshared = new Y.Map();
      yshared.set('y', 30);
      ypositions.set('shared', yshared);

      ycontext.set('positions', ypositions);

      // Verify structure
      const retrievedPositions = ycontext.get('positions') as Y.Map<unknown>;
      expect(isYMap(retrievedPositions)).toBe(true);

      const retrievedFlow = retrievedPositions.get('flow') as Y.Map<unknown>;
      expect(isYMap(retrievedFlow)).toBe(true);
      expect(retrievedFlow.get('x')).toBe(75);

      const retrievedDistillation = retrievedPositions.get(
        'distillation'
      ) as Y.Map<unknown>;
      expect(isYMap(retrievedDistillation)).toBe(true);
      expect(retrievedDistillation.get('x')).toBe(60);
      expect(retrievedDistillation.get('y')).toBe(40);
    });

    it('creates nested Y.Map for temporal keyframe positions', () => {
      const ydoc = new Y.Doc();
      const ykeyframe = ydoc.getMap('keyframe');

      // Create positions map with dynamic contextId keys
      const ypositions = new Y.Map();

      const ypos1 = new Y.Map();
      ypos1.set('x', 10);
      ypos1.set('y', 20);
      ypositions.set('ctx-1', ypos1);

      const ypos2 = new Y.Map();
      ypos2.set('x', 30);
      ypos2.set('y', 40);
      ypositions.set('ctx-2', ypos2);

      ykeyframe.set('positions', ypositions);

      // Verify structure
      const retrievedPositions = ykeyframe.get('positions') as Y.Map<unknown>;
      expect(isYMap(retrievedPositions)).toBe(true);

      const retrievedPos1 = retrievedPositions.get('ctx-1') as Y.Map<unknown>;
      expect(isYMap(retrievedPos1)).toBe(true);
      expect(retrievedPos1.get('x')).toBe(10);
      expect(retrievedPos1.get('y')).toBe(20);

      const retrievedPos2 = retrievedPositions.get('ctx-2') as Y.Map<unknown>;
      expect(isYMap(retrievedPos2)).toBe(true);
      expect(retrievedPos2.get('x')).toBe(30);
      expect(retrievedPos2.get('y')).toBe(40);
    });

    it('creates nested Y.Map for codeSize', () => {
      const ydoc = new Y.Doc();
      const ycontext = ydoc.getMap('context');

      const ycodeSize = new Y.Map();
      ycodeSize.set('loc', 5000);
      ycodeSize.set('bucket', 'medium');

      ycontext.set('codeSize', ycodeSize);

      // Verify structure
      const retrievedCodeSize = ycontext.get('codeSize') as Y.Map<unknown>;
      expect(isYMap(retrievedCodeSize)).toBe(true);
      expect(retrievedCodeSize.get('loc')).toBe(5000);
      expect(retrievedCodeSize.get('bucket')).toBe('medium');
    });
  });

  describe('Array Structures', () => {
    it('creates Y.Array for contexts', () => {
      const ydoc = new Y.Doc();
      const yproject = ydoc.getMap('project');

      const ycontexts = new Y.Array<Y.Map<unknown>>();

      const ycontext1 = new Y.Map();
      ycontext1.set('id', 'ctx-1');
      ycontext1.set('name', 'Auth Service');
      ycontexts.push([ycontext1]);

      const ycontext2 = new Y.Map();
      ycontext2.set('id', 'ctx-2');
      ycontext2.set('name', 'Payment Service');
      ycontexts.push([ycontext2]);

      yproject.set('contexts', ycontexts);

      // Verify structure
      const retrievedContexts = yproject.get('contexts') as Y.Array<
        Y.Map<unknown>
      >;
      expect(isYArray(retrievedContexts)).toBe(true);
      expect(retrievedContexts.length).toBe(2);

      const retrievedContext1 = retrievedContexts.get(0);
      expect(isYMap(retrievedContext1)).toBe(true);
      expect(retrievedContext1.get('id')).toBe('ctx-1');
      expect(retrievedContext1.get('name')).toBe('Auth Service');
    });

    it('creates Y.Array for relationships', () => {
      const ydoc = new Y.Doc();
      const yproject = ydoc.getMap('project');

      const yrelationships = new Y.Array<Y.Map<unknown>>();

      const yrel = new Y.Map();
      yrel.set('id', 'rel-1');
      yrel.set('fromContextId', 'ctx-1');
      yrel.set('toContextId', 'ctx-2');
      yrel.set('pattern', 'customer-supplier');
      yrelationships.push([yrel]);

      yproject.set('relationships', yrelationships);

      // Verify structure
      const retrievedRelationships = yproject.get(
        'relationships'
      ) as Y.Array<Y.Map<unknown>>;
      expect(isYArray(retrievedRelationships)).toBe(true);
      expect(retrievedRelationships.length).toBe(1);

      const retrievedRel = retrievedRelationships.get(0);
      expect(isYMap(retrievedRel)).toBe(true);
      expect(retrievedRel.get('pattern')).toBe('customer-supplier');
    });

    it('creates Y.Array for issues within a context', () => {
      const ydoc = new Y.Doc();
      const ycontext = ydoc.getMap('context');

      const yissues = new Y.Array<Y.Map<unknown>>();

      const yissue1 = new Y.Map();
      yissue1.set('id', 'issue-1');
      yissue1.set('title', 'High coupling');
      yissue1.set('severity', 'warning');
      yissues.push([yissue1]);

      const yissue2 = new Y.Map();
      yissue2.set('id', 'issue-2');
      yissue2.set('title', 'Missing tests');
      yissue2.set('severity', 'info');
      yissues.push([yissue2]);

      ycontext.set('issues', yissues);

      // Verify structure
      const retrievedIssues = ycontext.get('issues') as Y.Array<
        Y.Map<unknown>
      >;
      expect(isYArray(retrievedIssues)).toBe(true);
      expect(retrievedIssues.length).toBe(2);

      const retrievedIssue1 = retrievedIssues.get(0);
      expect(isYMap(retrievedIssue1)).toBe(true);
      expect(retrievedIssue1.get('title')).toBe('High coupling');
      expect(retrievedIssue1.get('severity')).toBe('warning');
    });

    it('creates Y.Array for primitive string arrays', () => {
      const ydoc = new Y.Doc();
      const yperson = ydoc.getMap('person');

      const yemails = new Y.Array<string>();
      yemails.push(['alice@example.com', 'alice.smith@example.com']);

      yperson.set('emails', yemails);

      // Verify structure
      const retrievedEmails = yperson.get('emails') as Y.Array<string>;
      expect(isYArray(retrievedEmails)).toBe(true);
      expect(retrievedEmails.length).toBe(2);
      expect(retrievedEmails.get(0)).toBe('alice@example.com');
      expect(retrievedEmails.get(1)).toBe('alice.smith@example.com');
    });
  });

  describe('Optional and Nullable Fields', () => {
    it('handles null for absent optional fields', () => {
      const ydoc = new Y.Doc();
      const ycontext = ydoc.getMap('context');

      ycontext.set('id', 'ctx-1');
      ycontext.set('name', 'Test Context');
      ycontext.set('purpose', null); // Absent optional field
      ycontext.set('notes', null);

      expect(ycontext.get('id')).toBe('ctx-1');
      expect(ycontext.get('purpose')).toBeNull();
      expect(ycontext.get('notes')).toBeNull();
    });

    it('preserves defined optional values', () => {
      const ydoc = new Y.Doc();
      const ycontext = ydoc.getMap('context');

      ycontext.set('id', 'ctx-1');
      ycontext.set('name', 'Test Context');
      ycontext.set('purpose', 'Handles authentication');
      ycontext.set('notes', 'Legacy system');

      expect(ycontext.get('purpose')).toBe('Handles authentication');
      expect(ycontext.get('notes')).toBe('Legacy system');
    });
  });

  describe('Project Root Structure', () => {
    it('creates complete project structure', () => {
      const ydoc = new Y.Doc();
      const yproject = ydoc.getMap('project');

      // Scalar fields
      yproject.set('id', 'proj-1');
      yproject.set('name', 'Test Project');
      yproject.set('version', 1);

      // Entity arrays
      yproject.set('contexts', new Y.Array<Y.Map<unknown>>());
      yproject.set('relationships', new Y.Array<Y.Map<unknown>>());
      yproject.set('repos', new Y.Array<Y.Map<unknown>>());
      yproject.set('people', new Y.Array<Y.Map<unknown>>());
      yproject.set('teams', new Y.Array<Y.Map<unknown>>());
      yproject.set('groups', new Y.Array<Y.Map<unknown>>());
      yproject.set('users', new Y.Array<Y.Map<unknown>>());
      yproject.set('userNeeds', new Y.Array<Y.Map<unknown>>());
      yproject.set('userNeedConnections', new Y.Array<Y.Map<unknown>>());
      yproject.set('needContextConnections', new Y.Array<Y.Map<unknown>>());

      // Nested config
      const yviewConfig = new Y.Map();
      yviewConfig.set('flowStages', new Y.Array<Y.Map<unknown>>());
      yproject.set('viewConfig', yviewConfig);

      // Verify structure
      expect(yproject.get('id')).toBe('proj-1');
      expect(yproject.get('name')).toBe('Test Project');
      expect(isYArray(yproject.get('contexts'))).toBe(true);
      expect(isYArray(yproject.get('relationships'))).toBe(true);
      expect(isYMap(yproject.get('viewConfig'))).toBe(true);

      const retrievedViewConfig = yproject.get('viewConfig') as Y.Map<unknown>;
      expect(isYArray(retrievedViewConfig.get('flowStages'))).toBe(true);
    });
  });
});
