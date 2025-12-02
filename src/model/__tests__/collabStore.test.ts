import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCollabStore, ConnectionState, getCollabHost } from '../collabStore';

describe('collabStore', () => {
  beforeEach(() => {
    useCollabStore.getState().reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('initial state', () => {
    it('starts disconnected with no active project', () => {
      const state = useCollabStore.getState();

      expect(state.connectionState).toBe('disconnected');
      expect(state.activeProjectId).toBeNull();
      expect(state.ydoc).toBeNull();
      expect(state.provider).toBeNull();
    });

    it('has no error initially', () => {
      const state = useCollabStore.getState();

      expect(state.error).toBeNull();
    });
  });

  describe('connection state types', () => {
    it('has valid ConnectionState type values', () => {
      const validStates: ConnectionState[] = [
        'disconnected',
        'connecting',
        'connected',
        'syncing',
        'offline',
        'error',
      ];

      validStates.forEach((state) => {
        expect(typeof state).toBe('string');
      });
    });
  });

  describe('setConnectionState', () => {
    it('updates connection state', () => {
      const store = useCollabStore.getState();

      store.setConnectionState('connecting');
      expect(useCollabStore.getState().connectionState).toBe('connecting');

      store.setConnectionState('connected');
      expect(useCollabStore.getState().connectionState).toBe('connected');
    });

    it('clears error when transitioning to connected', () => {
      const store = useCollabStore.getState();

      store.setError('Previous error');
      expect(useCollabStore.getState().error).toBe('Previous error');

      store.setConnectionState('connected');
      expect(useCollabStore.getState().error).toBeNull();
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      const store = useCollabStore.getState();

      store.setError('Connection failed');
      expect(useCollabStore.getState().error).toBe('Connection failed');
    });

    it('sets connection state to error when setting error', () => {
      const store = useCollabStore.getState();

      store.setError('Something went wrong');
      expect(useCollabStore.getState().connectionState).toBe('error');
    });
  });

  describe('setActiveProjectId', () => {
    it('updates active project id', () => {
      const store = useCollabStore.getState();

      store.setActiveProjectId('project-123');
      expect(useCollabStore.getState().activeProjectId).toBe('project-123');
    });

    it('allows clearing active project', () => {
      const store = useCollabStore.getState();

      store.setActiveProjectId('project-123');
      store.setActiveProjectId(null);
      expect(useCollabStore.getState().activeProjectId).toBeNull();
    });
  });

  describe('isOnline', () => {
    it('returns true when connected', () => {
      const store = useCollabStore.getState();

      store.setConnectionState('connected');
      expect(useCollabStore.getState().isOnline).toBe(true);
    });

    it('returns true when syncing', () => {
      const store = useCollabStore.getState();

      store.setConnectionState('syncing');
      expect(useCollabStore.getState().isOnline).toBe(true);
    });

    it('returns false when disconnected', () => {
      const store = useCollabStore.getState();

      store.setConnectionState('disconnected');
      expect(useCollabStore.getState().isOnline).toBe(false);
    });

    it('returns false when offline', () => {
      const store = useCollabStore.getState();

      store.setConnectionState('offline');
      expect(useCollabStore.getState().isOnline).toBe(false);
    });

    it('returns false when in error state', () => {
      const store = useCollabStore.getState();

      store.setConnectionState('error');
      expect(useCollabStore.getState().isOnline).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      const store = useCollabStore.getState();

      store.setConnectionState('connected');
      store.setActiveProjectId('project-123');
      store.setError('Some error');

      store.reset();

      const state = useCollabStore.getState();
      expect(state.connectionState).toBe('disconnected');
      expect(state.activeProjectId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.ydoc).toBeNull();
      expect(state.provider).toBeNull();
    });
  });

  describe('getCollabHost', () => {
    it('returns localhost:8787 as default when VITE_COLLAB_HOST is not set', () => {
      vi.stubEnv('VITE_COLLAB_HOST', '');
      const host = getCollabHost();
      expect(host).toBe('localhost:8787');
    });

    it('returns configured host from environment variable', () => {
      vi.stubEnv('VITE_COLLAB_HOST', 'contextflow-collab.workers.dev');
      const host = getCollabHost();
      expect(host).toBe('contextflow-collab.workers.dev');
    });
  });

  describe('connectToProject', () => {
    it('sets state to connecting when called', async () => {
      const store = useCollabStore.getState();

      // Start connection (it will fail without actual server, but state should update)
      const promise = store.connectToProject('test-project-123');

      // Connection state should immediately be 'connecting'
      expect(useCollabStore.getState().connectionState).toBe('connecting');
      expect(useCollabStore.getState().activeProjectId).toBe('test-project-123');

      // Wait for promise to settle (will fail in test env, that's ok)
      await promise.catch(() => {});
    });

    it('creates a new Y.Doc for the project', async () => {
      const store = useCollabStore.getState();

      await store.connectToProject('test-project-456').catch(() => {});

      // Y.Doc should be created regardless of connection success
      expect(useCollabStore.getState().ydoc).not.toBeNull();
    });

    it('disconnects existing connection before creating new one', async () => {
      const store = useCollabStore.getState();

      // Simulate an existing connection
      store.setConnectionState('connected');
      store.setActiveProjectId('old-project');

      await store.connectToProject('new-project').catch(() => {});

      expect(useCollabStore.getState().activeProjectId).toBe('new-project');
    });
  });

  describe('disconnect', () => {
    it('sets state to disconnected', () => {
      const store = useCollabStore.getState();

      store.setConnectionState('connected');
      store.setActiveProjectId('project-123');

      store.disconnect();

      expect(useCollabStore.getState().connectionState).toBe('disconnected');
    });

    it('clears activeProjectId', () => {
      const store = useCollabStore.getState();

      store.setActiveProjectId('project-123');

      store.disconnect();

      expect(useCollabStore.getState().activeProjectId).toBeNull();
    });

    it('clears ydoc reference', () => {
      const store = useCollabStore.getState();

      // Create a mock ydoc
      const mockYDoc = { destroy: vi.fn() } as any;
      store.setYDoc(mockYDoc);

      store.disconnect();

      expect(useCollabStore.getState().ydoc).toBeNull();
    });

    it('clears provider reference', () => {
      const store = useCollabStore.getState();

      // Create a mock provider
      const mockProvider = { destroy: vi.fn() } as any;
      store.setProvider(mockProvider);

      store.disconnect();

      expect(useCollabStore.getState().provider).toBeNull();
    });
  });
});
