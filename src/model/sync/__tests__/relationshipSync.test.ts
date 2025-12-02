import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { relationshipToYMap, yMapToRelationship } from '../relationshipSync';
import type { Relationship } from '../../types';

describe('relationshipSync', () => {
  describe('relationshipToYMap', () => {
    it('converts a relationship with required fields only', () => {
      const relationship: Relationship = {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'customer-supplier',
      };

      const yMap = relationshipToYMap(relationship);

      expect(yMap.get('id')).toBe('rel-1');
      expect(yMap.get('fromContextId')).toBe('ctx-1');
      expect(yMap.get('toContextId')).toBe('ctx-2');
      expect(yMap.get('pattern')).toBe('customer-supplier');
      expect(yMap.get('communicationMode')).toBeNull();
      expect(yMap.get('description')).toBeNull();
    });

    it('converts a relationship with all fields populated', () => {
      const relationship: Relationship = {
        id: 'rel-2',
        fromContextId: 'ctx-a',
        toContextId: 'ctx-b',
        pattern: 'anti-corruption-layer',
        communicationMode: 'REST API',
        description: 'Orders service consumes inventory data',
      };

      const yMap = relationshipToYMap(relationship);

      expect(yMap.get('id')).toBe('rel-2');
      expect(yMap.get('fromContextId')).toBe('ctx-a');
      expect(yMap.get('toContextId')).toBe('ctx-b');
      expect(yMap.get('pattern')).toBe('anti-corruption-layer');
      expect(yMap.get('communicationMode')).toBe('REST API');
      expect(yMap.get('description')).toBe('Orders service consumes inventory data');
    });

    it('handles all DDD relationship patterns', () => {
      const patterns: Relationship['pattern'][] = [
        'customer-supplier',
        'conformist',
        'anti-corruption-layer',
        'open-host-service',
        'published-language',
        'shared-kernel',
        'partnership',
        'separate-ways',
      ];

      for (const pattern of patterns) {
        const relationship: Relationship = {
          id: `rel-${pattern}`,
          fromContextId: 'ctx-1',
          toContextId: 'ctx-2',
          pattern,
        };

        const yMap = relationshipToYMap(relationship);
        expect(yMap.get('pattern')).toBe(pattern);
      }
    });
  });

  describe('yMapToRelationship', () => {
    it('converts a Y.Map back to a relationship with required fields', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap('relationship');

      yMap.set('id', 'rel-1');
      yMap.set('fromContextId', 'ctx-1');
      yMap.set('toContextId', 'ctx-2');
      yMap.set('pattern', 'conformist');
      yMap.set('communicationMode', null);
      yMap.set('description', null);

      const relationship = yMapToRelationship(yMap);

      expect(relationship.id).toBe('rel-1');
      expect(relationship.fromContextId).toBe('ctx-1');
      expect(relationship.toContextId).toBe('ctx-2');
      expect(relationship.pattern).toBe('conformist');
      expect(relationship.communicationMode).toBeUndefined();
      expect(relationship.description).toBeUndefined();
    });

    it('converts a Y.Map with all fields back to relationship', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap('relationship');

      yMap.set('id', 'rel-2');
      yMap.set('fromContextId', 'ctx-a');
      yMap.set('toContextId', 'ctx-b');
      yMap.set('pattern', 'shared-kernel');
      yMap.set('communicationMode', 'Shared database');
      yMap.set('description', 'Both contexts share user model');

      const relationship = yMapToRelationship(yMap);

      expect(relationship.id).toBe('rel-2');
      expect(relationship.fromContextId).toBe('ctx-a');
      expect(relationship.toContextId).toBe('ctx-b');
      expect(relationship.pattern).toBe('shared-kernel');
      expect(relationship.communicationMode).toBe('Shared database');
      expect(relationship.description).toBe('Both contexts share user model');
    });
  });

  describe('round-trip', () => {
    it('round-trips a minimal relationship', () => {
      const original: Relationship = {
        id: 'rel-min',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'partnership',
      };

      const yMap = relationshipToYMap(original);
      const result = yMapToRelationship(yMap);

      expect(result).toEqual(original);
    });

    it('round-trips a fully populated relationship', () => {
      const original: Relationship = {
        id: 'rel-full',
        fromContextId: 'ctx-orders',
        toContextId: 'ctx-inventory',
        pattern: 'open-host-service',
        communicationMode: 'GraphQL',
        description: 'Inventory exposes product availability',
      };

      const yMap = relationshipToYMap(original);
      const result = yMapToRelationship(yMap);

      expect(result).toEqual(original);
    });
  });
});
