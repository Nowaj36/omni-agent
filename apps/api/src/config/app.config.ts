import { Env } from './env.schema';

export interface FireworksConfig {
  readonly apiKey: string;
  readonly allowedModels: readonly string[];
  readonly baseUrl: string;
}

export interface LocalLlmConfig {
  readonly baseUrl: string;
  readonly model: string;
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
  readonly llmProvider: Env['LLM_PROVIDER'];
  readonly fireworks: FireworksConfig;
  readonly localLlm: LocalLlmConfig;
  readonly batch: BatchConfig;
}

export function toAppConfig(env: Env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV,
    agentMode: env.AGENT_MODE,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    llmProvider: env.LLM_PROVIDER,
    batch: {
      inputPath: env.BATCH_INPUT_PATH,
      outputPath: env.BATCH_OUTPUT_PATH,
    },
    fireworks: {
      apiKey: env.FIREWORKS_API_KEY,
      allowedModels: env.FIREWORKS_MODELS,
      baseUrl: env.FIREWORKS_BASE_URL,
    },
    localLlm: {
      baseUrl: env.LOCAL_LLM_BASE_URL,
      model: env.ALLOWED_MODELS[0],
    },
  };
}
