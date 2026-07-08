import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { LoggerService } from '../../common/logger/logger.service';
import { ConfigService } from '../../config/config.service';
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

@Injectable()
export class FireworksProvider implements LlmProvider {
  private static readonly TIMEOUT_MS = 60_000;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const { model, baseUrl } = this.config.fireworks;
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
        'Fireworks returned an unexpected response shape',
      );
    }

    this.logger.debug(
      `Fireworks completion (${model}) in ${Date.now() - startedAt}ms`,
      FireworksProvider.name,
    );
    return { text: parsed.data.choices[0].message.content };
  }

  private async post(
    url: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.config.fireworks.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(FireworksProvider.TIMEOUT_MS),
      });
    } catch (error) {
      throw new ProviderError('Fireworks request failed', { cause: error });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ProviderError(
        `Fireworks API error ${response.status}: ${detail.slice(0, 300)}`,
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ProviderError('Fireworks returned invalid JSON', {
        cause: error,
      });
    }
  }
}
