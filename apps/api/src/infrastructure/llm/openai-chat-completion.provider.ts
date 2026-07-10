import { z } from 'zod';
import { LoggerService } from '../../common/logger/logger.service';
import { ProviderError } from '../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../core/interfaces/llm-provider.interface';

const chatCompletionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string() }) }))
    .min(1),
});

export interface OpenAiChatCompletionTarget {
  readonly providerName: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey?: string;
}

export abstract class OpenAiChatCompletionProvider implements LlmProvider {
  private static readonly TIMEOUT_MS = 60_000;

  protected constructor(private readonly logger: LoggerService) {}

  protected abstract get target(): OpenAiChatCompletionTarget;

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const { providerName, baseUrl, model } = this.target;
    const startedAt = Date.now();

    const payload = await this.post(`${baseUrl}/chat/completions`, {
      model,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.prompt },
      ],
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 1024,
      ...(request.jsonOutput
        ? { response_format: { type: 'json_object' } }
        : {}),
    });

    const parsed = chatCompletionSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ProviderError(
        `${providerName} returned an unexpected response shape`,
      );
    }

    this.logger.debug(
      `${providerName} completion (${model}) in ${Date.now() - startedAt}ms`,
      this.constructor.name,
    );
    return { text: parsed.data.choices[0].message.content };
  }

  private async post(
    url: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const { providerName, apiKey } = this.target;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(OpenAiChatCompletionProvider.TIMEOUT_MS),
      });
    } catch (error) {
      throw new ProviderError(`${providerName} request failed`, {
        cause: error,
      });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ProviderError(
        `${providerName} API error ${response.status}: ${detail.slice(0, 300)}`,
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ProviderError(`${providerName} returned invalid JSON`, {
        cause: error,
      });
    }
  }
}
