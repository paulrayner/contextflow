import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { projectToYDoc, yDocToProject } from '../projectSync';
import type { Project } from '../../types';

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

describe('projectSync', () => {
  describe('projectToYDoc', () => {
    it('converts a minimal project to Y.Doc', () => {
      const project = createMinimalProject();
      const doc = projectToYDoc(project);

      const yProject = doc.getMap('project');
      expect(yProject.get('id')).toBe('proj-1');
      expect(yProject.get('name')).toBe('Minimal Project');
      expect(yProject.get('version')).toBeNull();
      expect(yProject.get('createdAt')).toBeNull();
      expect(yProject.get('updatedAt')).toBeNull();

      const contexts = yProject.get('contexts') as Y.Array<unknown>;
      expect(contexts.length).toBe(0);

      const viewConfig = yProject.get('viewConfig') as Y.Map<unknown>;
      const flowStages = viewConfig.get('flowStages') as Y.Array<unknown>;
      expect(flowStages.length).toBe(0);

      expect(yProject.get('temporal')).toBeNull();
    });

    it('converts a full project to Y.Doc', () => {
      const project = createFullProject();
      const doc = projectToYDoc(project);

      const yProject = doc.getMap('project');
      expect(yProject.get('id')).toBe('proj-full');
      expect(yProject.get('version')).toBe(2);
      expect(yProject.get('createdAt')).toBe('2025-01-01T00:00:00Z');

      const contexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;
      expect(contexts.length).toBe(1);
      expect(contexts.get(0).get('name')).toBe('Orders');

      const relationships = yProject.get('relationships') as Y.Array<Y.Map<unknown>>;
      expect(relationships.length).toBe(1);

      const temporal = yProject.get('temporal') as Y.Map<unknown>;
      expect(temporal.get('enabled')).toBe(true);
      const keyframes = temporal.get('keyframes') as Y.Array<Y.Map<unknown>>;
      expect(keyframes.length).toBe(1);
    });
  });

  describe('yDocToProject', () => {
    it('converts a Y.Doc back to a minimal project', () => {
      const original = createMinimalProject();
      const doc = projectToYDoc(original);
      const result = yDocToProject(doc);

      expect(result).toEqual(original);
    });

    it('converts a Y.Doc back to a full project', () => {
      const original = createFullProject();
      const doc = projectToYDoc(original);
      const result = yDocToProject(doc);

      expect(result).toEqual(original);
    });
  });

  describe('round-trip edge cases', () => {
    it('handles project with only contexts', () => {
      const project: Project = {
        ...createMinimalProject(),
        contexts: [
          {
            id: 'ctx-only',
            name: 'Solo Context',
            evolutionStage: 'genesis',
            positions: {
              strategic: { x: 0 },
              flow: { x: 0 },
              distillation: { x: 0, y: 0 },
              shared: { y: 0 },
            },
          },
        ],
      };

      const result = yDocToProject(projectToYDoc(project));
      expect(result).toEqual(project);
    });

    it('handles project with temporal disabled', () => {
      const project: Project = {
        ...createMinimalProject(),
        temporal: {
          enabled: false,
          keyframes: [],
        },
      };

      const result = yDocToProject(projectToYDoc(project));
      expect(result).toEqual(project);
    });

    it('handles project with multiple keyframes', () => {
      const project: Project = {
        ...createMinimalProject(),
        temporal: {
          enabled: true,
          keyframes: [
            { id: 'kf-1', date: '2024', positions: {}, activeContextIds: [] },
            { id: 'kf-2', date: '2025', label: 'Now', positions: { 'ctx-1': { x: 50, y: 50 } }, activeContextIds: ['ctx-1'] },
            { id: 'kf-3', date: '2026-Q2', label: 'Future', positions: {}, activeContextIds: [] },
          ],
        },
      };

      const result = yDocToProject(projectToYDoc(project));
      expect(result).toEqual(project);
    });
  });
});
