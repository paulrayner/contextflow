import { create } from 'zustand';
import * as Y from 'yjs';
import { trackEvent } from '../utils/analytics';

/**
 * Type stub for y-partyserver provider.
 * The actual import uses y-partyserver/provider but TypeScript's Node resolution
 * can't resolve subpath exports. We use a minimal interface for type safety.
 */
interface YProviderInterface {
  connect: () => void | Promise<void>;
  disconnect: () => void;
  destroy: () => void;
  awareness: unknown;
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'offline'
  | 'reconnecting'
  | 'error';

interface CollabState {
  connectionState: ConnectionState;
  activeProjectId: string | null;
  ydoc: Y.Doc | null;
  provider: YProviderInterface | null;
  error: string | null;
  isOnline: boolean;
  reconnectAttempts: number;

  setConnectionState: (state: ConnectionState) => void;
  setActiveProjectId: (projectId: string | null) => void;
  setYDoc: (ydoc: Y.Doc | null) => void;
  setProvider: (provider: YProviderInterface | null) => void;
  setError: (error: string | null) => void;
  connectToProject: (projectId: string) => Promise<void>;
  disconnect: () => void;
  reset: () => void;
}

const ONLINE_STATES: ConnectionState[] = ['connected', 'syncing'];
const CONNECTION_TIMEOUT_MS = 10000;
const MAX_BACKOFF_TIME_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

function computeIsOnline(connectionState: ConnectionState): boolean {
  return ONLINE_STATES.includes(connectionState);
}

function logStateTransition(
  previousState: ConnectionState,
  newState: ConnectionState,
  error?: string | null
): void {
  if (previousState === newState) return;

  if (error) {
    console.debug('[collab]', previousState, '→', newState, { error });
  } else {
    console.debug('[collab]', previousState, '→', newState);
  }
}

function trackConnectionEvent(
  newState: ConnectionState,
  projectId: string | null,
  reconnectAttempts: number,
  error?: string | null
): void {
  switch (newState) {
    case 'connected':
      trackEvent('collab_connected', null, { project_id: projectId });
      break;
    case 'reconnecting':
      trackEvent('collab_reconnecting', null, {
        project_id: projectId,
        attempt: reconnectAttempts,
      });
      break;
    case 'offline':
      trackEvent('collab_offline', null, { project_id: projectId });
      break;
    case 'error':
      trackEvent('collab_error', null, { project_id: projectId, error });
      break;
  }
}

function waitForInitialSync(
  provider: { on: (event: string, callback: () => void) => void },
  onSynced: () => void,
  onDisconnect: () => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, CONNECTION_TIMEOUT_MS);

    provider.on('sync', () => {
      clearTimeout(timeout);
      onSynced();
      resolve();
    });

    provider.on('connection-close', onDisconnect);
  });
}

const initialState = {
  connectionState: 'disconnected' as ConnectionState,
  activeProjectId: null as string | null,
  ydoc: null as Y.Doc | null,
  provider: null as YProviderInterface | null,
  error: null as string | null,
  isOnline: false,
  reconnectAttempts: 0,
};

const DEFAULT_COLLAB_HOST = 'localhost:8787';

export function getCollabHost(): string {
  const envHost = import.meta.env.VITE_COLLAB_HOST;
  return envHost || DEFAULT_COLLAB_HOST;
}

export const useCollabStore = create<CollabState>((set, get) => ({
  ...initialState,

  setConnectionState: (connectionState) => {
    const currentState = get();
    const previousState = currentState.connectionState;

    if (previousState === connectionState) return;

    logStateTransition(previousState, connectionState);
    trackConnectionEvent(
      connectionState,
      currentState.activeProjectId,
      currentState.reconnectAttempts
    );

    const updates: Partial<CollabState> = {
      connectionState,
      isOnline: computeIsOnline(connectionState),
    };

    if (connectionState === 'connected') {
      updates.error = null;
    }

    set(updates);
  },

  setActiveProjectId: (activeProjectId) => set({ activeProjectId }),

  setYDoc: (ydoc) => set({ ydoc }),

  setProvider: (provider) => set({ provider }),

  setError: (error) => {
    const currentState = get();
    const previousState = currentState.connectionState;
    const newState = error !== null ? 'error' : currentState.connectionState;

    if (error !== null) {
      logStateTransition(previousState, 'error', error);
      trackConnectionEvent('error', currentState.activeProjectId, currentState.reconnectAttempts, error);
    }

    set({
      error,
      connectionState: newState,
    });
  },

  connectToProject: async (projectId) => {
    const state = get();

    // Disconnect existing connection if any
    if (state.provider) {
      state.provider.destroy();
    }
    if (state.ydoc) {
      state.ydoc.destroy();
    }

    // Create new Y.Doc
    const ydoc = new Y.Doc();

    // Set connecting state immediately
    set({
      connectionState: 'connecting',
      isOnline: false,
      activeProjectId: projectId,
      ydoc,
      provider: null,
      error: null,
      reconnectAttempts: 0,
    });

    // Dynamically import y-partyserver provider to avoid bundling issues
    try {
      // @ts-expect-error - TypeScript's Node moduleResolution can't resolve subpath exports
      const { default: YProvider } = await import('y-partyserver/provider');
      const host = getCollabHost();

      const provider = new YProvider(host, projectId, ydoc, {
        connect: true,
        party: 'yjs-room',
        maxBackoffTime: MAX_BACKOFF_TIME_MS,
      });

      const markConnected = () => {
        set({
          connectionState: 'connected',
          isOnline: true,
          reconnectAttempts: 0,
          error: null,
        });
      };

      const handleDisconnect = () => {
        const currentState = get();
        if (currentState.activeProjectId !== projectId) return;

        const attempts = currentState.reconnectAttempts + 1;

        if (attempts > MAX_RECONNECT_ATTEMPTS) {
          // Give up after max attempts
          set({
            connectionState: 'offline',
            isOnline: false,
            error: 'Connection lost. Click retry to reconnect.',
          });
        } else {
          // Provider will auto-reconnect with exponential backoff
          set({
            connectionState: 'reconnecting',
            isOnline: false,
            reconnectAttempts: attempts,
          });
        }
      };

      // Listen for sync events (fires on initial connect AND reconnections)
      provider.on('sync', markConnected);

      // Listen for disconnections
      provider.on('connection-close', handleDisconnect);

      // Wait for initial sync with timeout
      await waitForInitialSync(provider, markConnected, handleDisconnect);

      set({ provider: provider as unknown as YProviderInterface });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      set({
        error: errorMessage,
        connectionState: 'error',
        isOnline: false,
      });
    }
  },

  disconnect: () => {
    const state = get();

    trackEvent('collab_disconnected', null, { project_id: state.activeProjectId });

    // Destroy provider first
    if (state.provider) {
      state.provider.destroy();
    }

    // Destroy Y.Doc
    if (state.ydoc) {
      state.ydoc.destroy();
    }

    // Reset to disconnected state
    set({
      connectionState: 'disconnected',
      isOnline: false,
      activeProjectId: null,
      ydoc: null,
      provider: null,
      error: null,
      reconnectAttempts: 0,
    });
  },

  reset: () => set(initialState),
}));
