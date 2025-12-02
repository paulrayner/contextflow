import * as Y from 'yjs';
import type { FlowStageMarker } from '../types';

export function populateFlowStageYMap(yMap: Y.Map<unknown>, stage: FlowStageMarker): void {
  yMap.set('name', stage.name);
  yMap.set('position', stage.position);
  yMap.set('description', stage.description ?? null);
  yMap.set('owner', stage.owner ?? null);
  yMap.set('notes', stage.notes ?? null);
}

export function flowStageToYMap(stage: FlowStageMarker): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('stage');
  populateFlowStageYMap(yMap, stage);
  return yMap;
}

export function yMapToFlowStage(yMap: Y.Map<unknown>): FlowStageMarker {
  const stage: FlowStageMarker = {
    name: yMap.get('name') as string,
    position: yMap.get('position') as number,
  };

  const description = yMap.get('description');
  if (description !== null) {
    stage.description = description as string;
  }

  const owner = yMap.get('owner');
  if (owner !== null) {
    stage.owner = owner as string;
  }

  const notes = yMap.get('notes');
  if (notes !== null) {
    stage.notes = notes as string;
  }

  return stage;
}
