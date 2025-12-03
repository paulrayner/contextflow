import { useEffect, useState, useCallback } from 'react';
import {
  runMigration,
  hasPendingMigration,
  cleanupMigrationBackup,
  type MigrationResult,
} from '../model/migrations/cloudMigration';

export interface MigrationState {
  status: 'idle' | 'checking' | 'migrating' | 'complete' | 'error';
  progress: { current: number; total: number } | null;
  result: MigrationResult | null;
  error: string | null;
}

export function useCloudMigration() {
  const [state, setState] = useState<MigrationState>({
    status: 'idle',
    progress: null,
    result: null,
    error: null,
  });

  const migrate = useCallback(async () => {
    setState((s) => ({ ...s, status: 'checking' }));

    const hasPending = await hasPendingMigration();
    if (!hasPending) {
      setState((s) => ({ ...s, status: 'complete', result: null }));
      return;
    }

    setState((s) => ({ ...s, status: 'migrating' }));

    const result = await runMigration({
      onStart: (total) => {
        setState((s) => ({ ...s, progress: { current: 0, total } }));
      },
      onProgress: (current, total) => {
        setState((s) => ({ ...s, progress: { current, total } }));
      },
      onComplete: (migrationResult) => {
        setState({
          status: 'complete',
          progress: null,
          result: migrationResult,
          error: null,
        });
      },
      onError: (err) => {
        setState({
          status: 'error',
          progress: null,
          result: null,
          error: err.message,
        });
      },
    });

    if (result.total === 0 && state.status !== 'error') {
      setState((s) => ({ ...s, status: 'complete' }));
    }
  }, []);

  useEffect(() => {
    migrate();
    cleanupMigrationBackup().catch(console.error);
  }, [migrate]);

  return state;
}
