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
  PORT: z.coerce.number().int().positive().default(3000),
  FIREWORKS_API_KEY: z.string().min(1, 'FIREWORKS_API_KEY is required'),
  FIREWORKS_MODEL: z
    .string()
    .min(1)
    .default('accounts/fireworks/models/llama-v3p3-70b-instruct'),
  FIREWORKS_BASE_URL: z.url().default('https://api.fireworks.ai/inference/v1'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export const envSchema = z.preprocess(emptyValuesAsUndefined, envObjectSchema);

export type Env = z.infer<typeof envObjectSchema>;
