import * as Y from 'yjs';
import type { Project, BoundedContext, Relationship, Group, FlowStageMarker, User, UserNeed } from '../types';
import { projectToYDoc, yDocToProject } from './projectSync';
import { SyncManager } from './syncManager';
import { CollabUndoManager, createUndoManager } from './undoManager';
import {
  addContextMutation,
  updateContextMutation,
  deleteContextMutation,
  updateContextPositionMutation,
} from './contextMutations';
import {
  addRelationshipMutation,
  updateRelationshipMutation,
  deleteRelationshipMutation,
} from './relationshipMutations';
import {
  addGroupMutation,
  updateGroupMutation,
  deleteGroupMutation,
  addContextToGroupMutation,
  addContextsToGroupMutation,
  removeContextFromGroupMutation,
} from './groupMutations';
import {
  addFlowStageMutation,
  updateFlowStageMutation,
  deleteFlowStageMutation,
} from './flowMutations';
import {
  addUserMutation,
  updateUserMutation,
  deleteUserMutation,
  updateUserPositionMutation,
} from './userMutations';
import {
  addUserNeedMutation,
  updateUserNeedMutation,
  deleteUserNeedMutation,
  updateUserNeedPositionMutation,
} from './userNeedMutations';

export interface CollabStoreOptions {
  onProjectChange?: (project: Project) => void;
}

export interface CollabStore {
  getYDoc(): Y.Doc;
  getProject(): Project;
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
  canUndo(): boolean;
  canRedo(): boolean;
  undo(): void;
  redo(): void;
  reset(project: Project): void;
  destroy(): void;
}

export function useCollabStore(project: Project, options: CollabStoreOptions = {}): CollabStore {
  let ydoc = projectToYDoc(project);
  let syncManager: SyncManager | null = null;
  let undoManager: CollabUndoManager | null = null;
  let isDestroyed = false;

  const handleProjectChange = (updatedProject: Project): void => {
    if (options.onProjectChange) {
      options.onProjectChange(updatedProject);
    }
  };

  syncManager = new SyncManager(ydoc, handleProjectChange);
  undoManager = createUndoManager(ydoc);

  const store: CollabStore = {
    getYDoc(): Y.Doc {
      return ydoc;
    },

    getProject(): Project {
      return yDocToProject(ydoc);
    },

    addContext(context: BoundedContext): void {
      addContextMutation(ydoc, context);
    },

    updateContext(contextId: string, updates: Partial<BoundedContext>): void {
      updateContextMutation(ydoc, contextId, updates);
    },

    deleteContext(contextId: string): void {
      deleteContextMutation(ydoc, contextId);
    },

    updateContextPosition(contextId: string, positions: BoundedContext['positions']): void {
      updateContextPositionMutation(ydoc, contextId, positions);
    },

    addRelationship(relationship: Relationship): void {
      addRelationshipMutation(ydoc, relationship);
    },

    updateRelationship(relationshipId: string, updates: Partial<Relationship>): void {
      updateRelationshipMutation(ydoc, relationshipId, updates);
    },

    deleteRelationship(relationshipId: string): void {
      deleteRelationshipMutation(ydoc, relationshipId);
    },

    addGroup(group: Group): void {
      addGroupMutation(ydoc, group);
    },

    updateGroup(groupId: string, updates: Partial<Group>): void {
      updateGroupMutation(ydoc, groupId, updates);
    },

    deleteGroup(groupId: string): void {
      deleteGroupMutation(ydoc, groupId);
    },

    addContextToGroup(groupId: string, contextId: string): void {
      addContextToGroupMutation(ydoc, groupId, contextId);
    },

    addContextsToGroup(groupId: string, contextIds: string[]): void {
      addContextsToGroupMutation(ydoc, groupId, contextIds);
    },

    removeContextFromGroup(groupId: string, contextId: string): void {
      removeContextFromGroupMutation(ydoc, groupId, contextId);
    },

    addFlowStage(stage: FlowStageMarker): void {
      addFlowStageMutation(ydoc, stage);
    },

    updateFlowStage(stageIndex: number, updates: Partial<FlowStageMarker>): void {
      updateFlowStageMutation(ydoc, stageIndex, updates);
    },

    deleteFlowStage(stageIndex: number): void {
      deleteFlowStageMutation(ydoc, stageIndex);
    },

    addUser(user: User): void {
      addUserMutation(ydoc, user);
    },

    updateUser(userId: string, updates: Partial<User>): void {
      updateUserMutation(ydoc, userId, updates);
    },

    deleteUser(userId: string): void {
      deleteUserMutation(ydoc, userId);
    },

    updateUserPosition(userId: string, position: number): void {
      updateUserPositionMutation(ydoc, userId, position);
    },

    addUserNeed(userNeed: UserNeed): void {
      addUserNeedMutation(ydoc, userNeed);
    },

    updateUserNeed(userNeedId: string, updates: Partial<UserNeed>): void {
      updateUserNeedMutation(ydoc, userNeedId, updates);
    },

    deleteUserNeed(userNeedId: string): void {
      deleteUserNeedMutation(ydoc, userNeedId);
    },

    updateUserNeedPosition(userNeedId: string, position: number): void {
      updateUserNeedPositionMutation(ydoc, userNeedId, position);
    },

    canUndo(): boolean {
      return undoManager?.canUndo() ?? false;
    },

    canRedo(): boolean {
      return undoManager?.canRedo() ?? false;
    },

    undo(): void {
      undoManager?.undo();
    },

    redo(): void {
      undoManager?.redo();
    },

    reset(newProject: Project): void {
      syncManager?.destroy();
      undoManager?.destroy();

      ydoc = projectToYDoc(newProject);
      syncManager = new SyncManager(ydoc, handleProjectChange);
      undoManager = createUndoManager(ydoc);
    },

    destroy(): void {
      if (isDestroyed) return;
      isDestroyed = true;

      syncManager?.destroy();
      syncManager = null;

      undoManager?.destroy();
      undoManager = null;
    },
  };

  return store;
}
