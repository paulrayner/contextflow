import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCollabStore, ConnectionState } from '../collabStore';

describe('collabStore', () => {
  beforeEach(() => {
    useCollabStore.getState().reset();
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
});
