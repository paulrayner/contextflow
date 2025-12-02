import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { groupToYMap, yMapToGroup } from '../groupSync';
import type { Group } from '../../types';

describe('groupSync', () => {
  describe('groupToYMap', () => {
    it('converts a group with required fields only', () => {
      const group: Group = {
        id: 'grp-1',
        label: 'Core Domain',
        contextIds: ['ctx-1', 'ctx-2'],
      };

      const yMap = groupToYMap(group);

      expect(yMap.get('id')).toBe('grp-1');
      expect(yMap.get('label')).toBe('Core Domain');
      expect(yMap.get('color')).toBeNull();
      expect(yMap.get('notes')).toBeNull();

      const contextIds = yMap.get('contextIds') as Y.Array<string>;
      expect(contextIds).toBeInstanceOf(Y.Array);
      expect(contextIds.length).toBe(2);
      expect(contextIds.get(0)).toBe('ctx-1');
      expect(contextIds.get(1)).toBe('ctx-2');
    });

    it('converts a group with all fields populated', () => {
      const group: Group = {
        id: 'grp-2',
        label: 'Data Platform',
        color: '#3b82f6',
        contextIds: ['ctx-a', 'ctx-b', 'ctx-c'],
        notes: 'Handles all data ingestion and processing',
      };

      const yMap = groupToYMap(group);

      expect(yMap.get('id')).toBe('grp-2');
      expect(yMap.get('label')).toBe('Data Platform');
      expect(yMap.get('color')).toBe('#3b82f6');
      expect(yMap.get('notes')).toBe('Handles all data ingestion and processing');

      const contextIds = yMap.get('contextIds') as Y.Array<string>;
      expect(contextIds.length).toBe(3);
    });

    it('handles empty contextIds array', () => {
      const group: Group = {
        id: 'grp-empty',
        label: 'Empty Group',
        contextIds: [],
      };

      const yMap = groupToYMap(group);

      const contextIds = yMap.get('contextIds') as Y.Array<string>;
      expect(contextIds).toBeInstanceOf(Y.Array);
      expect(contextIds.length).toBe(0);
    });
  });

  describe('yMapToGroup', () => {
    it('converts a Y.Map back to a group with required fields', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap('group');

      yMap.set('id', 'grp-1');
      yMap.set('label', 'Core Domain');
      yMap.set('color', null);
      yMap.set('notes', null);

      const contextIds = new Y.Array<string>();
      contextIds.push(['ctx-1', 'ctx-2']);
      yMap.set('contextIds', contextIds);

      const group = yMapToGroup(yMap);

      expect(group.id).toBe('grp-1');
      expect(group.label).toBe('Core Domain');
      expect(group.color).toBeUndefined();
      expect(group.notes).toBeUndefined();
      expect(group.contextIds).toEqual(['ctx-1', 'ctx-2']);
    });

    it('converts a Y.Map with all fields back to group', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap('group');

      yMap.set('id', 'grp-2');
      yMap.set('label', 'Data Platform');
      yMap.set('color', '#3b82f6');
      yMap.set('notes', 'Important cluster');

      const contextIds = new Y.Array<string>();
      contextIds.push(['ctx-a', 'ctx-b']);
      yMap.set('contextIds', contextIds);

      const group = yMapToGroup(yMap);

      expect(group.id).toBe('grp-2');
      expect(group.label).toBe('Data Platform');
      expect(group.color).toBe('#3b82f6');
      expect(group.notes).toBe('Important cluster');
      expect(group.contextIds).toEqual(['ctx-a', 'ctx-b']);
    });
  });

  describe('round-trip', () => {
    it('round-trips a minimal group', () => {
      const original: Group = {
        id: 'grp-min',
        label: 'Minimal',
        contextIds: [],
      };

      const yMap = groupToYMap(original);
      const result = yMapToGroup(yMap);

      expect(result).toEqual(original);
    });

    it('round-trips a fully populated group', () => {
      const original: Group = {
        id: 'grp-full',
        label: 'Full Group',
        color: '#ef4444',
        contextIds: ['ctx-1', 'ctx-2', 'ctx-3'],
        notes: 'Complete group with all fields',
      };

      const yMap = groupToYMap(original);
      const result = yMapToGroup(yMap);

      expect(result).toEqual(original);
    });
  });
});
