import { getJson } from './http';

/** Shape of GET /api/hello (see the backend Swagger docs at /api/docs). */
export interface HelloMessage {
  message: string;
  project: string;
  database: {
    status: 'connected';
    name: string;
    serverTime: string;
    latencyMs: number;
    severityLevels: string[];
  };
  timestamp: string;
}

export function getHello(signal?: AbortSignal): Promise<HelloMessage> {
  return getJson<HelloMessage>('/api/hello', { signal });
}
