import { envSchema } from './env.schema';

describe('envSchema', () => {
  function parseEnv(allowedModels?: string) {
    return envSchema.safeParse({
      FIREWORKS_API_KEY: 'test-key',
      ...(allowedModels === undefined ? {} : { ALLOWED_MODELS: allowedModels }),
    });
  }

  it('rejects a missing ALLOWED_MODELS', () => {
    const result = parseEnv();

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) =>
        issue.path.includes('ALLOWED_MODELS'),
      ),
    ).toBe(true);
  });

  it('rejects an empty ALLOWED_MODELS', () => {
    const result = parseEnv('');

    expect(result.success).toBe(false);
  });

  it('parses a single model', () => {
    const result = parseEnv('accounts/fireworks/models/model-a');

    expect(result.success).toBe(true);
    expect(result.data?.ALLOWED_MODELS).toEqual([
      'accounts/fireworks/models/model-a',
    ]);
  });

  it('parses multiple comma-separated models and trims whitespace', () => {
    const result = parseEnv(
      'accounts/fireworks/models/model-a, accounts/fireworks/models/model-b ,accounts/fireworks/models/model-c',
    );

    expect(result.success).toBe(true);
    expect(result.data?.ALLOWED_MODELS).toEqual([
      'accounts/fireworks/models/model-a',
      'accounts/fireworks/models/model-b',
      'accounts/fireworks/models/model-c',
    ]);
  });

  it('drops empty entries from stray commas', () => {
    const result = parseEnv(',accounts/fireworks/models/model-a,,');

    expect(result.success).toBe(true);
    expect(result.data?.ALLOWED_MODELS).toEqual([
      'accounts/fireworks/models/model-a',
    ]);
  });

  it('rejects a value that contains only commas and whitespace', () => {
    const result = parseEnv(' , ,, ');

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) =>
        issue.message.includes('at least one model'),
      ),
    ).toBe(true);
  });
});
