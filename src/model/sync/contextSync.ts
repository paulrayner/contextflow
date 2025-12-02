import * as Y from 'yjs';
import type { BoundedContext, Issue } from '../types';

export function contextToYMap(context: BoundedContext): Y.Map<unknown> {
  const tempDoc = new Y.Doc();
  const yMap = tempDoc.getMap('context');

  setRequiredFields(yMap, context);
  setOptionalFields(yMap, context);
  setPositions(yMap, context.positions);
  setCodeSize(yMap, context.codeSize);
  setIssues(yMap, context.issues);

  return yMap;
}

export function yMapToContext(yMap: Y.Map<unknown>): BoundedContext {
  const context: BoundedContext = {
    id: yMap.get('id') as string,
    name: yMap.get('name') as string,
    evolutionStage: yMap.get('evolutionStage') as BoundedContext['evolutionStage'],
    positions: extractPositions(yMap.get('positions') as Y.Map<unknown>),
  };

  assignIfNotNull(context, 'purpose', yMap.get('purpose'));
  assignIfNotNull(context, 'strategicClassification', yMap.get('strategicClassification'));
  assignIfNotNull(context, 'ownership', yMap.get('ownership'));
  assignIfNotNull(context, 'boundaryIntegrity', yMap.get('boundaryIntegrity'));
  assignIfNotNull(context, 'boundaryNotes', yMap.get('boundaryNotes'));
  assignIfNotNull(context, 'isLegacy', yMap.get('isLegacy'));
  assignIfNotNull(context, 'notes', yMap.get('notes'));
  assignIfNotNull(context, 'teamId', yMap.get('teamId'));

  const codeSize = yMap.get('codeSize');
  if (codeSize !== null) {
    context.codeSize = extractCodeSize(codeSize as Y.Map<unknown>);
  }

  const issues = yMap.get('issues');
  if (issues !== null) {
    context.issues = extractIssues(issues as Y.Array<Y.Map<unknown>>);
  }

  return context;
}

function setRequiredFields(yMap: Y.Map<unknown>, context: BoundedContext): void {
  yMap.set('id', context.id);
  yMap.set('name', context.name);
  yMap.set('evolutionStage', context.evolutionStage);
}

function setOptionalFields(yMap: Y.Map<unknown>, context: BoundedContext): void {
  yMap.set('purpose', context.purpose ?? null);
  yMap.set('strategicClassification', context.strategicClassification ?? null);
  yMap.set('ownership', context.ownership ?? null);
  yMap.set('boundaryIntegrity', context.boundaryIntegrity ?? null);
  yMap.set('boundaryNotes', context.boundaryNotes ?? null);
  yMap.set('isLegacy', context.isLegacy ?? null);
  yMap.set('notes', context.notes ?? null);
  yMap.set('teamId', context.teamId ?? null);
}

function setPositions(yMap: Y.Map<unknown>, positions: BoundedContext['positions']): void {
  const yPositions = new Y.Map<unknown>();

  const yStrategic = new Y.Map<unknown>();
  yStrategic.set('x', positions.strategic.x);

  const yFlow = new Y.Map<unknown>();
  yFlow.set('x', positions.flow.x);

  const yDistillation = new Y.Map<unknown>();
  yDistillation.set('x', positions.distillation.x);
  yDistillation.set('y', positions.distillation.y);

  const yShared = new Y.Map<unknown>();
  yShared.set('y', positions.shared.y);

  yPositions.set('strategic', yStrategic);
  yPositions.set('flow', yFlow);
  yPositions.set('distillation', yDistillation);
  yPositions.set('shared', yShared);

  yMap.set('positions', yPositions);
}

function setCodeSize(yMap: Y.Map<unknown>, codeSize: BoundedContext['codeSize']): void {
  if (!codeSize) {
    yMap.set('codeSize', null);
    return;
  }

  const yCodeSize = new Y.Map<unknown>();
  yCodeSize.set('loc', codeSize.loc ?? null);
  yCodeSize.set('bucket', codeSize.bucket ?? null);
  yMap.set('codeSize', yCodeSize);
}

function setIssues(yMap: Y.Map<unknown>, issues: BoundedContext['issues']): void {
  if (!issues || issues.length === 0) {
    yMap.set('issues', null);
    return;
  }

  const yIssues = new Y.Array<Y.Map<unknown>>();
  for (const issue of issues) {
    const yIssue = new Y.Map<unknown>();
    yIssue.set('id', issue.id);
    yIssue.set('title', issue.title);
    yIssue.set('description', issue.description ?? null);
    yIssue.set('severity', issue.severity);
    yIssues.push([yIssue]);
  }
  yMap.set('issues', yIssues);
}

function extractPositions(yPositions: Y.Map<unknown>): BoundedContext['positions'] {
  const strategic = yPositions.get('strategic') as Y.Map<unknown>;
  const flow = yPositions.get('flow') as Y.Map<unknown>;
  const distillation = yPositions.get('distillation') as Y.Map<unknown>;
  const shared = yPositions.get('shared') as Y.Map<unknown>;

  return {
    strategic: { x: strategic.get('x') as number },
    flow: { x: flow.get('x') as number },
    distillation: {
      x: distillation.get('x') as number,
      y: distillation.get('y') as number,
    },
    shared: { y: shared.get('y') as number },
  };
}

function extractCodeSize(yCodeSize: Y.Map<unknown>): NonNullable<BoundedContext['codeSize']> {
  const result: NonNullable<BoundedContext['codeSize']> = {};

  const loc = yCodeSize.get('loc');
  if (loc !== null) result.loc = loc as number;

  const bucket = yCodeSize.get('bucket');
  if (bucket !== null) result.bucket = bucket as NonNullable<BoundedContext['codeSize']>['bucket'];

  return result;
}

function extractIssues(yIssues: Y.Array<Y.Map<unknown>>): Issue[] {
  const issues: Issue[] = [];

  for (let i = 0; i < yIssues.length; i++) {
    const yIssue = yIssues.get(i);
    const issue: Issue = {
      id: yIssue.get('id') as string,
      title: yIssue.get('title') as string,
      severity: yIssue.get('severity') as Issue['severity'],
    };

    const description = yIssue.get('description');
    if (description !== null) issue.description = description as string;

    issues.push(issue);
  }

  return issues;
}

function assignIfNotNull<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: unknown
): void {
  if (value !== null) {
    target[key] = value as T[K];
  }
}
