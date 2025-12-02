import * as Y from 'yjs';
import type { TemporalKeyframe } from '../types';
import { populateTemporalKeyframeYMap } from './strategicSync';

export function addKeyframeMutation(ydoc: Y.Doc, keyframe: TemporalKeyframe): void {
  const yTemporal = getTemporalMap(ydoc);
  if (!yTemporal) return;

  const yKeyframes = yTemporal.get('keyframes') as Y.Array<Y.Map<unknown>>;
  const yKeyframe = new Y.Map<unknown>();
  populateTemporalKeyframeYMap(yKeyframe, keyframe);
  yKeyframes.push([yKeyframe]);
}

export function updateKeyframeMutation(
  ydoc: Y.Doc,
  keyframeId: string,
  updates: Partial<TemporalKeyframe>
): void {
  const yKeyframe = findKeyframeById(ydoc, keyframeId);
  if (!yKeyframe) return;

  ydoc.transact(() => {
    applyKeyframeUpdates(yKeyframe, updates);
  });
}

export function deleteKeyframeMutation(ydoc: Y.Doc, keyframeId: string): void {
  const yTemporal = getTemporalMap(ydoc);
  if (!yTemporal) return;

  const yKeyframes = yTemporal.get('keyframes') as Y.Array<Y.Map<unknown>>;
  const index = findKeyframeIndexById(yKeyframes, keyframeId);
  if (index === -1) return;

  yKeyframes.delete(index);
}

export function updateKeyframeContextPositionMutation(
  ydoc: Y.Doc,
  keyframeId: string,
  contextId: string,
  position: { x: number; y: number }
): void {
  const yKeyframe = findKeyframeById(ydoc, keyframeId);
  if (!yKeyframe) return;

  ydoc.transact(() => {
    const yPositions = yKeyframe.get('positions') as Y.Map<Y.Map<unknown>>;
    let yPos = yPositions.get(contextId);
    if (!yPos) {
      yPos = new Y.Map<unknown>();
      yPositions.set(contextId, yPos);
    }
    yPos.set('x', position.x);
    yPos.set('y', position.y);
  });
}

function getTemporalMap(ydoc: Y.Doc): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yTemporal = yProject.get('temporal');
  if (!yTemporal) return null;
  return yTemporal as Y.Map<unknown>;
}

function findKeyframeById(ydoc: Y.Doc, keyframeId: string): Y.Map<unknown> | null {
  const yTemporal = getTemporalMap(ydoc);
  if (!yTemporal) return null;

  const yKeyframes = yTemporal.get('keyframes') as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yKeyframes.length; i++) {
    const yKeyframe = yKeyframes.get(i);
    if (yKeyframe.get('id') === keyframeId) {
      return yKeyframe;
    }
  }
  return null;
}

function findKeyframeIndexById(
  yKeyframes: Y.Array<Y.Map<unknown>>,
  keyframeId: string
): number {
  for (let i = 0; i < yKeyframes.length; i++) {
    const yKeyframe = yKeyframes.get(i);
    if (yKeyframe.get('id') === keyframeId) {
      return i;
    }
  }
  return -1;
}

function applyKeyframeUpdates(
  yKeyframe: Y.Map<unknown>,
  updates: Partial<TemporalKeyframe>
): void {
  if ('label' in updates) {
    yKeyframe.set('label', updates.label ?? null);
  }
  if ('date' in updates) {
    yKeyframe.set('date', updates.date);
  }
  if ('activeContextIds' in updates && updates.activeContextIds) {
    const yActiveIds = yKeyframe.get('activeContextIds') as Y.Array<string>;
    yActiveIds.delete(0, yActiveIds.length);
    yActiveIds.push(updates.activeContextIds);
  }
}
