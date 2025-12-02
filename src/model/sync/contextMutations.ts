import * as Y from 'yjs';
import type { BoundedContext } from '../types';
import { populateContextYMap } from './contextSync';

export function addContextMutation(ydoc: Y.Doc, context: BoundedContext): void {
  const yProject = ydoc.getMap('project');
  const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

  const yContext = new Y.Map<unknown>();
  populateContextYMap(yContext, context);
  yContexts.push([yContext]);
}

export function updateContextMutation(
  ydoc: Y.Doc,
  contextId: string,
  updates: Partial<BoundedContext>
): void {
  ydoc.transact(() => {
    const yContext = findContextById(ydoc, contextId);
    if (!yContext) return;

    applyScalarUpdates(yContext, updates);
    applyCodeSizeUpdate(yContext, updates);
  });
}

export function deleteContextMutation(ydoc: Y.Doc, contextId: string): void {
  const yProject = ydoc.getMap('project');
  const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

  const index = findContextIndex(yContexts, contextId);
  if (index === -1) return;

  yContexts.delete(index);
}

export function updateContextPositionMutation(
  ydoc: Y.Doc,
  contextId: string,
  positions: BoundedContext['positions']
): void {
  ydoc.transact(() => {
    const yContext = findContextById(ydoc, contextId);
    if (!yContext) return;

    const yPositions = yContext.get('positions') as Y.Map<Y.Map<unknown>>;

    const yFlow = yPositions.get('flow') as Y.Map<number>;
    yFlow.set('x', positions.flow.x);

    const yStrategic = yPositions.get('strategic') as Y.Map<number>;
    yStrategic.set('x', positions.strategic.x);

    const yDistillation = yPositions.get('distillation') as Y.Map<number>;
    yDistillation.set('x', positions.distillation.x);
    yDistillation.set('y', positions.distillation.y);

    const yShared = yPositions.get('shared') as Y.Map<number>;
    yShared.set('y', positions.shared.y);
  });
}

function findContextById(ydoc: Y.Doc, contextId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

  const index = findContextIndex(yContexts, contextId);
  if (index === -1) return null;

  return yContexts.get(index);
}

function findContextIndex(yContexts: Y.Array<Y.Map<unknown>>, contextId: string): number {
  for (let i = 0; i < yContexts.length; i++) {
    const yContext = yContexts.get(i);
    if (yContext.get('id') === contextId) {
      return i;
    }
  }
  return -1;
}

function applyScalarUpdates(yContext: Y.Map<unknown>, updates: Partial<BoundedContext>): void {
  const scalarFields: (keyof BoundedContext)[] = [
    'name',
    'purpose',
    'strategicClassification',
    'ownership',
    'boundaryIntegrity',
    'boundaryNotes',
    'evolutionStage',
    'isLegacy',
    'notes',
    'teamId',
  ];

  for (const field of scalarFields) {
    if (field in updates) {
      const value = updates[field];
      yContext.set(field, value ?? null);
    }
  }
}

function applyCodeSizeUpdate(yContext: Y.Map<unknown>, updates: Partial<BoundedContext>): void {
  if (!('codeSize' in updates)) return;

  const codeSize = updates.codeSize;
  if (!codeSize) {
    yContext.set('codeSize', null);
    return;
  }

  const yCodeSize = new Y.Map<unknown>();
  yCodeSize.set('loc', codeSize.loc ?? null);
  yCodeSize.set('bucket', codeSize.bucket ?? null);
  yContext.set('codeSize', yCodeSize);
}
