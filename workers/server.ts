import { YServer, routePartykitRequest } from 'y-partyserver';

/**
 * YjsRoom Durable Object - handles real-time collaboration for a single project
 */
export class YjsRoom extends YServer {
  // YServer handles all Yjs sync protocol automatically
  // We can override methods here for custom behavior if needed
}

/**
 * Health check response type
 */
interface HealthResponse {
  status: 'ok';
  timestamp: number;
}

/**
 * Worker fetch handler - routes requests to Durable Objects or handles health checks
 */
const worker = {
  async fetch(
    request: Request,
    env: { YjsRoom?: DurableObjectNamespace },
    _ctx: ExecutionContext | Record<string, unknown>
  ): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      const response: HealthResponse = {
        status: 'ok',
        timestamp: Date.now(),
      };
      return new Response(JSON.stringify(response), {
        headers: { 'content-type': 'application/json' },
      });
    }

    // Route WebSocket connections to Durable Objects
    if (env.YjsRoom) {
      return routePartykitRequest(request, env);
    }

    // Fallback for missing Durable Object binding
    return new Response('Not found', { status: 404 });
  },
};

export default worker;
