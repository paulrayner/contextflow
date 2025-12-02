import * as Y from 'yjs';
import type { Relationship } from '../types';

export function populateRelationshipYMap(yMap: Y.Map<unknown>, relationship: Relationship): void {
  yMap.set('id', relationship.id);
  yMap.set('fromContextId', relationship.fromContextId);
  yMap.set('toContextId', relationship.toContextId);
  yMap.set('pattern', relationship.pattern);
  yMap.set('communicationMode', relationship.communicationMode ?? null);
  yMap.set('description', relationship.description ?? null);
}

export function relationshipToYMap(relationship: Relationship): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('relationship');
  populateRelationshipYMap(yMap, relationship);
  return yMap;
}

export function yMapToRelationship(yMap: Y.Map<unknown>): Relationship {
  const relationship: Relationship = {
    id: yMap.get('id') as string,
    fromContextId: yMap.get('fromContextId') as string,
    toContextId: yMap.get('toContextId') as string,
    pattern: yMap.get('pattern') as Relationship['pattern'],
  };

  const communicationMode = yMap.get('communicationMode');
  if (communicationMode !== null) {
    relationship.communicationMode = communicationMode as string;
  }

  const description = yMap.get('description');
  if (description !== null) {
    relationship.description = description as string;
  }

  return relationship;
}
