import { CapabilityError } from '../../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { SummarizationCapability } from './summarization.capability';

describe('SummarizationCapability', () => {
  const task = {
    input:
      'Summarize the following in exactly one sentence: The reef supports thousands of marine species.',
  };

  function setup(
    responseText = '{"summary": "The reef hosts rich marine life."}',
  ) {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return { capability: new SummarizationCapability(llm), complete };
  }

  describe('canHandle', () => {
    it('handles prompts that ask for a summary', () => {
      const { capability } = setup();
      expect(capability.canHandle(task)).toBe(true);
    });

    it('handles long inputs without a summarize keyword', () => {
      const { capability } = setup();
      expect(capability.canHandle({ input: 'a'.repeat(600) })).toBe(true);
    });

    it('does not handle short non-summarization prompts', () => {
      const { capability } = setup();
      expect(capability.canHandle({ input: 'What is 2 + 2?' })).toBe(false);
    });
  });

  describe('execute', () => {
    it('returns the parsed summary', async () => {
      const { capability, complete } = setup();

      const output = await capability.execute(task);

      expect(output).toEqual({ summary: 'The reef hosts rich marine life.' });
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it('passes the task input into the prompt between text markers', async () => {
      const { capability, complete } = setup();

      await capability.execute(task);

      expect(complete.mock.calls[0][0].prompt).toContain(
        `<text>\n${task.input}\n</text>`,
      );
    });

    it('keeps retry feedback outside the text markers', async () => {
      const { capability, complete } = setup();

      await capability.execute(task, 'The summary missed the key fact.');

      const prompt = complete.mock.calls[0][0].prompt;
      const afterMarkers = prompt.slice(prompt.indexOf('</text>'));
      expect(afterMarkers).toContain('The summary missed the key fact.');
    });

    it('requests deterministic JSON generation', async () => {
      const { capability, complete } = setup();

      await capability.execute(task);

      const request = complete.mock.calls[0][0];
      expect(request.temperature).toBe(0);
      expect(request.jsonOutput).toBe(true);
      expect(request.capability).toBe('summarization');
    });

    it('rejects output without a summary field', async () => {
      const { capability } = setup('{"answer": "wrong shape"}');

      await expect(capability.execute(task)).rejects.toThrow(CapabilityError);
    });
  });
});
