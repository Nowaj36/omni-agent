import { Module } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import {
  LLM_PROVIDER,
  LlmProvider,
} from '../../core/interfaces/llm-provider.interface';
import { FireworksProvider } from '../fireworks/fireworks.provider';
import { LocalLlmProvider } from '../local-llm/local-llm.provider';

@Module({
  providers: [
    FireworksProvider,
    LocalLlmProvider,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService, FireworksProvider, LocalLlmProvider],
      useFactory: (
        config: ConfigService,
        fireworks: FireworksProvider,
        local: LocalLlmProvider,
      ): LlmProvider => (config.llmProvider === 'local' ? local : fireworks),
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
