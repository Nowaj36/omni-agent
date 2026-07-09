import { Env } from './env.schema';

export interface FireworksConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl: string;
}

export interface BatchConfig {
  readonly inputPath: string;
  readonly outputPath: string;
}

export interface AppConfig {
  readonly nodeEnv: Env['NODE_ENV'];
  readonly agentMode: Env['AGENT_MODE'];
  readonly port: number;
  readonly logLevel: Env['LOG_LEVEL'];
  readonly fireworks: FireworksConfig;
  readonly batch: BatchConfig;
}

export function toAppConfig(env: Env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV,
    agentMode: env.AGENT_MODE,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    batch: {
      inputPath: env.BATCH_INPUT_PATH,
      outputPath: env.BATCH_OUTPUT_PATH,
    },
    fireworks: {
      apiKey: env.FIREWORKS_API_KEY,
      model: env.FIREWORKS_MODEL,
      baseUrl: env.FIREWORKS_BASE_URL,
    },
  };
}
