import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { contextToYMap, yMapToContext } from '../contextSync';
import type { BoundedContext, Issue } from '../../types';

describe('contextSync', () => {
  describe('contextToYMap', () => {
    it('converts a basic context with required fields', () => {
      const context: BoundedContext = {
        id: 'ctx-1',
        name: 'Order Management',
        positions: {
          strategic: { x: 50 },
          flow: { x: 30 },
          distillation: { x: 40, y: 60 },
          shared: { y: 70 },
        },
        evolutionStage: 'custom-built',
      };

      const yMap = contextToYMap(context);

      expect(yMap.get('id')).toBe('ctx-1');
      expect(yMap.get('name')).toBe('Order Management');
      expect(yMap.get('evolutionStage')).toBe('custom-built');

      // Check nested positions
      const positions = yMap.get('positions') as Y.Map<unknown>;
      expect(positions).toBeInstanceOf(Y.Map);

      const strategic = positions.get('strategic') as Y.Map<unknown>;
      expect(strategic.get('x')).toBe(50);

      const flow = positions.get('flow') as Y.Map<unknown>;
      expect(flow.get('x')).toBe(30);

      const distillation = positions.get('distillation') as Y.Map<unknown>;
      expect(distillation.get('x')).toBe(40);
      expect(distillation.get('y')).toBe(60);

      const shared = positions.get('shared') as Y.Map<unknown>;
      expect(shared.get('y')).toBe(70);
    });

    it('converts a context with all optional fields populated', () => {
      const context: BoundedContext = {
        id: 'ctx-2',
        name: 'Billing',
        purpose: 'Handle all billing operations',
        strategicClassification: 'core',
        ownership: 'ours',
        boundaryIntegrity: 'strong',
        boundaryNotes: 'Well-defined API boundaries',
        positions: {
          strategic: { x: 25 },
          flow: { x: 35 },
          distillation: { x: 45, y: 55 },
          shared: { y: 65 },
        },
        evolutionStage: 'product/rental',
        isLegacy: false,
        notes: 'Critical system',
        teamId: 'team-1',
        codeSize: {
          loc: 50000,
          bucket: 'large',
        },
        issues: [
          { id: 'issue-1', title: 'Tech debt', severity: 'warning' },
        ],
      };

      const yMap = contextToYMap(context);

      expect(yMap.get('purpose')).toBe('Handle all billing operations');
      expect(yMap.get('strategicClassification')).toBe('core');
      expect(yMap.get('ownership')).toBe('ours');
      expect(yMap.get('boundaryIntegrity')).toBe('strong');
      expect(yMap.get('boundaryNotes')).toBe('Well-defined API boundaries');
      expect(yMap.get('isLegacy')).toBe(false);
      expect(yMap.get('notes')).toBe('Critical system');
      expect(yMap.get('teamId')).toBe('team-1');

      // Check codeSize
      const codeSize = yMap.get('codeSize') as Y.Map<unknown>;
      expect(codeSize).toBeInstanceOf(Y.Map);
      expect(codeSize.get('loc')).toBe(50000);
      expect(codeSize.get('bucket')).toBe('large');

      // Check issues
      const issues = yMap.get('issues') as Y.Array<Y.Map<unknown>>;
      expect(issues).toBeInstanceOf(Y.Array);
      expect(issues.length).toBe(1);
      const issue = issues.get(0);
      expect(issue.get('id')).toBe('issue-1');
      expect(issue.get('title')).toBe('Tech debt');
      expect(issue.get('severity')).toBe('warning');
    });

    it('sets null for absent optional fields', () => {
      const context: BoundedContext = {
        id: 'ctx-3',
        name: 'Minimal',
        positions: {
          strategic: { x: 0 },
          flow: { x: 0 },
          distillation: { x: 0, y: 0 },
          shared: { y: 0 },
        },
        evolutionStage: 'genesis',
      };

      const yMap = contextToYMap(context);

      expect(yMap.get('purpose')).toBeNull();
      expect(yMap.get('strategicClassification')).toBeNull();
      expect(yMap.get('ownership')).toBeNull();
      expect(yMap.get('boundaryIntegrity')).toBeNull();
      expect(yMap.get('boundaryNotes')).toBeNull();
      expect(yMap.get('notes')).toBeNull();
      expect(yMap.get('teamId')).toBeNull();
      expect(yMap.get('codeSize')).toBeNull();
      expect(yMap.get('issues')).toBeNull();
    });

    it('handles codeSize with partial fields', () => {
      const context: BoundedContext = {
        id: 'ctx-4',
        name: 'Partial CodeSize',
        positions: {
          strategic: { x: 0 },
          flow: { x: 0 },
          distillation: { x: 0, y: 0 },
          shared: { y: 0 },
        },
        evolutionStage: 'genesis',
        codeSize: { loc: 1000 }, // bucket is undefined
      };

      const yMap = contextToYMap(context);
      const codeSize = yMap.get('codeSize') as Y.Map<unknown>;

      expect(codeSize.get('loc')).toBe(1000);
      expect(codeSize.get('bucket')).toBeNull();
    });

    it('handles multiple issues', () => {
      const issues: Issue[] = [
        { id: 'i1', title: 'Issue 1', severity: 'info' },
        { id: 'i2', title: 'Issue 2', description: 'Details', severity: 'critical' },
      ];

      const context: BoundedContext = {
        id: 'ctx-5',
        name: 'With Issues',
        positions: {
          strategic: { x: 0 },
          flow: { x: 0 },
          distillation: { x: 0, y: 0 },
          shared: { y: 0 },
        },
        evolutionStage: 'genesis',
        issues,
      };

      const yMap = contextToYMap(context);
      const yIssues = yMap.get('issues') as Y.Array<Y.Map<unknown>>;

      expect(yIssues.length).toBe(2);
      expect(yIssues.get(0).get('description')).toBeNull();
      expect(yIssues.get(1).get('description')).toBe('Details');
    });
  });

  describe('yMapToContext', () => {
    it('converts a Y.Map back to a basic context', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap('context');

      yMap.set('id', 'ctx-1');
      yMap.set('name', 'Order Management');
      yMap.set('evolutionStage', 'custom-built');
      yMap.set('purpose', null);
      yMap.set('strategicClassification', null);
      yMap.set('ownership', null);
      yMap.set('boundaryIntegrity', null);
      yMap.set('boundaryNotes', null);
      yMap.set('isLegacy', null);
      yMap.set('notes', null);
      yMap.set('teamId', null);
      yMap.set('codeSize', null);
      yMap.set('issues', null);

      // Set up nested positions
      const positions = new Y.Map();
      const strategic = new Y.Map();
      strategic.set('x', 50);
      const flow = new Y.Map();
      flow.set('x', 30);
      const distillation = new Y.Map();
      distillation.set('x', 40);
      distillation.set('y', 60);
      const shared = new Y.Map();
      shared.set('y', 70);

      positions.set('strategic', strategic);
      positions.set('flow', flow);
      positions.set('distillation', distillation);
      positions.set('shared', shared);
      yMap.set('positions', positions);

      const context = yMapToContext(yMap);

      expect(context.id).toBe('ctx-1');
      expect(context.name).toBe('Order Management');
      expect(context.evolutionStage).toBe('custom-built');
      expect(context.positions.strategic.x).toBe(50);
      expect(context.positions.flow.x).toBe(30);
      expect(context.positions.distillation.x).toBe(40);
      expect(context.positions.distillation.y).toBe(60);
      expect(context.positions.shared.y).toBe(70);

      // Optional fields should be undefined (not null)
      expect(context.purpose).toBeUndefined();
      expect(context.strategicClassification).toBeUndefined();
    });

    it('converts a Y.Map with all fields back to context', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap('context');

      yMap.set('id', 'ctx-2');
      yMap.set('name', 'Billing');
      yMap.set('purpose', 'Handle billing');
      yMap.set('strategicClassification', 'core');
      yMap.set('ownership', 'ours');
      yMap.set('boundaryIntegrity', 'strong');
      yMap.set('boundaryNotes', 'Good boundaries');
      yMap.set('evolutionStage', 'product/rental');
      yMap.set('isLegacy', true);
      yMap.set('notes', 'Important');
      yMap.set('teamId', 'team-1');

      // Positions
      const positions = new Y.Map();
      const strategic = new Y.Map();
      strategic.set('x', 25);
      const flow = new Y.Map();
      flow.set('x', 35);
      const distillation = new Y.Map();
      distillation.set('x', 45);
      distillation.set('y', 55);
      const shared = new Y.Map();
      shared.set('y', 65);
      positions.set('strategic', strategic);
      positions.set('flow', flow);
      positions.set('distillation', distillation);
      positions.set('shared', shared);
      yMap.set('positions', positions);

      // CodeSize
      const codeSize = new Y.Map();
      codeSize.set('loc', 50000);
      codeSize.set('bucket', 'large');
      yMap.set('codeSize', codeSize);

      // Issues
      const issues = new Y.Array<Y.Map<unknown>>();
      const issue1 = new Y.Map();
      issue1.set('id', 'issue-1');
      issue1.set('title', 'Tech debt');
      issue1.set('description', null);
      issue1.set('severity', 'warning');
      issues.push([issue1]);
      yMap.set('issues', issues);

      const context = yMapToContext(yMap);

      expect(context.id).toBe('ctx-2');
      expect(context.purpose).toBe('Handle billing');
      expect(context.strategicClassification).toBe('core');
      expect(context.ownership).toBe('ours');
      expect(context.boundaryIntegrity).toBe('strong');
      expect(context.boundaryNotes).toBe('Good boundaries');
      expect(context.isLegacy).toBe(true);
      expect(context.notes).toBe('Important');
      expect(context.teamId).toBe('team-1');
      expect(context.codeSize?.loc).toBe(50000);
      expect(context.codeSize?.bucket).toBe('large');
      expect(context.issues?.length).toBe(1);
      expect(context.issues?.[0].title).toBe('Tech debt');
    });

    it('round-trips a context through Yjs', () => {
      const original: BoundedContext = {
        id: 'ctx-round',
        name: 'Round Trip Test',
        purpose: 'Testing round trip',
        strategicClassification: 'supporting',
        ownership: 'internal',
        boundaryIntegrity: 'moderate',
        boundaryNotes: 'Some notes',
        positions: {
          strategic: { x: 10 },
          flow: { x: 20 },
          distillation: { x: 30, y: 40 },
          shared: { y: 50 },
        },
        evolutionStage: 'commodity/utility',
        isLegacy: false,
        notes: 'Test notes',
        teamId: 'team-2',
        codeSize: {
          loc: 25000,
          bucket: 'medium',
        },
        issues: [
          { id: 'i1', title: 'Test issue', description: 'Desc', severity: 'info' },
        ],
      };

      const yMap = contextToYMap(original);
      const result = yMapToContext(yMap);

      expect(result).toEqual(original);
    });

    it('round-trips a minimal context', () => {
      const original: BoundedContext = {
        id: 'ctx-min',
        name: 'Minimal',
        positions: {
          strategic: { x: 0 },
          flow: { x: 0 },
          distillation: { x: 0, y: 0 },
          shared: { y: 0 },
        },
        evolutionStage: 'genesis',
      };

      const yMap = contextToYMap(original);
      const result = yMapToContext(yMap);

      expect(result).toEqual(original);
    });
  });
});
