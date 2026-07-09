import { CapabilityError } from '../../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { MathCapability } from './math.capability';

describe('MathCapability', () => {
  function setup(responseText = '{"result": "4"}') {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return { capability: new MathCapability(llm), complete };
  }

  describe('canHandle', () => {
    const positives: string[] = [
      'Calculate the total cost of 3 items at 4.50 each',
      'Compute the standard deviation of these values',
      'Solve for x: 2x + 3 = 7',
      'What is the equation of the tangent line?',
      'What percentage of 200 is 30?',
      'What is 15% of 80?',
      'Find the average of 4, 8, and 15',
      'Find the mean of the dataset',
      'What is the median of 1, 3, 9?',
      'What is the probability of rolling two sixes?',
      'Simplify this algebraic expression',
      'A geometry question about triangles',
      'Use trigonometry to find the angle',
      'This is a calculus problem',
      'Find the integral of x^2',
      'What is the derivative of sin(x)?',
      'What is the ratio of 3 to 12?',
      'Express this as a proportion',
      'Reduce the fraction 6/8',
      'What is the square root of 144?',
      'Evaluate the logarithm base 2 of 32',
      'Rewrite using a negative exponent',
      'What is the sum of the first 10 integers?',
      'What is the product of 6 and 7?',
      'Find the perimeter of the rectangle',
      'Find the circumference of a circle with radius 2',
      'Find the hypotenuse of the right triangle',
      'Factor the polynomial',
      '12 * (3 + 4)',
      '100 / 5',
      '2 ^ 10',
      '7 × 6',
      '81 ÷ 9',
      '1.5 + 2.25',
      '10 - 4',
    ];

    for (const input of positives) {
      it(`handles "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(true);
      });
    }

    const negatives: string[] = [
      'What is the capital of France?',
      'Summarize this article about climate change',
      'Translate this sentence into Spanish',
      'Tell me about this product',
      'What does the word "ephemeral" mean?',
      'The meeting is scheduled for 2026-07-09',
      'Write a short story about a dragon',
      'Is this email spam or not spam?',
    ];

    for (const input of negatives) {
      it(`does not handle "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(false);
      });
    }
  });

  describe('execute', () => {
    it('returns the parsed result from the provider', async () => {
      const { capability, complete } = setup('{"result": "4"}');

      const output = await capability.execute({ input: 'What is 2 + 2?' });

      expect(output).toEqual({ result: '4' });
      expect(complete).toHaveBeenCalledTimes(1);
      const request = complete.mock.calls[0][0];
      expect(request.jsonOutput).toBe(true);
      expect(request.prompt).toContain('What is 2 + 2?');
    });

    it('includes task context in the prompt when present', async () => {
      const { capability, complete } = setup();

      await capability.execute({
        input: 'What is the total?',
        context: 'Prices: 3 and 4',
      });

      expect(complete.mock.calls[0][0].prompt).toContain(
        'Context:\nPrices: 3 and 4',
      );
    });

    it('forwards verifier feedback into the prompt on retry', async () => {
      const { capability, complete } = setup();

      await capability.execute(
        { input: 'What is 2 + 2?' },
        'The result is wrong.',
      );

      expect(complete.mock.calls[0][0].prompt).toContain(
        'The result is wrong.',
      );
    });

    it('throws CapabilityError when the provider returns non-JSON output', async () => {
      const { capability } = setup('four');

      await expect(
        capability.execute({ input: 'What is 2 + 2?' }),
      ).rejects.toThrow(CapabilityError);
    });
  });

  describe('validate', () => {
    it('accepts a valid output shape', () => {
      const { capability } = setup();
      expect(capability.validate({ result: 'x = 3' })).toEqual({
        result: 'x = 3',
      });
    });

    it('rejects an empty result', () => {
      const { capability } = setup();
      expect(() => capability.validate({ result: '' })).toThrow(
        CapabilityError,
      );
    });

    it('rejects a missing result field', () => {
      const { capability } = setup();
      expect(() => capability.validate({ answer: '4' })).toThrow(
        CapabilityError,
      );
    });
  });
});
