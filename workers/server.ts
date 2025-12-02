import { routePartykitRequest } from 'partyserver';
import { YServer } from 'y-partyserver';

export class YjsRoom extends YServer {
  // YServer handles all Yjs sync protocol automatically
}

interface Env {
  YjsRoom: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        timestamp: Date.now(),
      });
    }

    // Route WebSocket connections to Durable Objects
    return (
      (await routePartykitRequest(request, env)) ||
      new Response('Not found', { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
