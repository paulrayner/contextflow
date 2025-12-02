import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useEditorStore } from '../../store';
import {
  initializeCollabMode,
  destroyCollabMode,
  isCollabModeActive,
  getCollabUndoRedo,
} from '../useCollabMode';
import type { Project } from '../../types';

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
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: {
      flowStages: [],
    },
    temporal: {
      enabled: false,
      keyframes: [],
    },
  };
}

describe('Store Collab Integration', () => {
  let testProject: Project;

  beforeEach(() => {
    testProject = createTestProject();
    destroyCollabMode();

    // Reset store with test project
    useEditorStore.setState({
      activeProjectId: testProject.id,
      projects: { [testProject.id]: testProject },
      undoStack: [],
      redoStack: [],
    });
  });

  afterEach(() => {
    destroyCollabMode();
  });

  describe('context mutations route through Yjs when collab mode active', () => {
    beforeEach(() => {
      const onProjectChange = (project: Project): void => {
        useEditorStore.setState((state) => ({
          projects: {
            ...state.projects,
            [project.id]: project,
          },
        }));
      };
      initializeCollabMode(testProject, { onProjectChange });
    });

    it('addContext routes through Yjs and updates Zustand state', () => {
      expect(isCollabModeActive()).toBe(true);

      useEditorStore.getState().addContext('New Context');

      const state = useEditorStore.getState();
      const project = state.projects[testProject.id];

      expect(project.contexts).toHaveLength(2);
      expect(project.contexts[1].name).toBe('New Context');
    });

    it('updateContext routes through Yjs and updates Zustand state', () => {
      useEditorStore.getState().updateContext('ctx-1', { name: 'Updated Name' });

      const state = useEditorStore.getState();
      const project = state.projects[testProject.id];

      expect(project.contexts[0].name).toBe('Updated Name');
    });

    it('deleteContext routes through Yjs and updates Zustand state', () => {
      useEditorStore.getState().deleteContext('ctx-1');

      const state = useEditorStore.getState();
      const project = state.projects[testProject.id];

      expect(project.contexts).toHaveLength(0);
    });

    it('updateContextPosition routes through Yjs and updates Zustand state', () => {
      const newPositions = {
        flow: { x: 500 },
        strategic: { x: 600 },
        distillation: { x: 700, y: 800 },
        shared: { y: 900 },
      };

      useEditorStore.getState().updateContextPosition('ctx-1', newPositions);

      const state = useEditorStore.getState();
      const project = state.projects[testProject.id];

      expect(project.contexts[0].positions.flow.x).toBe(500);
    });
  });

  describe('undo/redo uses CollabUndoManager when collab mode active', () => {
    beforeEach(() => {
      const onProjectChange = (project: Project): void => {
        useEditorStore.setState((state) => ({
          projects: {
            ...state.projects,
            [project.id]: project,
          },
        }));
      };
      initializeCollabMode(testProject, { onProjectChange });
    });

    it('undo reverts mutation via CollabUndoManager', () => {
      useEditorStore.getState().updateContext('ctx-1', { name: 'Updated Name' });

      const state1 = useEditorStore.getState();
      expect(state1.projects[testProject.id].contexts[0].name).toBe('Updated Name');

      useEditorStore.getState().undo();

      const state2 = useEditorStore.getState();
      expect(state2.projects[testProject.id].contexts[0].name).toBe('Context One');
    });

    it('redo restores mutation via CollabUndoManager', () => {
      useEditorStore.getState().updateContext('ctx-1', { name: 'Updated Name' });
      useEditorStore.getState().undo();

      const state1 = useEditorStore.getState();
      expect(state1.projects[testProject.id].contexts[0].name).toBe('Context One');

      useEditorStore.getState().redo();

      const state2 = useEditorStore.getState();
      expect(state2.projects[testProject.id].contexts[0].name).toBe('Updated Name');
    });

    it('canUndo reflects CollabUndoManager state', () => {
      expect(getCollabUndoRedo().canUndo).toBe(false);

      useEditorStore.getState().updateContext('ctx-1', { name: 'Updated Name' });

      expect(getCollabUndoRedo().canUndo).toBe(true);
    });

    it('canRedo reflects CollabUndoManager state after undo', () => {
      useEditorStore.getState().updateContext('ctx-1', { name: 'Updated Name' });
      expect(getCollabUndoRedo().canRedo).toBe(false);

      useEditorStore.getState().undo();

      expect(getCollabUndoRedo().canRedo).toBe(true);
    });
  });

  describe('project switching with collab mode', () => {
    it('setActiveProject destroys old collab mode and initializes new one', () => {
      const onProjectChange = (project: Project): void => {
        useEditorStore.setState((state) => ({
          projects: {
            ...state.projects,
            [project.id]: project,
          },
        }));
      };
      initializeCollabMode(testProject, { onProjectChange });

      // Make a change to create undo history
      useEditorStore.getState().updateContext('ctx-1', { name: 'Updated' });
      expect(getCollabUndoRedo().canUndo).toBe(true);

      // Create and switch to a new project
      const newProject = createTestProject();
      newProject.id = 'project-2';
      newProject.name = 'Second Project';

      useEditorStore.setState((state) => ({
        projects: {
          ...state.projects,
          [newProject.id]: newProject,
        },
      }));

      useEditorStore.getState().setActiveProject('project-2');

      // After project switch, undo history should be cleared
      expect(getCollabUndoRedo().canUndo).toBe(false);
    });
  });

  describe('non-collab mode continues to work', () => {
    it('mutations work normally when collab mode is not active', () => {
      expect(isCollabModeActive()).toBe(false);

      useEditorStore.getState().updateContext('ctx-1', { name: 'Updated Name' });

      const state = useEditorStore.getState();
      const project = state.projects[testProject.id];

      expect(project.contexts[0].name).toBe('Updated Name');
    });

    it('undo/redo uses command stack when collab mode is not active', () => {
      const newPositions = {
        flow: { x: 500 },
        strategic: { x: 600 },
        distillation: { x: 700, y: 800 },
        shared: { y: 900 },
      };

      useEditorStore.getState().updateContextPosition('ctx-1', newPositions);

      const state1 = useEditorStore.getState();
      expect(state1.projects[testProject.id].contexts[0].positions.flow.x).toBe(500);
      expect(state1.undoStack.length).toBe(1);

      useEditorStore.getState().undo();

      const state2 = useEditorStore.getState();
      expect(state2.projects[testProject.id].contexts[0].positions.flow.x).toBe(100);
    });
  });

  describe('relationship mutations route through Yjs when collab mode active', () => {
    beforeEach(() => {
      // Add a second context for relationships
      testProject.contexts.push({
        id: 'ctx-2',
        name: 'Context Two',
        evolutionStage: 'genesis',
        positions: {
          flow: { x: 50 },
          strategic: { x: 60 },
          distillation: { x: 70, y: 80 },
          shared: { y: 90 },
        },
      });

      useEditorStore.setState({
        activeProjectId: testProject.id,
        projects: { [testProject.id]: testProject },
        undoStack: [],
        redoStack: [],
      });

      const onProjectChange = (project: Project): void => {
        useEditorStore.setState((state) => ({
          projects: {
            ...state.projects,
            [project.id]: project,
          },
        }));
      };
      initializeCollabMode(testProject, { onProjectChange });
    });

    it('addRelationship routes through Yjs and updates Zustand state', () => {
      expect(isCollabModeActive()).toBe(true);

      useEditorStore.getState().addRelationship('ctx-1', 'ctx-2', 'customer-supplier');

      const state = useEditorStore.getState();
      const project = state.projects[testProject.id];

      expect(project.relationships).toHaveLength(1);
      expect(project.relationships[0].fromContextId).toBe('ctx-1');
      expect(project.relationships[0].toContextId).toBe('ctx-2');
      expect(project.relationships[0].pattern).toBe('customer-supplier');
    });

    it('updateRelationship routes through Yjs and updates Zustand state', () => {
      // First add a relationship
      useEditorStore.getState().addRelationship('ctx-1', 'ctx-2', 'customer-supplier');

      const state1 = useEditorStore.getState();
      const relId = state1.projects[testProject.id].relationships[0].id;

      // Then update it
      useEditorStore.getState().updateRelationship(relId, { pattern: 'partnership' });

      const state2 = useEditorStore.getState();
      const project = state2.projects[testProject.id];

      expect(project.relationships[0].pattern).toBe('partnership');
    });

    it('deleteRelationship routes through Yjs and updates Zustand state', () => {
      // First add a relationship
      useEditorStore.getState().addRelationship('ctx-1', 'ctx-2', 'customer-supplier');

      const state1 = useEditorStore.getState();
      const relId = state1.projects[testProject.id].relationships[0].id;

      // Then delete it
      useEditorStore.getState().deleteRelationship(relId);

      const state2 = useEditorStore.getState();
      const project = state2.projects[testProject.id];

      expect(project.relationships).toHaveLength(0);
    });

    it('swapRelationshipDirection routes through Yjs and updates Zustand state', () => {
      // First add a relationship
      useEditorStore.getState().addRelationship('ctx-1', 'ctx-2', 'customer-supplier');

      const state1 = useEditorStore.getState();
      const relId = state1.projects[testProject.id].relationships[0].id;

      // Then swap direction
      useEditorStore.getState().swapRelationshipDirection(relId);

      const state2 = useEditorStore.getState();
      const project = state2.projects[testProject.id];

      expect(project.relationships[0].fromContextId).toBe('ctx-2');
      expect(project.relationships[0].toContextId).toBe('ctx-1');
    });

    it('undo reverts relationship addition via CollabUndoManager', () => {
      useEditorStore.getState().addRelationship('ctx-1', 'ctx-2', 'customer-supplier');

      const state1 = useEditorStore.getState();
      expect(state1.projects[testProject.id].relationships).toHaveLength(1);

      useEditorStore.getState().undo();

      const state2 = useEditorStore.getState();
      expect(state2.projects[testProject.id].relationships).toHaveLength(0);
    });

    it('undo reverts relationship update via CollabUndoManager', () => {
      useEditorStore.getState().addRelationship('ctx-1', 'ctx-2', 'customer-supplier');

      const state1 = useEditorStore.getState();
      const relId = state1.projects[testProject.id].relationships[0].id;

      useEditorStore.getState().updateRelationship(relId, { pattern: 'partnership' });

      const state2 = useEditorStore.getState();
      expect(state2.projects[testProject.id].relationships[0].pattern).toBe('partnership');

      useEditorStore.getState().undo();

      const state3 = useEditorStore.getState();
      expect(state3.projects[testProject.id].relationships[0].pattern).toBe('customer-supplier');
    });

    it('undo reverts relationship deletion via CollabUndoManager', () => {
      useEditorStore.getState().addRelationship('ctx-1', 'ctx-2', 'customer-supplier');

      const state1 = useEditorStore.getState();
      const relId = state1.projects[testProject.id].relationships[0].id;

      useEditorStore.getState().deleteRelationship(relId);

      const state2 = useEditorStore.getState();
      expect(state2.projects[testProject.id].relationships).toHaveLength(0);

      useEditorStore.getState().undo();

      const state3 = useEditorStore.getState();
      expect(state3.projects[testProject.id].relationships).toHaveLength(1);
    });
  });
});
