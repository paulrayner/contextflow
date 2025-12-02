import * as Y from 'yjs';
import type { Group } from '../types';

export function populateGroupYMap(yMap: Y.Map<unknown>, group: Group): void {
  yMap.set('id', group.id);
  yMap.set('label', group.label);
  yMap.set('color', group.color ?? null);
  yMap.set('notes', group.notes ?? null);

  const yContextIds = new Y.Array<string>();
  yContextIds.push(group.contextIds);
  yMap.set('contextIds', yContextIds);
}

export function groupToYMap(group: Group): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('group');
  populateGroupYMap(yMap, group);
  return yMap;
}

export function yMapToGroup(yMap: Y.Map<unknown>): Group {
  const yContextIds = yMap.get('contextIds') as Y.Array<string>;
  const contextIds: string[] = [];
  for (let i = 0; i < yContextIds.length; i++) {
    contextIds.push(yContextIds.get(i));
  }

  const group: Group = {
    id: yMap.get('id') as string,
    label: yMap.get('label') as string,
    contextIds,
  };

  const color = yMap.get('color');
  if (color !== null) {
    group.color = color as string;
  }

  const notes = yMap.get('notes');
  if (notes !== null) {
    group.notes = notes as string;
  }

  return group;
}
