import { routePartykitRequest } from 'partyserver';
import { YServer } from 'y-partyserver';
import * as Y from 'yjs';

const STORAGE_KEY = 'yjs-document';

export class YjsRoom extends YServer {
  static callbackOptions = {
    debounceWait: 2000,
    debounceMaxWait: 10000,
    timeout: 5000,
  };

  async onLoad(): Promise<void> {
    try {
      const stored = await this.ctx.storage.get<Uint8Array>(STORAGE_KEY);
      if (stored) {
        Y.applyUpdate(this.document, stored);
      }
    } catch (error) {
      console.error(`[YjsRoom] Error loading document for room ${this.name}:`, error);
    }
  }

  async onSave(): Promise<void> {
    try {
      const update = Y.encodeStateAsUpdate(this.document);
      await this.ctx.storage.put(STORAGE_KEY, update);
    } catch (error) {
      console.error(`[YjsRoom] Error saving document for room ${this.name}:`, error);
      throw error;
    }
  }
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
