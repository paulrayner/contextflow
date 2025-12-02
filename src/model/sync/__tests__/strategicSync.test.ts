import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import {
  userToYMap,
  yMapToUser,
  userNeedToYMap,
  yMapToUserNeed,
  userNeedConnectionToYMap,
  yMapToUserNeedConnection,
  needContextConnectionToYMap,
  yMapToNeedContextConnection,
  temporalKeyframeToYMap,
  yMapToTemporalKeyframe,
} from '../strategicSync';
import type {
  User,
  UserNeed,
  UserNeedConnection,
  NeedContextConnection,
  TemporalKeyframe,
} from '../../types';

describe('strategicSync', () => {
  describe('userToYMap / yMapToUser', () => {
    it('converts a user with required fields only', () => {
      const user: User = {
        id: 'user-1',
        name: 'Enterprise Customer',
        position: 25,
      };

      const yMap = userToYMap(user);

      expect(yMap.get('id')).toBe('user-1');
      expect(yMap.get('name')).toBe('Enterprise Customer');
      expect(yMap.get('position')).toBe(25);
      expect(yMap.get('description')).toBeNull();
      expect(yMap.get('isExternal')).toBeNull();
    });

    it('converts a user with all fields', () => {
      const user: User = {
        id: 'user-2',
        name: 'External Partner',
        description: 'Third-party integration partner',
        position: 75,
        isExternal: true,
      };

      const yMap = userToYMap(user);

      expect(yMap.get('description')).toBe('Third-party integration partner');
      expect(yMap.get('isExternal')).toBe(true);
    });

    it('round-trips a user', () => {
      const original: User = {
        id: 'user-rt',
        name: 'Test User',
        description: 'A test user',
        position: 50,
        isExternal: false,
      };

      const result = yMapToUser(userToYMap(original));
      expect(result).toEqual(original);
    });
  });

  describe('userNeedToYMap / yMapToUserNeed', () => {
    it('converts a user need with required fields only', () => {
      const need: UserNeed = {
        id: 'need-1',
        name: 'Order Tracking',
        position: 30,
      };

      const yMap = userNeedToYMap(need);

      expect(yMap.get('id')).toBe('need-1');
      expect(yMap.get('name')).toBe('Order Tracking');
      expect(yMap.get('position')).toBe(30);
      expect(yMap.get('description')).toBeNull();
      expect(yMap.get('visibility')).toBeNull();
    });

    it('converts a user need with all fields', () => {
      const need: UserNeed = {
        id: 'need-2',
        name: 'Real-time Updates',
        description: 'Get instant notifications',
        position: 60,
        visibility: false,
      };

      const yMap = userNeedToYMap(need);

      expect(yMap.get('description')).toBe('Get instant notifications');
      expect(yMap.get('visibility')).toBe(false);
    });

    it('round-trips a user need', () => {
      const original: UserNeed = {
        id: 'need-rt',
        name: 'Analytics',
        description: 'View reports',
        position: 45,
        visibility: true,
      };

      const result = yMapToUserNeed(userNeedToYMap(original));
      expect(result).toEqual(original);
    });
  });

  describe('userNeedConnectionToYMap / yMapToUserNeedConnection', () => {
    it('converts a connection with required fields only', () => {
      const conn: UserNeedConnection = {
        id: 'conn-1',
        userId: 'user-1',
        userNeedId: 'need-1',
      };

      const yMap = userNeedConnectionToYMap(conn);

      expect(yMap.get('id')).toBe('conn-1');
      expect(yMap.get('userId')).toBe('user-1');
      expect(yMap.get('userNeedId')).toBe('need-1');
      expect(yMap.get('notes')).toBeNull();
    });

    it('round-trips a connection with notes', () => {
      const original: UserNeedConnection = {
        id: 'conn-rt',
        userId: 'user-2',
        userNeedId: 'need-2',
        notes: 'Primary use case',
      };

      const result = yMapToUserNeedConnection(userNeedConnectionToYMap(original));
      expect(result).toEqual(original);
    });
  });

  describe('needContextConnectionToYMap / yMapToNeedContextConnection', () => {
    it('converts a connection with required fields only', () => {
      const conn: NeedContextConnection = {
        id: 'ncc-1',
        userNeedId: 'need-1',
        contextId: 'ctx-1',
      };

      const yMap = needContextConnectionToYMap(conn);

      expect(yMap.get('id')).toBe('ncc-1');
      expect(yMap.get('userNeedId')).toBe('need-1');
      expect(yMap.get('contextId')).toBe('ctx-1');
      expect(yMap.get('notes')).toBeNull();
    });

    it('round-trips a connection with notes', () => {
      const original: NeedContextConnection = {
        id: 'ncc-rt',
        userNeedId: 'need-2',
        contextId: 'ctx-2',
        notes: 'Fulfills requirement',
      };

      const result = yMapToNeedContextConnection(needContextConnectionToYMap(original));
      expect(result).toEqual(original);
    });
  });

  describe('temporalKeyframeToYMap / yMapToTemporalKeyframe', () => {
    it('converts a keyframe with required fields only', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf-1',
        date: '2025',
        positions: {
          'ctx-1': { x: 30, y: 50 },
        },
        activeContextIds: ['ctx-1'],
      };

      const yMap = temporalKeyframeToYMap(keyframe);

      expect(yMap.get('id')).toBe('kf-1');
      expect(yMap.get('date')).toBe('2025');
      expect(yMap.get('label')).toBeNull();

      const positions = yMap.get('positions') as Y.Map<Y.Map<unknown>>;
      const ctx1Pos = positions.get('ctx-1') as Y.Map<unknown>;
      expect(ctx1Pos.get('x')).toBe(30);
      expect(ctx1Pos.get('y')).toBe(50);

      const activeIds = yMap.get('activeContextIds') as Y.Array<string>;
      expect(activeIds.length).toBe(1);
      expect(activeIds.get(0)).toBe('ctx-1');
    });

    it('converts a keyframe with all fields', () => {
      const keyframe: TemporalKeyframe = {
        id: 'kf-2',
        date: '2027-Q2',
        label: 'Target Architecture',
        positions: {
          'ctx-a': { x: 10, y: 20 },
          'ctx-b': { x: 80, y: 60 },
        },
        activeContextIds: ['ctx-a', 'ctx-b', 'ctx-c'],
      };

      const yMap = temporalKeyframeToYMap(keyframe);

      expect(yMap.get('label')).toBe('Target Architecture');

      const positions = yMap.get('positions') as Y.Map<Y.Map<unknown>>;
      expect(positions.size).toBe(2);
    });

    it('round-trips a keyframe', () => {
      const original: TemporalKeyframe = {
        id: 'kf-rt',
        date: '2026-Q4',
        label: 'Milestone',
        positions: {
          'ctx-1': { x: 25, y: 75 },
          'ctx-2': { x: 50, y: 50 },
        },
        activeContextIds: ['ctx-1', 'ctx-2'],
      };

      const result = yMapToTemporalKeyframe(temporalKeyframeToYMap(original));
      expect(result).toEqual(original);
    });

    it('round-trips a keyframe with empty positions', () => {
      const original: TemporalKeyframe = {
        id: 'kf-empty',
        date: '2024',
        positions: {},
        activeContextIds: [],
      };

      const result = yMapToTemporalKeyframe(temporalKeyframeToYMap(original));
      expect(result).toEqual(original);
    });
  });
});
