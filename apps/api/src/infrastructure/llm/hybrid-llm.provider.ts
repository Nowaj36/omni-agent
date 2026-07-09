import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import { ConfigService } from '../../config/config.service';
import { TaskType } from '../../core/domain/task';
import { ProviderError } from '../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../core/interfaces/llm-provider.interface';
import { FireworksProvider } from '../fireworks/fireworks.provider';
import { LocalLlmProvider } from '../local-llm/local-llm.provider';

@Injectable()
export class HybridLlmProvider implements LlmProvider {
  constructor(
    private readonly config: ConfigService,
    private readonly local: LocalLlmProvider,
    private readonly fireworks: FireworksProvider,
    private readonly logger: LoggerService,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (request.capability === undefined) {
      return this.delegate.complete(request);
    }
    const provider = this.route(request.capability);
    if (provider === this.local) {
      return this.completeLocallyWithFallback(request);
    }
    return provider.complete(request);
  }

  // Local inference failures (unreachable server, timeout, malformed or
  // misshapen responses) all surface as ProviderError from the local leaf;
  // those retry on Fireworks. Anything else is a bug and propagates.
  private async completeLocallyWithFallback(
    request: CompletionRequest,
  ): Promise<CompletionResponse> {
    try {
      return await this.local.complete(request);
    } catch (error) {
      if (!(error instanceof ProviderError)) {
        throw error;
      }
      this.logger.warn(
        `Local provider failed for ${request.capability} (${error.message}); falling back to Fireworks`,
        HybridLlmProvider.name,
      );
      return this.fireworks.complete(request);
    }
  }

  private route(capability: TaskType): LlmProvider {
    switch (capability) {
      case 'classification':
      case 'ner':
        return this.local;
      // Deterministic math never reaches the provider (the capability
      // resolves it locally), so a math request here is the LLM fallback.
      case 'math':
      case 'qa':
      case 'summarization':
      case 'reasoning':
      case 'codegen':
      case 'debug':
        return this.fireworks;
    }
  }

  // Requests without a capability (verification passes) keep the
  // env-configured provider and never fall back.
  private get delegate(): LlmProvider {
    return this.config.llmProvider === 'local' ? this.local : this.fireworks;
  }
}
