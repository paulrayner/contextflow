import { describe, it, expect, vi, type Mock } from 'vitest';
import * as Y from 'yjs';
import { projectToYDoc, yDocToProject } from '../sync/projectSync';
import type { Project } from '../types';

function loadExistingProjectFromYDoc(
  ydoc: Y.Doc,
  onProjectLoaded: (project: Project) => void
): void {
  const yProject = ydoc.getMap('project');
  if (yProject.has('id')) {
    onProjectLoaded(yDocToProject(ydoc));
  }
}

function createTestProject(): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [
      {
        id: 'ctx-1',
        name: 'Context One',
        evolutionStage: 'custom-built',
        positions: {
          flow: { x: 100 },
          strategic: { x: 200 },
          distillation: { x: 300, y: 300 },
          shared: { y: 100 },
        },
      },
    ],
    relationships: [],
    groups: [],
    repos: [],
    people: [],
    teams: [],
    users: [
      {
        id: 'user-1',
        name: 'CSR',
        position: 0,
      },
      {
        id: 'user-2',
        name: 'Warranty Admin',
        position: 1,
      },
    ],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: {
      flowStages: [],
    },
  };
}

describe('loadExistingProjectFromYDoc', () => {
  it('loads project data when Y.Doc has existing data', () => {
    const existingProject = createTestProject();
    const ydoc = projectToYDoc(existingProject);
    const onProjectLoaded: Mock<(project: Project) => void> = vi.fn();

    loadExistingProjectFromYDoc(ydoc, onProjectLoaded);

    expect(onProjectLoaded).toHaveBeenCalledTimes(1);
    const loadedProject = onProjectLoaded.mock.calls[0][0];
    expect(loadedProject.id).toBe('test-project');
    expect(loadedProject.name).toBe('Test Project');
    expect(loadedProject.contexts).toHaveLength(1);
    expect(loadedProject.users).toHaveLength(2);
    expect(loadedProject.users[0].name).toBe('CSR');
    expect(loadedProject.users[1].name).toBe('Warranty Admin');
  });

  it('does not call callback when Y.Doc is empty', () => {
    const ydoc = new Y.Doc();
    const onProjectLoaded: Mock<(project: Project) => void> = vi.fn();

    loadExistingProjectFromYDoc(ydoc, onProjectLoaded);

    expect(onProjectLoaded).not.toHaveBeenCalled();
  });

  it('preserves all project entities when loading', () => {
    const existingProject = createTestProject();
    existingProject.relationships = [
      {
        id: 'rel-1',
        fromContextId: 'ctx-1',
        toContextId: 'ctx-2',
        pattern: 'customer-supplier',
      },
    ];
    existingProject.groups = [
      {
        id: 'group-1',
        label: 'Test Group',
        color: '#ff0000',
        contextIds: ['ctx-1'],
      },
    ];

    const ydoc = projectToYDoc(existingProject);
    const onProjectLoaded: Mock<(project: Project) => void> = vi.fn();

    loadExistingProjectFromYDoc(ydoc, onProjectLoaded);

    const loadedProject = onProjectLoaded.mock.calls[0][0];
    expect(loadedProject.relationships).toHaveLength(1);
    expect(loadedProject.relationships[0].pattern).toBe('customer-supplier');
    expect(loadedProject.groups).toHaveLength(1);
    expect(loadedProject.groups[0].label).toBe('Test Group');
  });

  describe('simulates joining existing shared project', () => {
    it('second client receives all data from first client', () => {
      // First client creates project and populates Y.Doc
      const firstClientProject = createTestProject();
      const sharedYDoc = projectToYDoc(firstClientProject);

      // Second client joins - Y.Doc already has data
      // This simulates what loadSharedProject does
      const secondClientCallback: Mock<(project: Project) => void> = vi.fn();

      loadExistingProjectFromYDoc(sharedYDoc, secondClientCallback);

      expect(secondClientCallback).toHaveBeenCalledTimes(1);
      const secondClientProject = secondClientCallback.mock.calls[0][0];

      // Verify second client sees all the data
      expect(secondClientProject.id).toBe(firstClientProject.id);
      expect(secondClientProject.name).toBe(firstClientProject.name);
      expect(secondClientProject.contexts).toHaveLength(1);
      expect(secondClientProject.users).toHaveLength(2);
    });
  });
});
