import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from '../../core/interfaces/llm-provider.interface';
import { FireworksProvider } from '../fireworks/fireworks.provider';
import { LocalLlmProvider } from '../local-llm/local-llm.provider';
import { HybridLlmProvider } from './hybrid-llm.provider';

@Module({
  providers: [
    FireworksProvider,
    LocalLlmProvider,
    HybridLlmProvider,
    { provide: LLM_PROVIDER, useExisting: HybridLlmProvider },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
