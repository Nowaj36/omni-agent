import { TaskType } from '../domain/task';

export interface CompletionRequest {
  readonly system: string;
  readonly prompt: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly jsonOutput?: boolean;
  /** Capability issuing the request; absent for verification calls. */
  readonly capability?: TaskType;
}

export interface CompletionResponse {
  readonly text: string;
}

export interface LlmProvider {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
