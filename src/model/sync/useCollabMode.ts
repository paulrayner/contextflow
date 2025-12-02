import type { Project, BoundedContext, Relationship, Group, FlowStageMarker, User, UserNeed } from '../types';
import { useCollabStore, type CollabStore, type CollabStoreOptions } from './useCollabStore';

let collabStore: CollabStore | null = null;

export interface CollabMutations {
  addContext(context: BoundedContext): void;
  updateContext(contextId: string, updates: Partial<BoundedContext>): void;
  deleteContext(contextId: string): void;
  updateContextPosition(contextId: string, positions: BoundedContext['positions']): void;
  addRelationship(relationship: Relationship): void;
  updateRelationship(relationshipId: string, updates: Partial<Relationship>): void;
  deleteRelationship(relationshipId: string): void;
  addGroup(group: Group): void;
  updateGroup(groupId: string, updates: Partial<Group>): void;
  deleteGroup(groupId: string): void;
  addContextToGroup(groupId: string, contextId: string): void;
  addContextsToGroup(groupId: string, contextIds: string[]): void;
  removeContextFromGroup(groupId: string, contextId: string): void;
  addFlowStage(stage: FlowStageMarker): void;
  updateFlowStage(stageIndex: number, updates: Partial<FlowStageMarker>): void;
  deleteFlowStage(stageIndex: number): void;
  addUser(user: User): void;
  updateUser(userId: string, updates: Partial<User>): void;
  deleteUser(userId: string): void;
  updateUserPosition(userId: string, position: number): void;
  addUserNeed(userNeed: UserNeed): void;
  updateUserNeed(userNeedId: string, updates: Partial<UserNeed>): void;
  deleteUserNeed(userNeedId: string): void;
  updateUserNeedPosition(userNeedId: string, position: number): void;
}

export interface CollabUndoRedo {
  canUndo: boolean | null;
  canRedo: boolean | null;
  undo(): void;
  redo(): void;
}

export function initializeCollabMode(project: Project, options: CollabStoreOptions = {}): void {
  if (collabStore) {
    collabStore.destroy();
  }
  collabStore = useCollabStore(project, options);
}

export function destroyCollabMode(): void {
  if (collabStore) {
    collabStore.destroy();
    collabStore = null;
  }
}

export function getCollabStore(): CollabStore | null {
  return collabStore;
}

export function isCollabModeActive(): boolean {
  return collabStore !== null;
}

export function getCollabMutations(): CollabMutations {
  return {
    addContext(context: BoundedContext): void {
      collabStore?.addContext(context);
    },
    updateContext(contextId: string, updates: Partial<BoundedContext>): void {
      collabStore?.updateContext(contextId, updates);
    },
    deleteContext(contextId: string): void {
      collabStore?.deleteContext(contextId);
    },
    updateContextPosition(contextId: string, positions: BoundedContext['positions']): void {
      collabStore?.updateContextPosition(contextId, positions);
    },
    addRelationship(relationship: Relationship): void {
      collabStore?.addRelationship(relationship);
    },
    updateRelationship(relationshipId: string, updates: Partial<Relationship>): void {
      collabStore?.updateRelationship(relationshipId, updates);
    },
    deleteRelationship(relationshipId: string): void {
      collabStore?.deleteRelationship(relationshipId);
    },
    addGroup(group: Group): void {
      collabStore?.addGroup(group);
    },
    updateGroup(groupId: string, updates: Partial<Group>): void {
      collabStore?.updateGroup(groupId, updates);
    },
    deleteGroup(groupId: string): void {
      collabStore?.deleteGroup(groupId);
    },
    addContextToGroup(groupId: string, contextId: string): void {
      collabStore?.addContextToGroup(groupId, contextId);
    },
    addContextsToGroup(groupId: string, contextIds: string[]): void {
      collabStore?.addContextsToGroup(groupId, contextIds);
    },
    removeContextFromGroup(groupId: string, contextId: string): void {
      collabStore?.removeContextFromGroup(groupId, contextId);
    },
    addFlowStage(stage: FlowStageMarker): void {
      collabStore?.addFlowStage(stage);
    },
    updateFlowStage(stageIndex: number, updates: Partial<FlowStageMarker>): void {
      collabStore?.updateFlowStage(stageIndex, updates);
    },
    deleteFlowStage(stageIndex: number): void {
      collabStore?.deleteFlowStage(stageIndex);
    },
    addUser(user: User): void {
      collabStore?.addUser(user);
    },
    updateUser(userId: string, updates: Partial<User>): void {
      collabStore?.updateUser(userId, updates);
    },
    deleteUser(userId: string): void {
      collabStore?.deleteUser(userId);
    },
    updateUserPosition(userId: string, position: number): void {
      collabStore?.updateUserPosition(userId, position);
    },
    addUserNeed(userNeed: UserNeed): void {
      collabStore?.addUserNeed(userNeed);
    },
    updateUserNeed(userNeedId: string, updates: Partial<UserNeed>): void {
      collabStore?.updateUserNeed(userNeedId, updates);
    },
    deleteUserNeed(userNeedId: string): void {
      collabStore?.deleteUserNeed(userNeedId);
    },
    updateUserNeedPosition(userNeedId: string, position: number): void {
      collabStore?.updateUserNeedPosition(userNeedId, position);
    },
  };
}

export function getCollabUndoRedo(): CollabUndoRedo {
  return {
    get canUndo(): boolean | null {
      return collabStore?.canUndo() ?? null;
    },
    get canRedo(): boolean | null {
      return collabStore?.canRedo() ?? null;
    },
    undo(): void {
      collabStore?.undo();
    },
    redo(): void {
      collabStore?.redo();
    },
  };
}
