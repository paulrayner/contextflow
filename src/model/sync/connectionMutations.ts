import * as Y from 'yjs';
import type { UserNeedConnection, NeedContextConnection } from '../types';
import {
  populateUserNeedConnectionYMap,
  populateNeedContextConnectionYMap,
} from './strategicSync';

export function addUserNeedConnectionMutation(
  ydoc: Y.Doc,
  connection: UserNeedConnection
): void {
  const yProject = ydoc.getMap('project');
  const yConnections = yProject.get('userNeedConnections') as Y.Array<Y.Map<unknown>>;

  const yConnection = new Y.Map<unknown>();
  populateUserNeedConnectionYMap(yConnection, connection);
  yConnections.push([yConnection]);
}

export function updateUserNeedConnectionMutation(
  ydoc: Y.Doc,
  connectionId: string,
  updates: Partial<UserNeedConnection>
): void {
  const yConnection = findUserNeedConnectionById(ydoc, connectionId);
  if (!yConnection) return;

  ydoc.transact(() => {
    applyUserNeedConnectionUpdates(yConnection, updates);
  });
}

export function deleteUserNeedConnectionMutation(
  ydoc: Y.Doc,
  connectionId: string
): void {
  const yProject = ydoc.getMap('project');
  const yConnections = yProject.get('userNeedConnections') as Y.Array<Y.Map<unknown>>;

  const index = findConnectionIndexById(yConnections, connectionId);
  if (index === -1) return;

  yConnections.delete(index);
}

export function addNeedContextConnectionMutation(
  ydoc: Y.Doc,
  connection: NeedContextConnection
): void {
  const yProject = ydoc.getMap('project');
  const yConnections = yProject.get('needContextConnections') as Y.Array<Y.Map<unknown>>;

  const yConnection = new Y.Map<unknown>();
  populateNeedContextConnectionYMap(yConnection, connection);
  yConnections.push([yConnection]);
}

export function updateNeedContextConnectionMutation(
  ydoc: Y.Doc,
  connectionId: string,
  updates: Partial<NeedContextConnection>
): void {
  const yConnection = findNeedContextConnectionById(ydoc, connectionId);
  if (!yConnection) return;

  ydoc.transact(() => {
    applyNeedContextConnectionUpdates(yConnection, updates);
  });
}

export function deleteNeedContextConnectionMutation(
  ydoc: Y.Doc,
  connectionId: string
): void {
  const yProject = ydoc.getMap('project');
  const yConnections = yProject.get('needContextConnections') as Y.Array<Y.Map<unknown>>;

  const index = findConnectionIndexById(yConnections, connectionId);
  if (index === -1) return;

  yConnections.delete(index);
}

function findUserNeedConnectionById(
  ydoc: Y.Doc,
  connectionId: string
): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yConnections = yProject.get('userNeedConnections') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yConnections.length; i++) {
    const yConnection = yConnections.get(i);
    if (yConnection.get('id') === connectionId) {
      return yConnection;
    }
  }
  return null;
}

function findNeedContextConnectionById(
  ydoc: Y.Doc,
  connectionId: string
): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yConnections = yProject.get('needContextConnections') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yConnections.length; i++) {
    const yConnection = yConnections.get(i);
    if (yConnection.get('id') === connectionId) {
      return yConnection;
    }
  }
  return null;
}

function findConnectionIndexById(
  yConnections: Y.Array<Y.Map<unknown>>,
  connectionId: string
): number {
  for (let i = 0; i < yConnections.length; i++) {
    const yConnection = yConnections.get(i);
    if (yConnection.get('id') === connectionId) {
      return i;
    }
  }
  return -1;
}

function applyUserNeedConnectionUpdates(
  yConnection: Y.Map<unknown>,
  updates: Partial<UserNeedConnection>
): void {
  if ('notes' in updates) {
    yConnection.set('notes', updates.notes ?? null);
  }
}

function applyNeedContextConnectionUpdates(
  yConnection: Y.Map<unknown>,
  updates: Partial<NeedContextConnection>
): void {
  if ('notes' in updates) {
    yConnection.set('notes', updates.notes ?? null);
  }
}
