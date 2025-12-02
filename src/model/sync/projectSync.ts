import * as Y from 'yjs';
import type { Project } from '../types';
import { populateContextYMap, yMapToContext } from './contextSync';
import { populateRelationshipYMap, yMapToRelationship } from './relationshipSync';
import { populateGroupYMap, yMapToGroup } from './groupSync';
import { populateFlowStageYMap, yMapToFlowStage } from './flowSync';
import { populateRepoYMap, populatePersonYMap, populateTeamYMap, yMapToRepo, yMapToPerson, yMapToTeam } from './metadataSync';
import {
  populateUserYMap,
  populateUserNeedYMap,
  populateUserNeedConnectionYMap,
  populateNeedContextConnectionYMap,
  populateTemporalKeyframeYMap,
  yMapToUser,
  yMapToUserNeed,
  yMapToUserNeedConnection,
  yMapToNeedContextConnection,
  yMapToTemporalKeyframe,
} from './strategicSync';

export function projectToYDoc(project: Project): Y.Doc {
  const doc = new Y.Doc();
  const yProject = doc.getMap('project');

  setScalarFields(yProject, project);
  setEntityArrays(yProject, project);
  setViewConfig(yProject, project);
  setTemporal(yProject, project);

  return doc;
}

export function yDocToProject(doc: Y.Doc): Project {
  const yProject = doc.getMap('project');

  const project: Project = {
    id: yProject.get('id') as string,
    name: yProject.get('name') as string,
    contexts: extractArray(yProject, 'contexts', yMapToContext),
    relationships: extractArray(yProject, 'relationships', yMapToRelationship),
    repos: extractArray(yProject, 'repos', yMapToRepo),
    people: extractArray(yProject, 'people', yMapToPerson),
    teams: extractArray(yProject, 'teams', yMapToTeam),
    groups: extractArray(yProject, 'groups', yMapToGroup),
    users: extractArray(yProject, 'users', yMapToUser),
    userNeeds: extractArray(yProject, 'userNeeds', yMapToUserNeed),
    userNeedConnections: extractArray(yProject, 'userNeedConnections', yMapToUserNeedConnection),
    needContextConnections: extractArray(yProject, 'needContextConnections', yMapToNeedContextConnection),
    viewConfig: extractViewConfig(yProject),
  };

  const version = yProject.get('version');
  if (version !== null) {
    project.version = version as number;
  }

  const createdAt = yProject.get('createdAt');
  if (createdAt !== null) {
    project.createdAt = createdAt as string;
  }

  const updatedAt = yProject.get('updatedAt');
  if (updatedAt !== null) {
    project.updatedAt = updatedAt as string;
  }

  const temporal = extractTemporal(yProject);
  if (temporal !== null) {
    project.temporal = temporal;
  }

  return project;
}

function setScalarFields(yProject: Y.Map<unknown>, project: Project): void {
  yProject.set('id', project.id);
  yProject.set('name', project.name);
  yProject.set('version', project.version ?? null);
  yProject.set('createdAt', project.createdAt ?? null);
  yProject.set('updatedAt', project.updatedAt ?? null);
}

function setEntityArrays(yProject: Y.Map<unknown>, project: Project): void {
  yProject.set('contexts', createEntityArray(project.contexts, populateContextYMap));
  yProject.set('relationships', createEntityArray(project.relationships, populateRelationshipYMap));
  yProject.set('repos', createEntityArray(project.repos, populateRepoYMap));
  yProject.set('people', createEntityArray(project.people, populatePersonYMap));
  yProject.set('teams', createEntityArray(project.teams, populateTeamYMap));
  yProject.set('groups', createEntityArray(project.groups, populateGroupYMap));
  yProject.set('users', createEntityArray(project.users, populateUserYMap));
  yProject.set('userNeeds', createEntityArray(project.userNeeds, populateUserNeedYMap));
  yProject.set('userNeedConnections', createEntityArray(project.userNeedConnections, populateUserNeedConnectionYMap));
  yProject.set('needContextConnections', createEntityArray(project.needContextConnections, populateNeedContextConnectionYMap));
}

function setViewConfig(yProject: Y.Map<unknown>, project: Project): void {
  const yViewConfig = new Y.Map<unknown>();
  yViewConfig.set('flowStages', createEntityArray(project.viewConfig.flowStages, populateFlowStageYMap));
  yProject.set('viewConfig', yViewConfig);
}

function setTemporal(yProject: Y.Map<unknown>, project: Project): void {
  if (!project.temporal) {
    yProject.set('temporal', null);
    return;
  }

  const yTemporal = new Y.Map<unknown>();
  yTemporal.set('enabled', project.temporal.enabled);
  yTemporal.set('keyframes', createEntityArray(project.temporal.keyframes, populateTemporalKeyframeYMap));
  yProject.set('temporal', yTemporal);
}

function createEntityArray<T>(
  entities: T[],
  populateFn: (yMap: Y.Map<unknown>, entity: T) => void
): Y.Array<Y.Map<unknown>> {
  const yArray = new Y.Array<Y.Map<unknown>>();
  for (const entity of entities) {
    const yMap = new Y.Map<unknown>();
    populateFn(yMap, entity);
    yArray.push([yMap]);
  }
  return yArray;
}

function extractArray<T>(
  yProject: Y.Map<unknown>,
  key: string,
  fromYMap: (yMap: Y.Map<unknown>) => T
): T[] {
  const yArray = yProject.get(key) as Y.Array<Y.Map<unknown>>;
  const result: T[] = [];
  for (let i = 0; i < yArray.length; i++) {
    result.push(fromYMap(yArray.get(i)));
  }
  return result;
}

function extractViewConfig(yProject: Y.Map<unknown>): Project['viewConfig'] {
  const yViewConfig = yProject.get('viewConfig') as Y.Map<unknown>;
  const yFlowStages = yViewConfig.get('flowStages') as Y.Array<Y.Map<unknown>>;

  const flowStages = [];
  for (let i = 0; i < yFlowStages.length; i++) {
    flowStages.push(yMapToFlowStage(yFlowStages.get(i)));
  }

  return { flowStages };
}

function extractTemporal(yProject: Y.Map<unknown>): Project['temporal'] | null {
  const yTemporal = yProject.get('temporal');
  if (yTemporal === null) {
    return null;
  }

  const yTemporalMap = yTemporal as Y.Map<unknown>;
  const yKeyframes = yTemporalMap.get('keyframes') as Y.Array<Y.Map<unknown>>;

  const keyframes = [];
  for (let i = 0; i < yKeyframes.length; i++) {
    keyframes.push(yMapToTemporalKeyframe(yKeyframes.get(i)));
  }

  return {
    enabled: yTemporalMap.get('enabled') as boolean,
    keyframes,
  };
}
