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
import { lowConfidenceReason } from './response-confidence';

@Injectable()
export class HybridLlmProvider implements LlmProvider {
  // Which provider actually served the last generation per capability,
  // fallbacks included, so verification can stay within the same family.
  // Concurrent tasks of one capability may overwrite each other here; the
  // worst case is a verification on the other (still correct) family.
  private readonly generationFamily = new Map<TaskType, LlmProvider>();

  constructor(
    private readonly config: ConfigService,
    private readonly local: LocalLlmProvider,
    private readonly fireworks: FireworksProvider,
    private readonly logger: LoggerService,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (request.verifying !== undefined) {
      return this.completeVerification(request, request.verifying);
    }
    if (request.capability === undefined) {
      return this.delegate.complete(request);
    }
    const provider = this.route(request.capability);
    if (provider === this.local) {
      return this.completeLocallyWithFallback(request, request.capability);
    }
    this.generationFamily.set(request.capability, provider);
    return provider.complete(request);
  }

  // Local inference failures (unreachable server, timeout, malformed or
  // misshapen responses) all surface as ProviderError from the local leaf;
  // those retry on Fireworks, as do responses the deterministic confidence
  // check judges unusable. Anything else is a bug and propagates.
  private async completeLocallyWithFallback(
    request: CompletionRequest,
    capability: TaskType,
  ): Promise<CompletionResponse> {
    let response: CompletionResponse;
    try {
      response = await this.local.complete(request);
    } catch (error) {
      if (!(error instanceof ProviderError)) {
        throw error;
      }
      return this.fallBack(request, capability, error.message);
    }
    const reason = lowConfidenceReason(request, response.text);
    if (reason !== undefined) {
      return this.fallBack(request, capability, reason);
    }
    this.generationFamily.set(capability, this.local);
    return response;
  }

  private fallBack(
    request: CompletionRequest,
    capability: TaskType,
    reason: string,
  ): Promise<CompletionResponse> {
    this.logger.warn(
      `Local provider unusable for ${capability} (${reason}); falling back to Fireworks`,
      HybridLlmProvider.name,
    );
    this.generationFamily.set(capability, this.fireworks);
    return this.fireworks.complete(request);
  }

  // Verification follows the family that actually produced the answer, so a
  // weak or degraded local model never judges a Fireworks answer. Verdict
  // parsing stays in VerificationEngine; only transport failures re-route.
  private completeVerification(
    request: CompletionRequest,
    generated: TaskType,
  ): Promise<CompletionResponse> {
    const provider =
      this.generationFamily.get(generated) ?? this.route(generated);
    if (provider === this.local) {
      return this.verifyLocallyWithTransportFallback(request, generated);
    }
    return provider.complete(request);
  }

  private async verifyLocallyWithTransportFallback(
    request: CompletionRequest,
    generated: TaskType,
  ): Promise<CompletionResponse> {
    try {
      return await this.local.complete(request);
    } catch (error) {
      if (!(error instanceof ProviderError)) {
        throw error;
      }
      this.logger.warn(
        `Local verifier unavailable for ${generated} (${error.message}); verifying on Fireworks`,
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

  // Requests without a capability or verification tag keep the
  // env-configured provider and never fall back.
  private get delegate(): LlmProvider {
    return this.config.llmProvider === 'local' ? this.local : this.fireworks;
  }
}
