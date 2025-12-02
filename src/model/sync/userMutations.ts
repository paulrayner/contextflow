import * as Y from 'yjs';
import type { User } from '../types';
import { populateUserYMap } from './strategicSync';

export function addUserMutation(ydoc: Y.Doc, user: User): void {
  const yProject = ydoc.getMap('project');
  const yUsers = yProject.get('users') as Y.Array<Y.Map<unknown>>;

  const yUser = new Y.Map<unknown>();
  populateUserYMap(yUser, user);
  yUsers.push([yUser]);
}

export function updateUserMutation(
  ydoc: Y.Doc,
  userId: string,
  updates: Partial<User>
): void {
  const yUser = findUserById(ydoc, userId);
  if (!yUser) return;

  ydoc.transact(() => {
    applyUserUpdates(yUser, updates);
  });
}

export function deleteUserMutation(ydoc: Y.Doc, userId: string): void {
  const yProject = ydoc.getMap('project');
  const yUsers = yProject.get('users') as Y.Array<Y.Map<unknown>>;

  const index = findUserIndexById(yUsers, userId);
  if (index === -1) return;

  yUsers.delete(index);
}

export function updateUserPositionMutation(
  ydoc: Y.Doc,
  userId: string,
  position: number
): void {
  const yUser = findUserById(ydoc, userId);
  if (!yUser) return;

  ydoc.transact(() => {
    yUser.set('position', position);
  });
}

function findUserById(ydoc: Y.Doc, userId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yUsers = yProject.get('users') as Y.Array<Y.Map<unknown>>;

  for (let i = 0; i < yUsers.length; i++) {
    const yUser = yUsers.get(i);
    if (yUser.get('id') === userId) {
      return yUser;
    }
  }
  return null;
}

function findUserIndexById(yUsers: Y.Array<Y.Map<unknown>>, userId: string): number {
  for (let i = 0; i < yUsers.length; i++) {
    const yUser = yUsers.get(i);
    if (yUser.get('id') === userId) {
      return i;
    }
  }
  return -1;
}

function applyUserUpdates(yUser: Y.Map<unknown>, updates: Partial<User>): void {
  if ('name' in updates) {
    yUser.set('name', updates.name);
  }

  if ('position' in updates) {
    yUser.set('position', updates.position);
  }

  const optionalFields: (keyof Pick<User, 'description' | 'isExternal'>)[] = [
    'description',
    'isExternal',
  ];

  for (const field of optionalFields) {
    if (field in updates) {
      const value = updates[field];
      yUser.set(field, value ?? null);
    }
  }
}
