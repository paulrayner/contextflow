import * as Y from 'yjs';
import type { UserNeed } from '../types';
import { populateUserNeedYMap } from './strategicSync';

export function addUserNeedMutation(ydoc: Y.Doc, userNeed: UserNeed): void {
  const yProject = ydoc.getMap('project');
  const yUserNeeds = yProject.get('userNeeds') as Y.Array<Y.Map<unknown>>;

  const yUserNeed = new Y.Map<unknown>();
  populateUserNeedYMap(yUserNeed, userNeed);
  yUserNeeds.push([yUserNeed]);
}

export function updateUserNeedMutation(
  ydoc: Y.Doc,
  userNeedId: string,
  updates: Partial<UserNeed>
): void {
  const yUserNeed = findUserNeedById(ydoc, userNeedId);
  if (!yUserNeed) return;

  ydoc.transact(() => {
    applyUserNeedUpdates(yUserNeed, updates);
  });
}

export function deleteUserNeedMutation(ydoc: Y.Doc, userNeedId: string): void {
  const yProject = ydoc.getMap('project');
  const yUserNeeds = yProject.get('userNeeds') as Y.Array<Y.Map<unknown>>;

  const index = findUserNeedIndexById(yUserNeeds, userNeedId);
  if (index === -1) return;

  yUserNeeds.delete(index);
}

export function updateUserNeedPositionMutation(
  ydoc: Y.Doc,
  userNeedId: string,
  position: number
): void {
  const yUserNeed = findUserNeedById(ydoc, userNeedId);
  if (!yUserNeed) return;

  ydoc.transact(() => {
    yUserNeed.set('position', position);
  });
}

function findUserNeedById(ydoc: Y.Doc, userNeedId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yUserNeeds = yProject.get('userNeeds') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yUserNeeds.length; i++) {
    const yUserNeed = yUserNeeds.get(i);
    if (yUserNeed.get('id') === userNeedId) {
      return yUserNeed;
    }
  }
  return null;
}

function findUserNeedIndexById(yUserNeeds: Y.Array<Y.Map<unknown>>, userNeedId: string): number {
  for (let i = 0; i < yUserNeeds.length; i++) {
    const yUserNeed = yUserNeeds.get(i);
    if (yUserNeed.get('id') === userNeedId) {
      return i;
    }
  }
  return -1;
}

function applyUserNeedUpdates(yUserNeed: Y.Map<unknown>, updates: Partial<UserNeed>): void {
  if ('name' in updates) {
    yUserNeed.set('name', updates.name);
  }

  if ('position' in updates) {
    yUserNeed.set('position', updates.position);
  }

  const optionalFields: (keyof Pick<UserNeed, 'description' | 'visibility'>)[] = [
    'description',
    'visibility',
  ];

  for (const field of optionalFields) {
    if (field in updates) {
      const value = updates[field];
      yUserNeed.set(field, value ?? null);
    }
  }
}
