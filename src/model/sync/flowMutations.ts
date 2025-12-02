import * as Y from 'yjs';
import type { FlowStageMarker } from '../types';
import { populateFlowStageYMap } from './flowSync';

export function addFlowStageMutation(ydoc: Y.Doc, stage: FlowStageMarker): void {
  const yProject = ydoc.getMap('project');
  const yViewConfig = yProject.get('viewConfig') as Y.Map<unknown>;
  const yFlowStages = yViewConfig.get('flowStages') as Y.Array<Y.Map<unknown>>;

  const yStage = new Y.Map<unknown>();
  populateFlowStageYMap(yStage, stage);
  yFlowStages.push([yStage]);
}

export function updateFlowStageMutation(
  ydoc: Y.Doc,
  stageIndex: number,
  updates: Partial<FlowStageMarker>
): void {
  const yStage = findStageByIndex(ydoc, stageIndex);
  if (!yStage) return;

  ydoc.transact(() => {
    applyStageUpdates(yStage, updates);
  });
}

export function deleteFlowStageMutation(ydoc: Y.Doc, stageIndex: number): void {
  const yProject = ydoc.getMap('project');
  const yViewConfig = yProject.get('viewConfig') as Y.Map<unknown>;
  const yFlowStages = yViewConfig.get('flowStages') as Y.Array<Y.Map<unknown>>;

  if (stageIndex < 0 || stageIndex >= yFlowStages.length) return;

  yFlowStages.delete(stageIndex);
}

function findStageByIndex(ydoc: Y.Doc, stageIndex: number): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yViewConfig = yProject.get('viewConfig') as Y.Map<unknown>;
  const yFlowStages = yViewConfig.get('flowStages') as Y.Array<Y.Map<unknown>>;

  if (stageIndex < 0 || stageIndex >= yFlowStages.length) return null;

  return yFlowStages.get(stageIndex);
}

function applyStageUpdates(
  yStage: Y.Map<unknown>,
  updates: Partial<FlowStageMarker>
): void {
  if ('name' in updates) {
    yStage.set('name', updates.name);
  }

  if ('position' in updates) {
    yStage.set('position', updates.position);
  }

  const optionalFields: (keyof Pick<FlowStageMarker, 'description' | 'owner' | 'notes'>)[] = [
    'description',
    'owner',
    'notes',
  ];

  for (const field of optionalFields) {
    if (field in updates) {
      const value = updates[field];
      yStage.set(field, value ?? null);
    }
  }
}
