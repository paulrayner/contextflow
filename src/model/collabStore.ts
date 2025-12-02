import { create } from 'zustand';
import type * as Y from 'yjs';

/**
 * Type stub for y-partyserver provider.
 * The actual import uses y-partyserver/provider but TypeScript's Node resolution
 * can't resolve subpath exports. We use a minimal interface for type safety.
 */
interface YProvider {
  connect: () => void;
  disconnect: () => void;
  destroy: () => void;
  awareness: unknown;
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
  provider: YProvider | null;
  error: string | null;
  isOnline: boolean;

  setConnectionState: (state: ConnectionState) => void;
  setActiveProjectId: (projectId: string | null) => void;
  setYDoc: (ydoc: Y.Doc | null) => void;
  setProvider: (provider: YProvider | null) => void;
  setError: (error: string | null) => void;
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
  provider: null as YProvider | null,
  error: null as string | null,
  isOnline: false,
};

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

  reset: () => set(initialState),
}));
