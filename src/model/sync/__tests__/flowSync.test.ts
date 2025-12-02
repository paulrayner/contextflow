import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { flowStageToYMap, yMapToFlowStage } from '../flowSync';
import type { FlowStageMarker } from '../../types';

describe('flowSync', () => {
  describe('flowStageToYMap', () => {
    it('converts a flow stage with required fields only', () => {
      const stage: FlowStageMarker = {
        name: 'Data Ingestion',
        position: 25,
      };

      const yMap = flowStageToYMap(stage);

      expect(yMap.get('name')).toBe('Data Ingestion');
      expect(yMap.get('position')).toBe(25);
      expect(yMap.get('description')).toBeNull();
      expect(yMap.get('owner')).toBeNull();
      expect(yMap.get('notes')).toBeNull();
    });

    it('converts a flow stage with all fields populated', () => {
      const stage: FlowStageMarker = {
        name: 'Order Processing',
        position: 50,
        description: 'Handles order lifecycle',
        owner: 'Orders Team',
        notes: 'Critical path for revenue',
      };

      const yMap = flowStageToYMap(stage);

      expect(yMap.get('name')).toBe('Order Processing');
      expect(yMap.get('position')).toBe(50);
      expect(yMap.get('description')).toBe('Handles order lifecycle');
      expect(yMap.get('owner')).toBe('Orders Team');
      expect(yMap.get('notes')).toBe('Critical path for revenue');
    });

    it('handles boundary position values', () => {
      const stageAtZero: FlowStageMarker = { name: 'Start', position: 0 };
      const stageAtEnd: FlowStageMarker = { name: 'End', position: 100 };

      expect(flowStageToYMap(stageAtZero).get('position')).toBe(0);
      expect(flowStageToYMap(stageAtEnd).get('position')).toBe(100);
    });
  });

  describe('yMapToFlowStage', () => {
    it('converts a Y.Map back to a flow stage with required fields', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap('stage');

      yMap.set('name', 'Data Ingestion');
      yMap.set('position', 25);
      yMap.set('description', null);
      yMap.set('owner', null);
      yMap.set('notes', null);

      const stage = yMapToFlowStage(yMap);

      expect(stage.name).toBe('Data Ingestion');
      expect(stage.position).toBe(25);
      expect(stage.description).toBeUndefined();
      expect(stage.owner).toBeUndefined();
      expect(stage.notes).toBeUndefined();
    });

    it('converts a Y.Map with all fields back to flow stage', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap('stage');

      yMap.set('name', 'Fulfillment');
      yMap.set('position', 75);
      yMap.set('description', 'Ships orders to customers');
      yMap.set('owner', 'Logistics Team');
      yMap.set('notes', 'Integrates with 3PL');

      const stage = yMapToFlowStage(yMap);

      expect(stage.name).toBe('Fulfillment');
      expect(stage.position).toBe(75);
      expect(stage.description).toBe('Ships orders to customers');
      expect(stage.owner).toBe('Logistics Team');
      expect(stage.notes).toBe('Integrates with 3PL');
    });
  });

  describe('round-trip', () => {
    it('round-trips a minimal flow stage', () => {
      const original: FlowStageMarker = {
        name: 'Minimal',
        position: 0,
      };

      const yMap = flowStageToYMap(original);
      const result = yMapToFlowStage(yMap);

      expect(result).toEqual(original);
    });

    it('round-trips a fully populated flow stage', () => {
      const original: FlowStageMarker = {
        name: 'Complete Stage',
        position: 42,
        description: 'Full description here',
        owner: 'Platform Team',
        notes: 'Additional notes',
      };

      const yMap = flowStageToYMap(original);
      const result = yMapToFlowStage(yMap);

      expect(result).toEqual(original);
    });
  });
});
