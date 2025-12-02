import { create } from 'zustand';
import * as Y from 'yjs';

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
  | 'error';

interface CollabState {
  connectionState: ConnectionState;
  activeProjectId: string | null;
  ydoc: Y.Doc | null;
  provider: YProviderInterface | null;
  error: string | null;
  isOnline: boolean;

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

function computeIsOnline(connectionState: ConnectionState): boolean {
  return ONLINE_STATES.includes(connectionState);
}

const initialState = {
  connectionState: 'disconnected' as ConnectionState,
  activeProjectId: null as string | null,
  ydoc: null as Y.Doc | null,
  provider: null as YProviderInterface | null,
  error: null as string | null,
  isOnline: false,
};

const DEFAULT_COLLAB_HOST = 'localhost:8787';

export function getCollabHost(): string {
  const envHost = import.meta.env.VITE_COLLAB_HOST;
  return envHost || DEFAULT_COLLAB_HOST;
}

export const useCollabStore = create<CollabState>((set, get) => ({
  ...initialState,

  setConnectionState: (connectionState) => {
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
    set({
      error,
      connectionState: error !== null ? 'error' : get().connectionState,
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
    });

    // Dynamically import y-partyserver provider to avoid bundling issues
    try {
      // @ts-expect-error - TypeScript's Node moduleResolution can't resolve subpath exports
      const { default: YProvider } = await import('y-partyserver/provider');
      const host = getCollabHost();

      const provider = new YProvider(host, projectId, ydoc, {
        connect: true,
        party: 'yjs-room',
      });

      // Set up connection status listeners
      const onConnect = () => {
        set({
          connectionState: 'connected',
          isOnline: true,
        });
      };

      const onDisconnect = () => {
        const currentState = get();
        if (currentState.activeProjectId === projectId) {
          set({
            connectionState: 'offline',
            isOnline: false,
          });
        }
      };

      provider.on('sync', onConnect);
      provider.on('connection-close', onDisconnect);

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
    });
  },

  reset: () => set(initialState),
}));
