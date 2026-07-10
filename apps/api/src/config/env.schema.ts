import { z } from 'zod';

function emptyValuesAsUndefined(source: unknown): unknown {
  if (typeof source !== 'object' || source === null) {
    return source;
  }
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== ''),
  );
}

const envObjectSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  AGENT_MODE: z.enum(['server', 'batch']).default('server'),
  BATCH_INPUT_PATH: z.string().min(1).default('/input/tasks.json'),
  BATCH_OUTPUT_PATH: z.string().min(1).default('/output/results.json'),
  PORT: z.coerce.number().int().positive().default(3000),
  FIREWORKS_API_KEY: z.string().min(1, 'FIREWORKS_API_KEY is required'),
  ALLOWED_MODELS: z
    .string()
    .min(1, 'ALLOWED_MODELS is required')
    .transform((value) =>
      value
        .split(',')
        .map((model) => model.trim())
        .filter((model) => model.length > 0),
    )
    .refine((models) => models.length > 0, {
      message: 'ALLOWED_MODELS must contain at least one model ID',
    }),
  FIREWORKS_BASE_URL: z.url().default('https://api.fireworks.ai/inference/v1'),
  LLM_PROVIDER: z.enum(['fireworks', 'local', 'hybrid']).default('hybrid'),
  LOCAL_LLM_BASE_URL: z.url().default('http://localhost:8000/v1'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export const envSchema = z.preprocess(emptyValuesAsUndefined, envObjectSchema);

export type Env = z.infer<typeof envObjectSchema>;
