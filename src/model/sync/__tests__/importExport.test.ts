import { describe, it, expect } from 'vitest';
import { projectToYDoc, yDocToProject } from '../projectSync';
import { validateImportedProject, checkImportConflict, importProjectAsNew } from '../../actions/projectActions';
import type { Project, BoundedContext, Relationship, Group, Repo, Person, Team, User, UserNeed, UserNeedConnection, NeedContextConnection, FlowStageMarker } from '../../types';
import emptyProject from '../../../../examples/empty.project.json';
import sampleProject from '../../../../examples/sample.project.json';

// Performance test configuration
const LARGE_PROJECT_CONTEXTS = 100;
const LARGE_PROJECT_RELATIONSHIPS_MULTIPLIER = 5; // ~500 relationships
const LARGE_PROJECT_REPOS = 80;
const LARGE_PROJECT_PEOPLE = 50;
const LARGE_PROJECT_TEAMS = 15;
const LARGE_PROJECT_GROUPS = 20;
const LARGE_PROJECT_USERS = 10;
const LARGE_PROJECT_USER_NEEDS = 25;
const LARGE_PROJECT_FLOW_STAGES = 8;

// Performance thresholds in milliseconds
const JSON_ROUNDTRIP_THRESHOLD_MS = 100;
const YDOC_ROUNDTRIP_THRESHOLD_MS = 500;
const VALIDATION_THRESHOLD_MS = 50;

/**
 * Generates a large project for performance testing.
 * Creates realistic entity counts with proper relationships.
 */
function generateLargeProject(): Project {
  const contexts: BoundedContext[] = [];
  const relationships: Relationship[] = [];
  const repos: Repo[] = [];
  const people: Person[] = [];
  const teams: Team[] = [];
  const groups: Group[] = [];
  const users: User[] = [];
  const userNeeds: UserNeed[] = [];
  const userNeedConnections: UserNeedConnection[] = [];
  const needContextConnections: NeedContextConnection[] = [];
  const flowStages: FlowStageMarker[] = [];

  // Generate contexts
  const evolutionStages: BoundedContext['evolutionStage'][] = ['genesis', 'custom-built', 'product/rental', 'commodity/utility'];
  const classifications: BoundedContext['strategicClassification'][] = ['core', 'supporting', 'generic'];
  const ownerships: BoundedContext['ownership'][] = ['ours', 'internal', 'external'];
  const boundaryIntegrities: BoundedContext['boundaryIntegrity'][] = ['strong', 'moderate', 'weak'];

  for (let i = 0; i < LARGE_PROJECT_CONTEXTS; i++) {
    contexts.push({
      id: `ctx-${i}`,
      name: `Context ${i}`,
      purpose: `Purpose for context ${i} - handles business capability ${i % 10}`,
      strategicClassification: classifications[i % classifications.length],
      ownership: ownerships[i % ownerships.length],
      boundaryIntegrity: boundaryIntegrities[i % boundaryIntegrities.length],
      boundaryNotes: i % 3 === 0 ? `Notes about boundary for context ${i}` : undefined,
      positions: {
        strategic: { x: (i * 7) % 100 },
        flow: { x: (i * 5) % 100 },
        distillation: { x: (i * 11) % 100, y: (i * 13) % 100 },
        shared: { y: 20 + (i * 3) % 60 },
      },
      evolutionStage: evolutionStages[i % evolutionStages.length],
      codeSize: {
        loc: 1000 + i * 500,
        bucket: (['tiny', 'small', 'medium', 'large', 'huge'] as const)[i % 5],
      },
      isLegacy: i % 7 === 0,
      notes: `Notes for context ${i}`,
      teamId: `team-${i % LARGE_PROJECT_TEAMS}`,
    });
  }

  // Generate relationships (each context connects to multiple others)
  const patterns: Relationship['pattern'][] = [
    'customer-supplier', 'conformist', 'anti-corruption-layer',
    'open-host-service', 'published-language', 'shared-kernel',
    'partnership', 'separate-ways'
  ];

  for (let i = 0; i < LARGE_PROJECT_CONTEXTS; i++) {
    for (let j = 0; j < LARGE_PROJECT_RELATIONSHIPS_MULTIPLIER; j++) {
      const targetIdx = (i + j + 1) % LARGE_PROJECT_CONTEXTS;
      if (targetIdx !== i) {
        relationships.push({
          id: `rel-${i}-${j}`,
          fromContextId: `ctx-${i}`,
          toContextId: `ctx-${targetIdx}`,
          pattern: patterns[(i + j) % patterns.length],
          communicationMode: j % 2 === 0 ? 'REST API' : 'Event stream',
          description: `Relationship from context ${i} to context ${targetIdx}`,
        });
      }
    }
  }

  // Generate teams
  const topologyTypes: Team['topologyType'][] = ['stream-aligned', 'platform', 'enabling', 'complicated-subsystem', 'unknown'];
  for (let i = 0; i < LARGE_PROJECT_TEAMS; i++) {
    teams.push({
      id: `team-${i}`,
      name: `Team ${i}`,
      jiraBoard: `https://example.atlassian.net/jira/software/c/projects/TEAM${i}/boards/${i}`,
      topologyType: topologyTypes[i % topologyTypes.length],
    });
  }

  // Generate people
  for (let i = 0; i < LARGE_PROJECT_PEOPLE; i++) {
    people.push({
      id: `person-${i}`,
      displayName: `Person ${i}`,
      emails: [`person${i}@example.com`],
      teamIds: [`team-${i % LARGE_PROJECT_TEAMS}`],
    });
  }

  // Generate repos
  for (let i = 0; i < LARGE_PROJECT_REPOS; i++) {
    repos.push({
      id: `repo-${i}`,
      name: `repository-${i}`,
      remoteUrl: `https://github.com/example/repo-${i}`,
      contextId: `ctx-${i % LARGE_PROJECT_CONTEXTS}`,
      teamIds: [`team-${i % LARGE_PROJECT_TEAMS}`],
      contributors: [
        { personId: `person-${i % LARGE_PROJECT_PEOPLE}` },
        { personId: `person-${(i + 1) % LARGE_PROJECT_PEOPLE}` },
      ],
    });
  }

  // Generate groups (each group contains 5-10 contexts)
  for (let i = 0; i < LARGE_PROJECT_GROUPS; i++) {
    const contextCount = 5 + (i % 6);
    const startIdx = (i * 5) % LARGE_PROJECT_CONTEXTS;
    const contextIds = [];
    for (let j = 0; j < contextCount; j++) {
      contextIds.push(`ctx-${(startIdx + j) % LARGE_PROJECT_CONTEXTS}`);
    }
    groups.push({
      id: `group-${i}`,
      label: `Group ${i}`,
      color: `rgba(${(i * 30) % 255}, ${(i * 50) % 255}, ${(i * 70) % 255}, 0.6)`,
      contextIds,
      notes: `Notes for group ${i}`,
    });
  }

  // Generate users
  for (let i = 0; i < LARGE_PROJECT_USERS; i++) {
    users.push({
      id: `user-${i}`,
      name: `User Type ${i}`,
      description: `Description for user type ${i}`,
      position: (i * 10) % 100,
      isExternal: i % 3 === 0,
    });
  }

  // Generate user needs
  for (let i = 0; i < LARGE_PROJECT_USER_NEEDS; i++) {
    userNeeds.push({
      id: `need-${i}`,
      name: `User Need ${i}`,
      description: `Description for user need ${i}`,
      position: (i * 4) % 100,
      visibility: i % 5 !== 0,
    });
  }

  // Generate user need connections (each user has 2-3 needs)
  for (let i = 0; i < LARGE_PROJECT_USERS; i++) {
    for (let j = 0; j < 3; j++) {
      const needIdx = (i * 3 + j) % LARGE_PROJECT_USER_NEEDS;
      userNeedConnections.push({
        id: `unc-${i}-${j}`,
        userId: `user-${i}`,
        userNeedId: `need-${needIdx}`,
      });
    }
  }

  // Generate need context connections (each need connects to 2-4 contexts)
  for (let i = 0; i < LARGE_PROJECT_USER_NEEDS; i++) {
    for (let j = 0; j < 4; j++) {
      const contextIdx = (i * 4 + j) % LARGE_PROJECT_CONTEXTS;
      needContextConnections.push({
        id: `ncc-${i}-${j}`,
        userNeedId: `need-${i}`,
        contextId: `ctx-${contextIdx}`,
      });
    }
  }

  // Generate flow stages
  for (let i = 0; i < LARGE_PROJECT_FLOW_STAGES; i++) {
    flowStages.push({
      name: `Stage ${i}`,
      position: (i * 12) + 5,
      description: `Description for flow stage ${i}`,
      owner: `team-${i % LARGE_PROJECT_TEAMS}`,
      notes: i % 2 === 0 ? `Notes for stage ${i}` : undefined,
    });
  }

  return {
    id: 'large-project',
    name: 'Large Performance Test Project',
    version: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T12:00:00Z',
    contexts,
    relationships,
    repos,
    people,
    teams,
    groups,
    users,
    userNeeds,
    userNeedConnections,
    needContextConnections,
    viewConfig: { flowStages },
    temporal: {
      enabled: true,
      keyframes: [
        {
          id: 'kf-now',
          date: '2025',
          label: 'Current State',
          positions: Object.fromEntries(
            contexts.slice(0, 20).map(ctx => [ctx.id, { x: ctx.positions.strategic.x, y: ctx.positions.shared.y }])
          ),
          activeContextIds: contexts.slice(0, 80).map(ctx => ctx.id),
        },
        {
          id: 'kf-future',
          date: '2026',
          label: 'Future State',
          positions: Object.fromEntries(
            contexts.slice(0, 20).map(ctx => [ctx.id, { x: (ctx.positions.strategic.x + 10) % 100, y: ctx.positions.shared.y }])
          ),
          activeContextIds: contexts.map(ctx => ctx.id),
        },
      ],
    },
  };
}

const createMinimalProject = (): Project => ({
  id: 'proj-1',
  name: 'Minimal Project',
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
  viewConfig: {
    flowStages: [],
  },
});

const createFullProject = (): Project => ({
  id: 'proj-full',
  name: 'Full Project',
  version: 2,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-06-01T12:00:00Z',
  contexts: [
    {
      id: 'ctx-1',
      name: 'Orders',
      evolutionStage: 'custom-built',
      positions: {
        strategic: { x: 30 },
        flow: { x: 40 },
        distillation: { x: 50, y: 60 },
        shared: { y: 70 },
      },
      purpose: 'Order management',
      strategicClassification: 'core',
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
  repos: [
    {
      id: 'repo-1',
      name: 'order-service',
      teamIds: ['team-1'],
      contributors: [{ personId: 'person-1' }],
    },
  ],
  people: [
    {
      id: 'person-1',
      displayName: 'Alice',
      emails: ['alice@example.com'],
    },
  ],
  teams: [
    {
      id: 'team-1',
      name: 'Platform',
      topologyType: 'platform',
    },
  ],
  groups: [
    {
      id: 'group-1',
      label: 'Core Domain',
      contextIds: ['ctx-1'],
    },
  ],
  users: [
    {
      id: 'user-1',
      name: 'Customer',
      position: 25,
    },
  ],
  userNeeds: [
    {
      id: 'need-1',
      name: 'Track Orders',
      position: 50,
    },
  ],
  userNeedConnections: [
    {
      id: 'unc-1',
      userId: 'user-1',
      userNeedId: 'need-1',
    },
  ],
  needContextConnections: [
    {
      id: 'ncc-1',
      userNeedId: 'need-1',
      contextId: 'ctx-1',
    },
  ],
  viewConfig: {
    flowStages: [
      {
        name: 'Ingestion',
        position: 20,
        description: 'Data entry point',
      },
    ],
  },
  temporal: {
    enabled: true,
    keyframes: [
      {
        id: 'kf-1',
        date: '2025',
        positions: {
          'ctx-1': { x: 30, y: 70 },
        },
        activeContextIds: ['ctx-1'],
      },
    ],
  },
});

describe('JSON import/export compatibility', () => {
  describe('JSON round-trip', () => {
    it('round-trips minimal project through JSON', () => {
      const original = createMinimalProject();
      const json = JSON.stringify(original);
      const parsed = JSON.parse(json) as Project;

      expect(parsed).toEqual(original);
    });

    it('round-trips full project through JSON', () => {
      const original = createFullProject();
      const json = JSON.stringify(original);
      const parsed = JSON.parse(json) as Project;

      expect(parsed).toEqual(original);
    });

    it('round-trips project with all optional fields undefined', () => {
      const project: Project = {
        id: 'proj-no-optional',
        name: 'No Optional Fields',
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
        // No version, createdAt, updatedAt, or temporal
      };

      const json = JSON.stringify(project);
      const parsed = JSON.parse(json) as Project;

      // JSON.stringify removes undefined fields, so parsed won't have them
      expect(parsed.id).toBe(project.id);
      expect(parsed.name).toBe(project.name);
      expect(parsed.version).toBeUndefined();
      expect(parsed.temporal).toBeUndefined();
    });
  });

  describe('sample project files', () => {
    it('loads and validates examples/empty.project.json', () => {
      const result = validateImportedProject(emptyProject);
      expect(result.valid).toBe(true);
    });

    it('loads and validates examples/sample.project.json', () => {
      const result = validateImportedProject(sampleProject);
      expect(result.valid).toBe(true);
    });

    it('round-trips empty.project.json through Y.Doc', () => {
      const doc = projectToYDoc(emptyProject as Project);
      const result = yDocToProject(doc);

      expect(result.id).toBe(emptyProject.id);
      expect(result.name).toBe(emptyProject.name);
      expect(result.contexts).toEqual(emptyProject.contexts);
    });

    it('round-trips sample.project.json through Y.Doc', () => {
      const doc = projectToYDoc(sampleProject as Project);
      const result = yDocToProject(doc);

      expect(result.id).toBe(sampleProject.id);
      expect(result.name).toBe(sampleProject.name);
      expect(result.contexts.length).toBe(sampleProject.contexts.length);
      expect(result.relationships.length).toBe(sampleProject.relationships.length);
    });
  });

  describe('validateImportedProject', () => {
    it('rejects null input', () => {
      const result = validateImportedProject(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not a valid JSON object');
    });

    it('rejects undefined input', () => {
      const result = validateImportedProject(undefined);
      expect(result.valid).toBe(false);
    });

    it('rejects non-object input', () => {
      const result = validateImportedProject('not an object');
      expect(result.valid).toBe(false);
    });

    it('rejects array input', () => {
      const result = validateImportedProject([{ id: '1', name: 'test' }]);
      expect(result.valid).toBe(false);
    });

    it('rejects project without id', () => {
      const result = validateImportedProject({ name: 'No ID' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing id');
    });

    it('rejects project without name', () => {
      const result = validateImportedProject({ id: 'has-id' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing name');
    });

    it('rejects project with non-array contexts', () => {
      const result = validateImportedProject({
        id: 'test',
        name: 'Test',
        contexts: 'not an array',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('contexts must be an array');
    });

    it('rejects project with non-array relationships', () => {
      const result = validateImportedProject({
        id: 'test',
        name: 'Test',
        relationships: { invalid: true },
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('relationships must be an array');
    });

    it('accepts minimal valid project', () => {
      const result = validateImportedProject({
        id: 'minimal',
        name: 'Minimal',
        contexts: [],
        relationships: [],
      });
      expect(result.valid).toBe(true);
    });

    it('accepts project with only id and name', () => {
      const result = validateImportedProject({
        id: 'bare-minimum',
        name: 'Bare Minimum',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('checkImportConflict', () => {
    it('detects conflict when project id exists', () => {
      const existingProjects: Record<string, Project> = {
        'existing-id': createMinimalProject(),
      };
      const importedProject = { ...createMinimalProject(), id: 'existing-id' };

      const result = checkImportConflict(importedProject, existingProjects);

      expect(result.hasConflict).toBe(true);
      expect(result.existingProject).toBeDefined();
    });

    it('returns no conflict for new project id', () => {
      const existingProjects: Record<string, Project> = {
        'existing-id': createMinimalProject(),
      };
      const importedProject = { ...createMinimalProject(), id: 'new-id' };

      const result = checkImportConflict(importedProject, existingProjects);

      expect(result.hasConflict).toBe(false);
      expect(result.existingProject).toBeUndefined();
    });

    it('handles empty existing projects', () => {
      const existingProjects: Record<string, Project> = {};
      const importedProject = createMinimalProject();

      const result = checkImportConflict(importedProject, existingProjects);

      expect(result.hasConflict).toBe(false);
    });
  });

  describe('importProjectAsNew', () => {
    it('generates new id for project', () => {
      const original = createMinimalProject();
      const result = importProjectAsNew(original, []);

      expect(result.id).not.toBe(original.id);
    });

    it('generates new ids for all contexts', () => {
      const original = createFullProject();
      const result = importProjectAsNew(original, []);

      expect(result.contexts[0].id).not.toBe(original.contexts[0].id);
    });

    it('generates new ids for all relationships', () => {
      const original = createFullProject();
      const result = importProjectAsNew(original, []);

      expect(result.relationships[0].id).not.toBe(original.relationships[0].id);
    });

    it('updates relationship references to new context ids', () => {
      const original = createFullProject();
      const result = importProjectAsNew(original, []);

      // The fromContextId should be updated to match the new context id
      expect(result.relationships[0].fromContextId).toBe(result.contexts[0].id);
    });

    it('appends (Copy) to duplicate name', () => {
      const original = createMinimalProject();
      const existingNames = ['Minimal Project'];

      const result = importProjectAsNew(original, existingNames);

      expect(result.name).toBe('Minimal Project (Copy)');
    });

    it('handles multiple copies with unique suffixes', () => {
      const original = createMinimalProject();
      const existingNames = ['Minimal Project', 'Minimal Project (Copy)'];

      const result = importProjectAsNew(original, existingNames);

      expect(result.name).not.toBe('Minimal Project');
      expect(result.name).not.toBe('Minimal Project (Copy)');
    });

    it('preserves all entity data except ids', () => {
      const original = createFullProject();
      const result = importProjectAsNew(original, []);

      expect(result.contexts[0].name).toBe(original.contexts[0].name);
      expect(result.contexts[0].evolutionStage).toBe(original.contexts[0].evolutionStage);
      expect(result.contexts[0].positions).toEqual(original.contexts[0].positions);
    });
  });

  describe('optional field compatibility', () => {
    it('imports project without version field', () => {
      const project = {
        id: 'no-version',
        name: 'No Version',
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
      };

      const result = validateImportedProject(project);
      expect(result.valid).toBe(true);

      const doc = projectToYDoc(project as Project);
      const roundTripped = yDocToProject(doc);
      expect(roundTripped.version).toBeUndefined();
    });

    it('imports project without temporal field', () => {
      const project = createMinimalProject();
      // Ensure temporal is not set
      expect(project.temporal).toBeUndefined();

      const doc = projectToYDoc(project);
      const roundTripped = yDocToProject(doc);

      expect(roundTripped.temporal).toBeUndefined();
    });

    it('imports project without createdAt/updatedAt', () => {
      const project = createMinimalProject();

      const doc = projectToYDoc(project);
      const roundTripped = yDocToProject(doc);

      expect(roundTripped.createdAt).toBeUndefined();
      expect(roundTripped.updatedAt).toBeUndefined();
    });

    it('imports project with empty arrays for all entity types', () => {
      const project = createMinimalProject();

      const doc = projectToYDoc(project);
      const roundTripped = yDocToProject(doc);

      expect(roundTripped.contexts).toEqual([]);
      expect(roundTripped.relationships).toEqual([]);
      expect(roundTripped.repos).toEqual([]);
      expect(roundTripped.people).toEqual([]);
      expect(roundTripped.teams).toEqual([]);
      expect(roundTripped.groups).toEqual([]);
      expect(roundTripped.users).toEqual([]);
      expect(roundTripped.userNeeds).toEqual([]);
      expect(roundTripped.userNeedConnections).toEqual([]);
      expect(roundTripped.needContextConnections).toEqual([]);
    });
  });
});

describe('Large project performance tests', () => {
  // Generate the large project once for all tests
  let largeProject: Project;

  beforeAll(() => {
    largeProject = generateLargeProject();
  });

  describe('project generation verification', () => {
    it('generates expected entity counts', () => {
      expect(largeProject.contexts.length).toBe(LARGE_PROJECT_CONTEXTS);
      expect(largeProject.relationships.length).toBe(LARGE_PROJECT_CONTEXTS * LARGE_PROJECT_RELATIONSHIPS_MULTIPLIER);
      expect(largeProject.repos.length).toBe(LARGE_PROJECT_REPOS);
      expect(largeProject.people.length).toBe(LARGE_PROJECT_PEOPLE);
      expect(largeProject.teams.length).toBe(LARGE_PROJECT_TEAMS);
      expect(largeProject.groups.length).toBe(LARGE_PROJECT_GROUPS);
      expect(largeProject.users.length).toBe(LARGE_PROJECT_USERS);
      expect(largeProject.userNeeds.length).toBe(LARGE_PROJECT_USER_NEEDS);
      expect(largeProject.userNeedConnections.length).toBe(LARGE_PROJECT_USERS * 3);
      expect(largeProject.needContextConnections.length).toBe(LARGE_PROJECT_USER_NEEDS * 4);
      expect(largeProject.viewConfig.flowStages.length).toBe(LARGE_PROJECT_FLOW_STAGES);
    });

    it('generates valid project structure', () => {
      const result = validateImportedProject(largeProject);
      expect(result.valid).toBe(true);
    });

    it('generates temporal data with keyframes', () => {
      expect(largeProject.temporal).toBeDefined();
      expect(largeProject.temporal?.enabled).toBe(true);
      expect(largeProject.temporal?.keyframes.length).toBe(2);
    });
  });

  describe('JSON serialization performance', () => {
    it('serializes large project to JSON within threshold', () => {
      const start = performance.now();
      const json = JSON.stringify(largeProject);
      const duration = performance.now() - start;

      expect(json.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(JSON_ROUNDTRIP_THRESHOLD_MS);
    });

    it('deserializes large project from JSON within threshold', () => {
      const json = JSON.stringify(largeProject);

      const start = performance.now();
      const parsed = JSON.parse(json) as Project;
      const duration = performance.now() - start;

      expect(parsed.id).toBe(largeProject.id);
      expect(duration).toBeLessThan(JSON_ROUNDTRIP_THRESHOLD_MS);
    });

    it('round-trips large project through JSON preserving data', () => {
      const start = performance.now();
      const json = JSON.stringify(largeProject);
      const parsed = JSON.parse(json) as Project;
      const duration = performance.now() - start;

      expect(parsed).toEqual(largeProject);
      expect(duration).toBeLessThan(JSON_ROUNDTRIP_THRESHOLD_MS);
    });
  });

  describe('Y.Doc conversion performance', () => {
    it('converts large project to Y.Doc within threshold', () => {
      const start = performance.now();
      const doc = projectToYDoc(largeProject);
      const duration = performance.now() - start;

      expect(doc).toBeDefined();
      expect(duration).toBeLessThan(YDOC_ROUNDTRIP_THRESHOLD_MS);
    });

    it('converts Y.Doc back to project within threshold', () => {
      const doc = projectToYDoc(largeProject);

      const start = performance.now();
      const result = yDocToProject(doc);
      const duration = performance.now() - start;

      expect(result.id).toBe(largeProject.id);
      expect(duration).toBeLessThan(YDOC_ROUNDTRIP_THRESHOLD_MS);
    });

    it('round-trips large project through Y.Doc within threshold', () => {
      const start = performance.now();
      const doc = projectToYDoc(largeProject);
      const result = yDocToProject(doc);
      const duration = performance.now() - start;

      expect(result.id).toBe(largeProject.id);
      expect(result.name).toBe(largeProject.name);
      expect(result.contexts.length).toBe(largeProject.contexts.length);
      expect(result.relationships.length).toBe(largeProject.relationships.length);
      expect(duration).toBeLessThan(YDOC_ROUNDTRIP_THRESHOLD_MS);
    });

    it('preserves all entity data through Y.Doc round-trip', () => {
      const doc = projectToYDoc(largeProject);
      const result = yDocToProject(doc);

      // Verify counts match
      expect(result.contexts.length).toBe(largeProject.contexts.length);
      expect(result.relationships.length).toBe(largeProject.relationships.length);
      expect(result.repos.length).toBe(largeProject.repos.length);
      expect(result.people.length).toBe(largeProject.people.length);
      expect(result.teams.length).toBe(largeProject.teams.length);
      expect(result.groups.length).toBe(largeProject.groups.length);
      expect(result.users.length).toBe(largeProject.users.length);
      expect(result.userNeeds.length).toBe(largeProject.userNeeds.length);
      expect(result.userNeedConnections.length).toBe(largeProject.userNeedConnections.length);
      expect(result.needContextConnections.length).toBe(largeProject.needContextConnections.length);
      expect(result.viewConfig.flowStages.length).toBe(largeProject.viewConfig.flowStages.length);

      // Verify first and last entities of each type
      expect(result.contexts[0]).toEqual(largeProject.contexts[0]);
      expect(result.contexts[result.contexts.length - 1]).toEqual(largeProject.contexts[largeProject.contexts.length - 1]);
      expect(result.relationships[0]).toEqual(largeProject.relationships[0]);
      expect(result.groups[0]).toEqual(largeProject.groups[0]);

      // Verify temporal data
      expect(result.temporal).toEqual(largeProject.temporal);
    });
  });

  describe('validation performance', () => {
    it('validates large project within threshold', () => {
      const start = performance.now();
      const result = validateImportedProject(largeProject);
      const duration = performance.now() - start;

      expect(result.valid).toBe(true);
      expect(duration).toBeLessThan(VALIDATION_THRESHOLD_MS);
    });
  });

  describe('import as new performance', () => {
    it('generates new IDs for large project within threshold', () => {
      const start = performance.now();
      const result = importProjectAsNew(largeProject, []);
      const duration = performance.now() - start;

      expect(result.id).not.toBe(largeProject.id);
      expect(result.contexts.length).toBe(largeProject.contexts.length);
      // New IDs should be different
      expect(result.contexts[0].id).not.toBe(largeProject.contexts[0].id);
      // Performance should be reasonable (allow more time for ID remapping)
      expect(duration).toBeLessThan(YDOC_ROUNDTRIP_THRESHOLD_MS);
    });

    it('correctly remaps all references when importing as new', () => {
      const result = importProjectAsNew(largeProject, []);

      // Build ID mapping
      const contextIdMap = new Map<string, string>();
      for (let i = 0; i < largeProject.contexts.length; i++) {
        contextIdMap.set(largeProject.contexts[i].id, result.contexts[i].id);
      }

      // Verify relationships reference new context IDs
      for (let i = 0; i < result.relationships.length; i++) {
        const originalRel = largeProject.relationships[i];
        const newRel = result.relationships[i];

        expect(newRel.fromContextId).toBe(contextIdMap.get(originalRel.fromContextId));
        expect(newRel.toContextId).toBe(contextIdMap.get(originalRel.toContextId));
      }

      // Verify groups reference new context IDs
      for (let i = 0; i < result.groups.length; i++) {
        const originalGroup = largeProject.groups[i];
        const newGroup = result.groups[i];

        expect(newGroup.contextIds.length).toBe(originalGroup.contextIds.length);
        for (let j = 0; j < originalGroup.contextIds.length; j++) {
          expect(newGroup.contextIds[j]).toBe(contextIdMap.get(originalGroup.contextIds[j]));
        }
      }
    });
  });

  describe('stress tests', () => {
    it('handles multiple sequential Y.Doc round-trips', () => {
      const iterations = 5;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const doc = projectToYDoc(largeProject);
        const result = yDocToProject(doc);
        expect(result.id).toBe(largeProject.id);
      }

      const duration = performance.now() - start;
      const avgDuration = duration / iterations;

      // Average should still be within threshold
      expect(avgDuration).toBeLessThan(YDOC_ROUNDTRIP_THRESHOLD_MS);
    });

    it('handles multiple sequential JSON round-trips', () => {
      const iterations = 10;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const json = JSON.stringify(largeProject);
        const parsed = JSON.parse(json) as Project;
        expect(parsed.id).toBe(largeProject.id);
      }

      const duration = performance.now() - start;
      const avgDuration = duration / iterations;

      // Average should still be within threshold
      expect(avgDuration).toBeLessThan(JSON_ROUNDTRIP_THRESHOLD_MS);
    });
  });
});
