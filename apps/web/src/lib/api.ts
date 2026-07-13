import type { AgentResult, AgentTaskRequest, HealthStatus } from './types';

// All requests go through same-origin /api routes; next.config.ts rewrites
// them to NEXT_PUBLIC_API_URL server-side (the API does not enable CORS).
const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message)) {
        return message.join('; ');
      }
    }
  } catch {
    // Non-JSON error body; fall through to the status text.
  }
  return `Request failed with status ${response.status}`;
}

export interface TimedAgentResult {
  readonly result: AgentResult;
  readonly durationMs: number;
}

export async function runAgentTask(
  request: AgentTaskRequest,
  signal?: AbortSignal,
): Promise<TimedAgentResult> {
  const startedAt = performance.now();
  const response = await fetch(`${API_BASE}/agent/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }
  const result = (await response.json()) as AgentResult;
  return { result, durationMs: Math.round(performance.now() - startedAt) };
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE}/health`, {
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }
  return (await response.json()) as HealthStatus;
}
