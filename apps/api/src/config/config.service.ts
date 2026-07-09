import { Injectable } from '@nestjs/common';
import {
  AppConfig,
  BatchConfig,
  FireworksConfig,
  LocalLlmConfig,
  toAppConfig,
} from './app.config';
import { envSchema } from './env.schema';

@Injectable()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = toAppConfig(envSchema.parse(process.env));
  }

  get nodeEnv(): AppConfig['nodeEnv'] {
    return this.config.nodeEnv;
  }

  get port(): number {
    return this.config.port;
  }

  get logLevel(): AppConfig['logLevel'] {
    return this.config.logLevel;
  }

  get agentMode(): AppConfig['agentMode'] {
    return this.config.agentMode;
  }

  get llmProvider(): AppConfig['llmProvider'] {
    return this.config.llmProvider;
  }

  get fireworks(): FireworksConfig {
    return this.config.fireworks;
  }

  get localLlm(): LocalLlmConfig {
    return this.config.localLlm;
  }

  get batch(): BatchConfig {
    return this.config.batch;
  }

  get isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}
