import { describe, it, expect } from 'vitest';

const STAGING_URL = 'https://contextflow-collab.paul-162.workers.dev';
const WS_URL = 'wss://contextflow-collab.paul-162.workers.dev/parties/yjs-room';

describe('Cloudflare Worker Integration', () => {
  describe('Health endpoint', () => {
    it('returns ok status', async () => {
      const response = await fetch(`${STAGING_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(typeof data.timestamp).toBe('number');
    });
  });

  describe('WebSocket connection', () => {
    it('connects to a room successfully', async () => {
      // Skip in CI or when WebSocket is not available
      if (typeof WebSocket === 'undefined') {
        console.log('WebSocket not available, skipping test');
        return;
      }

      const roomId = `test-room-${Date.now()}`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`${WS_URL}/${roomId}`);
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket error: ${error}`));
        };
      });
    });
  });
});
