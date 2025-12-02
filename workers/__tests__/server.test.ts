import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock partyserver and y-partyserver since they use Cloudflare-specific imports
vi.mock('partyserver', () => ({
  routePartykitRequest: vi.fn().mockResolvedValue(null),
}));

vi.mock('y-partyserver', () => ({
  YServer: class YServer {},
}));

describe('YjsRoom Worker', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('GET /health', () => {
    it('returns JSON with status ok and timestamp', async () => {
      const { default: worker } = await import('../server');

      const request = new Request('http://localhost/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, {}, {});

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const body = await response.json();
      expect(body.status).toBe('ok');
      expect(typeof body.timestamp).toBe('number');
      expect(body.timestamp).toBeGreaterThan(0);
    });

    it('returns current timestamp', async () => {
      const { default: worker } = await import('../server');

      const before = Date.now();
      const request = new Request('http://localhost/health', { method: 'GET' });
      const response = await worker.fetch(request, {}, {});
      const after = Date.now();

      const body = await response.json();
      expect(body.timestamp).toBeGreaterThanOrEqual(before);
      expect(body.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('unknown routes', () => {
    it('returns 404 for unknown paths without YjsRoom binding', async () => {
      const { default: worker } = await import('../server');

      const request = new Request('http://localhost/unknown', { method: 'GET' });
      const response = await worker.fetch(request, {}, {});

      expect(response.status).toBe(404);
    });
  });
});
