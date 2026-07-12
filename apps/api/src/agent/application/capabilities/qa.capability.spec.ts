import { CapabilityError } from '../../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { QaCapability } from './qa.capability';

describe('QaCapability', () => {
  const task = { input: 'What is the capital of Australia?' };

  function setup(responseText = '{"answer": "Canberra"}') {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return { capability: new QaCapability(llm), complete };
  }

  it('handles any task as the fallback capability', () => {
    const { capability } = setup();
    expect(capability.canHandle()).toBe(true);
  });

  describe('execute', () => {
    it('returns the parsed answer', async () => {
      const { capability, complete } = setup();

      const output = await capability.execute(task);

      expect(output).toEqual({ answer: 'Canberra' });
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it('passes the question into the prompt', async () => {
      const { capability, complete } = setup();

      await capability.execute(task);

      expect(complete.mock.calls[0][0].prompt).toContain(task.input);
    });

    it('requests deterministic factual generation', async () => {
      const { capability, complete } = setup();

      await capability.execute(task);

      const request = complete.mock.calls[0][0];
      expect(request.temperature).toBe(0);
      expect(request.jsonOutput).toBe(true);
      expect(request.capability).toBe('qa');
    });

    it('instructs the model not to guess or satisfy false premises', async () => {
      const { capability, complete } = setup();

      await capability.execute(task);

      const system = complete.mock.calls[0][0].system;
      expect(system).toContain('never guess');
      expect(system).toContain('assumes something false');
    });

    it('includes the context section when the task provides one', async () => {
      const { capability, complete } = setup();

      await capability.execute({
        input: 'Who wrote it?',
        context: 'The novel was written by Ursula K. Le Guin.',
      });

      expect(complete.mock.calls[0][0].prompt).toContain(
        'Context:\nThe novel was written by Ursula K. Le Guin.',
      );
    });

    it('rejects output without an answer field', async () => {
      const { capability } = setup('{"result": "Canberra"}');

      await expect(capability.execute(task)).rejects.toThrow(CapabilityError);
    });
  });
});
