import { Env } from './env.schema';

export interface FireworksConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl: string;
}

export interface AppConfig {
  readonly nodeEnv: Env['NODE_ENV'];
  readonly port: number;
  readonly logLevel: Env['LOG_LEVEL'];
  readonly fireworks: FireworksConfig;
}

export function toAppConfig(env: Env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    fireworks: {
      apiKey: env.FIREWORKS_API_KEY,
      model: env.FIREWORKS_MODEL,
      baseUrl: env.FIREWORKS_BASE_URL,
    },
  };
}
