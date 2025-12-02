import { describe, it, expect } from 'vitest';
import { projectToYDoc, yDocToProject } from '../projectSync';
import { validateImportedProject, checkImportConflict, importProjectAsNew } from '../../actions/projectActions';
import type { Project } from '../../types';
import emptyProject from '../../../../examples/empty.project.json';
import sampleProject from '../../../../examples/sample.project.json';

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
