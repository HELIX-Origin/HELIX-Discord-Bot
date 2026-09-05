/**
 * In-memory HTTP request/response mocks for exercising the dashboard router
 * and API handlers without opening a socket.
 */
import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import net from 'node:net';

export interface MockRequestOptions {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  cookie?: string;
}

export function createRequest(opts: MockRequestOptions = {}): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.method = opts.method || 'GET';
  req.url = opts.url || '/';
  req.headers = { host: 'localhost:5000', ...(opts.headers || {}) };
  if (opts.cookie) req.headers.cookie = opts.cookie;

  queueMicrotask(() => {
    if (opts.body) req.emit('data', Buffer.from(opts.body));
    req.emit('end');
  });

  return req;
}

export interface MockResponseResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function createResponse(): { res: ServerResponse; result: MockResponseResult } {
  const result: MockResponseResult = { statusCode: 200, headers: {}, body: '' };
  const res = new EventEmitter() as ServerResponse;

  (res as any).writeHead = (code: number, headers?: any) => {
    result.statusCode = code;
    if (headers) Object.assign(result.headers, headers);
    return res;
  };
  (res as any).end = (chunk?: any) => {
    if (chunk) result.body += chunk.toString();
  };
  (res as any).setHeader = (key: string, value: any) => {
    result.headers[key] = String(value);
  };
  (res as any).getHeader = (key: string) => result.headers[key];

  return { res, result };
}

export function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') resolve(address.port);
        else reject(new Error('Failed to allocate free port'));
      });
    });
  });
}