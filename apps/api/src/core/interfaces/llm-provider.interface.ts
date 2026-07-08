export interface CompletionRequest {
  readonly system: string;
  readonly prompt: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly jsonOutput?: boolean;
}

export interface CompletionResponse {
  readonly text: string;
}

export interface LlmProvider {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
