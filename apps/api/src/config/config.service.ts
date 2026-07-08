import { Injectable } from '@nestjs/common';
import { AppConfig, FireworksConfig, toAppConfig } from './app.config';
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

  get fireworks(): FireworksConfig {
    return this.config.fireworks;
  }

  get isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}
