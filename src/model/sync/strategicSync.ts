import * as Y from 'yjs';
import type {
  User,
  UserNeed,
  UserNeedConnection,
  NeedContextConnection,
  TemporalKeyframe,
} from '../types';

export function populateUserYMap(yMap: Y.Map<unknown>, user: User): void {
  yMap.set('id', user.id);
  yMap.set('name', user.name);
  yMap.set('position', user.position);
  yMap.set('description', user.description ?? null);
  yMap.set('isExternal', user.isExternal ?? null);
}

export function userToYMap(user: User): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('user');
  populateUserYMap(yMap, user);
  return yMap;
}

export function yMapToUser(yMap: Y.Map<unknown>): User {
  const user: User = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    position: yMap.get('position') as number,
  };

  const description = yMap.get('description');
  if (description !== null) {
    user.description = description as string;
  }

  const isExternal = yMap.get('isExternal');
  if (isExternal !== null) {
    user.isExternal = isExternal as boolean;
  }

  return user;
}

export function populateUserNeedYMap(yMap: Y.Map<unknown>, need: UserNeed): void {
  yMap.set('id', need.id);
  yMap.set('name', need.name);
  yMap.set('position', need.position);
  yMap.set('description', need.description ?? null);
  yMap.set('visibility', need.visibility ?? null);
}

export function userNeedToYMap(need: UserNeed): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('userNeed');
  populateUserNeedYMap(yMap, need);
  return yMap;
}

export function yMapToUserNeed(yMap: Y.Map<unknown>): UserNeed {
  const need: UserNeed = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    position: yMap.get('position') as number,
  };

  const description = yMap.get('description');
  if (description !== null) {
    need.description = description as string;
  }

  const visibility = yMap.get('visibility');
  if (visibility !== null) {
    need.visibility = visibility as boolean;
  }

  return need;
}

export function populateUserNeedConnectionYMap(yMap: Y.Map<unknown>, conn: UserNeedConnection): void {
  yMap.set('id', conn.id);
  yMap.set('userId', conn.userId);
  yMap.set('userNeedId', conn.userNeedId);
  yMap.set('notes', conn.notes ?? null);
}

export function userNeedConnectionToYMap(conn: UserNeedConnection): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('userNeedConnection');
  populateUserNeedConnectionYMap(yMap, conn);
  return yMap;
}

export function yMapToUserNeedConnection(yMap: Y.Map<unknown>): UserNeedConnection {
  const conn: UserNeedConnection = {
    id: yMap.get('id') as string,
    userId: yMap.get('userId') as string,
    userNeedId: yMap.get('userNeedId') as string,
  };

  const notes = yMap.get('notes');
  if (notes !== null) {
    conn.notes = notes as string;
  }

  return conn;
}

export function populateNeedContextConnectionYMap(yMap: Y.Map<unknown>, conn: NeedContextConnection): void {
  yMap.set('id', conn.id);
  yMap.set('userNeedId', conn.userNeedId);
  yMap.set('contextId', conn.contextId);
  yMap.set('notes', conn.notes ?? null);
}

export function needContextConnectionToYMap(conn: NeedContextConnection): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('needContextConnection');
  populateNeedContextConnectionYMap(yMap, conn);
  return yMap;
}

export function yMapToNeedContextConnection(yMap: Y.Map<unknown>): NeedContextConnection {
  const conn: NeedContextConnection = {
    id: yMap.get('id') as string,
    userNeedId: yMap.get('userNeedId') as string,
    contextId: yMap.get('contextId') as string,
  };

  const notes = yMap.get('notes');
  if (notes !== null) {
    conn.notes = notes as string;
  }

  return conn;
}

export function populateTemporalKeyframeYMap(yMap: Y.Map<unknown>, keyframe: TemporalKeyframe): void {
  yMap.set('id', keyframe.id);
  yMap.set('date', keyframe.date);
  yMap.set('label', keyframe.label ?? null);

  const yPositions = new Y.Map<Y.Map<unknown>>();
  for (const [contextId, pos] of Object.entries(keyframe.positions)) {
    const yPos = new Y.Map<unknown>();
    yPos.set('x', pos.x);
    yPos.set('y', pos.y);
    yPositions.set(contextId, yPos);
  }
  yMap.set('positions', yPositions);

  const yActiveIds = new Y.Array<string>();
  yActiveIds.push(keyframe.activeContextIds);
  yMap.set('activeContextIds', yActiveIds);
}

export function temporalKeyframeToYMap(keyframe: TemporalKeyframe): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('keyframe');
  populateTemporalKeyframeYMap(yMap, keyframe);
  return yMap;
}

export function yMapToTemporalKeyframe(yMap: Y.Map<unknown>): TemporalKeyframe {
  const yPositions = yMap.get('positions') as Y.Map<Y.Map<unknown>>;
  const positions: TemporalKeyframe['positions'] = {};
  yPositions.forEach((yPos, contextId) => {
    positions[contextId] = {
      x: yPos.get('x') as number,
      y: yPos.get('y') as number,
    };
  });

  const yActiveIds = yMap.get('activeContextIds') as Y.Array<string>;
  const activeContextIds: string[] = [];
  for (let i = 0; i < yActiveIds.length; i++) {
    activeContextIds.push(yActiveIds.get(i));
  }

  const keyframe: TemporalKeyframe = {
    id: yMap.get('id') as string,
    date: yMap.get('date') as string,
    positions,
    activeContextIds,
  };

  const label = yMap.get('label');
  if (label !== null) {
    keyframe.label = label as string;
  }

  return keyframe;
}
