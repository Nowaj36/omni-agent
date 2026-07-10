import { LoggerService } from '../../common/logger/logger.service';
import { ConfigService } from '../../config/config.service';
import { ProviderError } from '../../core/errors';
import { LocalLlmProvider } from './local-llm.provider';

describe('LocalLlmProvider', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  function setup() {
    const config = {
      localLlm: { baseUrl: 'http://localhost:8000/v1', model: 'model-a' },
    } as unknown as ConfigService;
    const logger = { debug: jest.fn() } as unknown as LoggerService;
    return new LocalLlmProvider(config, logger);
  }

  function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), { status: 200 });
  }

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('sends a chat completion to the local base URL without an auth header', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: 'hello' } }] }),
    );

    const result = await setup().complete({
      system: 'You are helpful.',
      prompt: 'Say hello.',
    });

    expect(result).toEqual({ text: 'hello' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/v1/chat/completions');
    expect(init.headers).not.toHaveProperty('authorization');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('model-a');
    expect(body.messages).toEqual([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Say hello.' },
    ]);
    expect(body).not.toHaveProperty('response_format');
  });

  it('requests JSON mode via response_format', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: '{}' } }] }),
    );

    await setup().complete({
      system: 'system',
      prompt: 'prompt',
      jsonOutput: true,
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('throws ProviderError when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'));

    await expect(
      setup().complete({ system: 'system', prompt: 'prompt' }),
    ).rejects.toThrow(ProviderError);
  });

  it('throws ProviderError on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));

    await expect(
      setup().complete({ system: 'system', prompt: 'prompt' }),
    ).rejects.toThrow(ProviderError);
  });

  it('throws ProviderError on an unexpected response shape', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ choices: [] }));

    await expect(
      setup().complete({ system: 'system', prompt: 'prompt' }),
    ).rejects.toThrow(ProviderError);
  });
});
