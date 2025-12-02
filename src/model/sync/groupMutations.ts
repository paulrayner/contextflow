import * as Y from 'yjs';
import type { Group } from '../types';
import { populateGroupYMap } from './groupSync';

export function addGroupMutation(ydoc: Y.Doc, group: Group): void {
  const yProject = ydoc.getMap('project');
  const yGroups = yProject.get('groups') as Y.Array<Y.Map<unknown>>;

  const yGroup = new Y.Map<unknown>();
  populateGroupYMap(yGroup, group);
  yGroups.push([yGroup]);
}

export function updateGroupMutation(
  ydoc: Y.Doc,
  groupId: string,
  updates: Partial<Group>
): void {
  ydoc.transact(() => {
    const yGroup = findGroupById(ydoc, groupId);
    if (!yGroup) return;

    applyGroupUpdates(yGroup, updates);
  });
}

export function deleteGroupMutation(ydoc: Y.Doc, groupId: string): void {
  const yProject = ydoc.getMap('project');
  const yGroups = yProject.get('groups') as Y.Array<Y.Map<unknown>>;

  const index = findGroupIndex(yGroups, groupId);
  if (index === -1) return;

  yGroups.delete(index);
}

export function addContextToGroupMutation(
  ydoc: Y.Doc,
  groupId: string,
  contextId: string
): void {
  const yGroup = findGroupById(ydoc, groupId);
  if (!yGroup) return;

  const yContextIds = yGroup.get('contextIds') as Y.Array<string>;
  yContextIds.push([contextId]);
}

export function removeContextFromGroupMutation(
  ydoc: Y.Doc,
  groupId: string,
  contextId: string
): void {
  const yGroup = findGroupById(ydoc, groupId);
  if (!yGroup) return;

  const yContextIds = yGroup.get('contextIds') as Y.Array<string>;
  const index = findContextIdIndex(yContextIds, contextId);
  if (index === -1) return;

  yContextIds.delete(index);
}

function findGroupById(ydoc: Y.Doc, groupId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yGroups = yProject.get('groups') as Y.Array<Y.Map<unknown>>;

  const index = findGroupIndex(yGroups, groupId);
  if (index === -1) return null;

  return yGroups.get(index);
}

function findGroupIndex(
  yGroups: Y.Array<Y.Map<unknown>>,
  groupId: string
): number {
  for (let i = 0; i < yGroups.length; i++) {
    const yGroup = yGroups.get(i);
    if (yGroup.get('id') === groupId) {
      return i;
    }
  }
  return -1;
}

function findContextIdIndex(yContextIds: Y.Array<string>, contextId: string): number {
  for (let i = 0; i < yContextIds.length; i++) {
    if (yContextIds.get(i) === contextId) {
      return i;
    }
  }
  return -1;
}

function applyGroupUpdates(
  yGroup: Y.Map<unknown>,
  updates: Partial<Group>
): void {
  const fields: (keyof Omit<Group, 'id' | 'contextIds'>)[] = [
    'label',
    'color',
    'notes',
  ];

  for (const field of fields) {
    if (field in updates) {
      const value = updates[field];
      yGroup.set(field, value ?? null);
    }
  }
}
