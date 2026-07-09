import { MathCapability } from '../../agent/application/capabilities/math.capability';
import { LoggerService } from '../../common/logger/logger.service';
import { ConfigService } from '../../config/config.service';
import { TaskType } from '../../core/domain/task';
import { CapabilityError, ProviderError } from '../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
} from '../../core/interfaces/llm-provider.interface';
import { FireworksProvider } from '../fireworks/fireworks.provider';
import { LocalLlmProvider } from '../local-llm/local-llm.provider';
import { HybridLlmProvider } from './hybrid-llm.provider';

describe('HybridLlmProvider', () => {
  function stubLogger(): LoggerService {
    return { debug: jest.fn(), warn: jest.fn() } as unknown as LoggerService;
  }

  function setup(
    llmProvider: 'fireworks' | 'local' = 'fireworks',
    responseText = '{"result": "4"}',
  ) {
    const config = { llmProvider } as unknown as ConfigService;
    const localComplete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const fireworksComplete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const local = { complete: localComplete } as unknown as LocalLlmProvider;
    const fireworks = {
      complete: fireworksComplete,
    } as unknown as FireworksProvider;
    return {
      hybrid: new HybridLlmProvider(config, local, fireworks, stubLogger()),
      localComplete,
      fireworksComplete,
    };
  }

  function request(capability?: TaskType): CompletionRequest {
    return { system: 'system', prompt: 'prompt', capability };
  }

  describe('capability routing', () => {
    const localRouted: TaskType[] = ['classification', 'ner'];
    const fireworksRouted: TaskType[] = [
      'qa',
      'summarization',
      'reasoning',
      'debug',
      'codegen',
      'math',
    ];

    for (const capability of localRouted) {
      it(`routes ${capability} to the local provider`, async () => {
        const { hybrid, localComplete, fireworksComplete } = setup();

        await hybrid.complete(request(capability));

        expect(localComplete).toHaveBeenCalledWith(request(capability));
        expect(fireworksComplete).not.toHaveBeenCalled();
      });
    }

    for (const capability of fireworksRouted) {
      it(`routes ${capability} to Fireworks and never calls Local`, async () => {
        const { hybrid, localComplete, fireworksComplete } = setup();

        await hybrid.complete(request(capability));

        expect(fireworksComplete).toHaveBeenCalledWith(request(capability));
        expect(localComplete).not.toHaveBeenCalled();
      });
    }

    it('routes capability requests by the switch even when LLM_PROVIDER is local', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup('local');

      await hybrid.complete(request('qa'));

      expect(fireworksComplete).toHaveBeenCalledTimes(1);
      expect(localComplete).not.toHaveBeenCalled();
    });
  });

  describe('local failure fallback', () => {
    it('does not fall back when the local provider succeeds', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup(
        'fireworks',
        '{"label": "spam"}',
      );

      const result = await hybrid.complete(request('classification'));

      expect(result).toEqual({ text: '{"label": "spam"}' });
      expect(localComplete).toHaveBeenCalledTimes(1);
      expect(fireworksComplete).not.toHaveBeenCalled();
    });

    it('retries on Fireworks when the local provider throws ProviderError', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup();
      localComplete.mockRejectedValue(
        new ProviderError('Local LLM API error 503: overloaded'),
      );
      fireworksComplete.mockResolvedValue({ text: 'from fireworks' });

      const result = await hybrid.complete(request('ner'));

      expect(result).toEqual({ text: 'from fireworks' });
      expect(fireworksComplete).toHaveBeenCalledWith(request('ner'));
    });

    it('propagates non-provider errors without falling back', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup();
      localComplete.mockRejectedValue(
        new CapabilityError('not a provider failure'),
      );

      await expect(hybrid.complete(request('classification'))).rejects.toThrow(
        CapabilityError,
      );
      expect(fireworksComplete).not.toHaveBeenCalled();
    });

    it('propagates Fireworks failures on Fireworks-routed capabilities without touching Local', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup();
      fireworksComplete.mockRejectedValue(
        new ProviderError('Fireworks API error 500'),
      );

      await expect(hybrid.complete(request('qa'))).rejects.toThrow(
        ProviderError,
      );
      expect(localComplete).not.toHaveBeenCalled();
    });

    it('does not fall back for requests without a capability', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup('local');
      localComplete.mockRejectedValue(
        new ProviderError('Local LLM request failed'),
      );

      await expect(hybrid.complete(request())).rejects.toThrow(ProviderError);
      expect(fireworksComplete).not.toHaveBeenCalled();
    });
  });

  describe('fallback with a real local provider', () => {
    const originalFetch = global.fetch;
    let fetchMock: jest.Mock;

    beforeEach(() => {
      fetchMock = jest.fn();
      global.fetch = fetchMock;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    function setupWithRealLocal() {
      const config = {
        llmProvider: 'fireworks',
        localLlm: { baseUrl: 'http://localhost:8000/v1', model: 'model-a' },
      } as unknown as ConfigService;
      const logger = stubLogger();
      const local = new LocalLlmProvider(config, logger);
      const fireworksComplete = jest
        .fn<Promise<CompletionResponse>, [CompletionRequest]>()
        .mockResolvedValue({ text: 'from fireworks' });
      const fireworks = {
        complete: fireworksComplete,
      } as unknown as FireworksProvider;
      return {
        hybrid: new HybridLlmProvider(config, local, fireworks, logger),
        fireworksComplete,
      };
    }

    it('falls back to Fireworks when the local request times out', async () => {
      fetchMock.mockRejectedValue(
        new DOMException(
          'The operation was aborted due to timeout',
          'TimeoutError',
        ),
      );
      const { hybrid, fireworksComplete } = setupWithRealLocal();

      const result = await hybrid.complete(request('classification'));

      expect(result).toEqual({ text: 'from fireworks' });
      expect(fireworksComplete).toHaveBeenCalledTimes(1);
    });

    it('falls back to Fireworks when the local server is unreachable', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));
      const { hybrid, fireworksComplete } = setupWithRealLocal();

      const result = await hybrid.complete(request('ner'));

      expect(result).toEqual({ text: 'from fireworks' });
      expect(fireworksComplete).toHaveBeenCalledTimes(1);
    });

    it('falls back to Fireworks when the local response is malformed JSON', async () => {
      fetchMock.mockResolvedValue(
        new Response('<html>not json</html>', { status: 200 }),
      );
      const { hybrid, fireworksComplete } = setupWithRealLocal();

      const result = await hybrid.complete(request('classification'));

      expect(result).toEqual({ text: 'from fireworks' });
      expect(fireworksComplete).toHaveBeenCalledTimes(1);
    });

    it('falls back to Fireworks when the local response has an invalid shape', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ choices: [] }), { status: 200 }),
      );
      const { hybrid, fireworksComplete } = setupWithRealLocal();

      const result = await hybrid.complete(request('ner'));

      expect(result).toEqual({ text: 'from fireworks' });
      expect(fireworksComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('requests without a capability (verification passes)', () => {
    it('delegates to Fireworks when LLM_PROVIDER is fireworks', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup('fireworks');

      await hybrid.complete(request());

      expect(fireworksComplete).toHaveBeenCalledTimes(1);
      expect(localComplete).not.toHaveBeenCalled();
    });

    it('delegates to the local provider when LLM_PROVIDER is local', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup('local');

      await hybrid.complete(request());

      expect(localComplete).toHaveBeenCalledTimes(1);
      expect(fireworksComplete).not.toHaveBeenCalled();
    });
  });

  describe('math routed through the hybrid', () => {
    it('deterministic arithmetic uses the local evaluator, never a provider', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup();
      const math = new MathCapability(hybrid);

      const output = await math.execute({ input: 'What is 12 * (3 + 4)?' });

      expect(output).toEqual({ result: '84' });
      expect(localComplete).not.toHaveBeenCalled();
      expect(fireworksComplete).not.toHaveBeenCalled();
    });

    it('non-deterministic math uses Fireworks', async () => {
      const { hybrid, localComplete, fireworksComplete } = setup(
        'fireworks',
        '{"result": "1/36"}',
      );
      const math = new MathCapability(hybrid);

      const output = await math.execute({
        input: 'What is the probability of rolling two sixes?',
      });

      expect(output).toEqual({ result: '1/36' });
      expect(fireworksComplete).toHaveBeenCalledTimes(1);
      expect(localComplete).not.toHaveBeenCalled();
    });
  });
});
