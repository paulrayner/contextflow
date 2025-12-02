import type { Project, BoundedContext, Relationship, Group, FlowStageMarker, User, UserNeed, UserNeedConnection, NeedContextConnection, TemporalKeyframe } from '../types';
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
  addUserNeedConnection(connection: UserNeedConnection): void;
  updateUserNeedConnection(connectionId: string, updates: Partial<UserNeedConnection>): void;
  deleteUserNeedConnection(connectionId: string): void;
  addNeedContextConnection(connection: NeedContextConnection): void;
  updateNeedContextConnection(connectionId: string, updates: Partial<NeedContextConnection>): void;
  deleteNeedContextConnection(connectionId: string): void;
  addKeyframe(keyframe: TemporalKeyframe): void;
  updateKeyframe(keyframeId: string, updates: Partial<TemporalKeyframe>): void;
  deleteKeyframe(keyframeId: string): void;
  updateKeyframeContextPosition(keyframeId: string, contextId: string, position: { x: number; y: number }): void;
  toggleTemporal(enabled: boolean): void;
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
    addUserNeedConnection(connection: UserNeedConnection): void {
      collabStore?.addUserNeedConnection(connection);
    },
    updateUserNeedConnection(connectionId: string, updates: Partial<UserNeedConnection>): void {
      collabStore?.updateUserNeedConnection(connectionId, updates);
    },
    deleteUserNeedConnection(connectionId: string): void {
      collabStore?.deleteUserNeedConnection(connectionId);
    },
    addNeedContextConnection(connection: NeedContextConnection): void {
      collabStore?.addNeedContextConnection(connection);
    },
    updateNeedContextConnection(connectionId: string, updates: Partial<NeedContextConnection>): void {
      collabStore?.updateNeedContextConnection(connectionId, updates);
    },
    deleteNeedContextConnection(connectionId: string): void {
      collabStore?.deleteNeedContextConnection(connectionId);
    },
    addKeyframe(keyframe: TemporalKeyframe): void {
      collabStore?.addKeyframe(keyframe);
    },
    updateKeyframe(keyframeId: string, updates: Partial<TemporalKeyframe>): void {
      collabStore?.updateKeyframe(keyframeId, updates);
    },
    deleteKeyframe(keyframeId: string): void {
      collabStore?.deleteKeyframe(keyframeId);
    },
    updateKeyframeContextPosition(keyframeId: string, contextId: string, position: { x: number; y: number }): void {
      collabStore?.updateKeyframeContextPosition(keyframeId, contextId, position);
    },
    toggleTemporal(enabled: boolean): void {
      collabStore?.toggleTemporal(enabled);
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
