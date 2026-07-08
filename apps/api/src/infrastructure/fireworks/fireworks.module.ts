import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from '../../core/interfaces/llm-provider.interface';
import { FireworksProvider } from './fireworks.provider';

@Module({
  providers: [{ provide: LLM_PROVIDER, useClass: FireworksProvider }],
  exports: [LLM_PROVIDER],
})
export class FireworksModule {}
