import { CapabilityError } from '../../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { LogicalReasoningCapability } from './logical-reasoning.capability';

describe('LogicalReasoningCapability', () => {
  function setup(responseText = '{"answer": "Socrates is mortal."}') {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return { capability: new LogicalReasoningCapability(llm), complete };
  }

  describe('canHandle', () => {
    const positives: string[] = [
      'All men are mortal. Socrates is a man. What follows?',
      'What can you deduce from these premises?',
      'If it rains, then the ground gets wet. It rained. What can we conclude?',
      'Alice is taller than Bob. Bob is taller than Carol. Who is the tallest?',
      'Solve this logic puzzle about three friends',
      'Eliminate the impossible options to find the culprit',
      'Arrange the five runners based on the clues',
      'Determine the correct sequence of events',
      'Which ordering satisfies all the clues?',
      'Build a truth table for this statement',
      'Here is a riddle: what has keys but no locks?',
    ];

    for (const input of positives) {
      it(`handles "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(true);
      });
    }

    const negatives: string[] = [
      'Is the Eiffel Tower taller than Big Ben?',
      'What is the capital of France?',
      'What is 2 + 2?',
      'Summarize this article about climate change',
      'Write a Python function to reverse a string',
      'Fix this Python code',
      'Translate this sentence into Spanish',
    ];

    for (const input of negatives) {
      it(`does not handle "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(false);
      });
    }
  });

  describe('execute', () => {
    it('answers a classic syllogism', async () => {
      const { capability, complete } = setup(
        '{"answer": "Socrates is mortal."}',
      );

      const output = await capability.execute({
        input: 'All men are mortal. Socrates is a man. What follows?',
      });

      expect(output).toEqual({ answer: 'Socrates is mortal.' });
      expect(complete).toHaveBeenCalledTimes(1);
      expect(complete.mock.calls[0][0].jsonOutput).toBe(true);
    });

    it('answers an ordering puzzle from a comparative chain', async () => {
      const { capability } = setup('{"answer": "Alice is the tallest."}');

      const output = await capability.execute({
        input:
          'Alice is taller than Bob. Bob is taller than Carol. Who is the tallest?',
      });

      expect(output).toEqual({ answer: 'Alice is the tallest.' });
    });

    it('answers a conditional reasoning problem', async () => {
      const { capability } = setup('{"answer": "The ground is wet."}');

      const output = await capability.execute({
        input:
          'If it rains, then the ground gets wet. It rained. What can we conclude?',
      });

      expect(output).toEqual({ answer: 'The ground is wet.' });
    });

    it('instructs the model to withhold chain-of-thought', async () => {
      const { capability, complete } = setup();

      await capability.execute({
        input: 'All men are mortal. Socrates is a man. What follows?',
      });

      const { system } = complete.mock.calls[0][0];
      expect(system).toContain('Never expose chain-of-thought');
      expect(system).toContain('single best-supported conclusion');
    });

    it('includes task context in the prompt when present', async () => {
      const { capability, complete } = setup();

      await capability.execute({
        input: 'Who finished the race first?',
        context: 'Clues: Dana was faster than Eli. Eli was faster than Finn.',
      });

      expect(complete.mock.calls[0][0].prompt).toContain(
        'Context:\nClues: Dana was faster than Eli.',
      );
    });

    it('forwards verifier feedback into the prompt on retry', async () => {
      const { capability, complete } = setup();

      await capability.execute(
        { input: 'Solve this logic puzzle about three friends' },
        'The conclusion contradicts the second premise.',
      );

      expect(complete.mock.calls[0][0].prompt).toContain(
        'The conclusion contradicts the second premise.',
      );
    });

    it('throws CapabilityError when the provider returns non-JSON output', async () => {
      const { capability } = setup('the answer is Socrates');

      await expect(
        capability.execute({ input: 'Solve this logic puzzle' }),
      ).rejects.toThrow(CapabilityError);
    });
  });

  describe('validate', () => {
    it('accepts a valid output shape', () => {
      const { capability } = setup();
      expect(capability.validate({ answer: 'Alice is the tallest.' })).toEqual({
        answer: 'Alice is the tallest.',
      });
    });

    it('rejects an empty answer', () => {
      const { capability } = setup();
      expect(() => capability.validate({ answer: '' })).toThrow(
        CapabilityError,
      );
    });

    it('rejects a missing answer field', () => {
      const { capability } = setup();
      expect(() => capability.validate({ conclusion: 'x' })).toThrow(
        CapabilityError,
      );
    });
  });
});
