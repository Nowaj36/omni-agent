import { CapabilityError } from '../../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { ClassificationCapability } from './classification.capability';

describe('ClassificationCapability', () => {
  const task = {
    input: 'Congratulations, you won a free prize! Click here now!',
    labels: ['spam', 'not spam'],
  };

  function setup(responseText = '{"label": "spam"}') {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return { capability: new ClassificationCapability(llm), complete };
  }

  describe('canHandle', () => {
    it('handles tasks that provide labels', () => {
      const { capability } = setup();
      expect(capability.canHandle(task)).toBe(true);
    });

    it('does not handle tasks without labels', () => {
      const { capability } = setup();
      expect(capability.canHandle({ input: 'Classify this' })).toBe(false);
    });

    describe('sentiment prompts without labels', () => {
      const sentimentPrompts = [
        'Classify the sentiment of this review: The battery lasts forever.',
        'What is the sentiment?',
        'Determine whether this review is positive, negative, or neutral.',
        'Label the sentiment.',
        'Sentiment:',
        'Is this review positive or negative?',
        "What's the sentiment of the following tweet: Great service!",
      ];

      it.each(sentimentPrompts)('handles %j', (input) => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(true);
      });

      const nonSentimentPrompts = [
        // Factual QA that mentions polarity words.
        'What are the positive effects of exercise?',
        'Is 7 a positive or negative number?',
        'What is the difference between a positive and a negative charge?',
        // Review text with no classification request.
        'This movie was surprisingly positive and I loved every minute of it.',
        'I had a negative experience with support, but the product is great.',
        // Sentiment mentioned without a classification request.
        'The public sentiment shifted after the election.',
        // Other task shapes.
        'Who won the World Cup in 2018?',
        'Summarize this review: the food was great but the service was slow.',
      ];

      it.each(nonSentimentPrompts)('does not handle %j', (input) => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(false);
      });
    });
  });

  describe('verificationMode', () => {
    it('is local because label membership is enforced in execute()', () => {
      const { capability } = setup();
      expect(capability.verificationMode(task)).toBe('local');
    });
  });

  describe('execute', () => {
    it('returns a label from the allowed set', async () => {
      const { capability, complete } = setup();

      const output = await capability.execute(task);

      expect(output).toEqual({ label: 'spam' });
      expect(complete).toHaveBeenCalledTimes(1);
      expect(complete.mock.calls[0][0].jsonOutput).toBe(true);
    });

    it('rejects a label outside the allowed set', async () => {
      const { capability } = setup('{"label": "junk"}');

      await expect(capability.execute(task)).rejects.toThrow(CapabilityError);
    });

    it('rejects tasks without labels', async () => {
      const { capability } = setup();

      await expect(
        capability.execute({ input: 'Classify this' }),
      ).rejects.toThrow(CapabilityError);
    });

    it('uses the explicit labels even when the prompt looks like sentiment', async () => {
      const { capability, complete } = setup('{"label": "spam"}');

      const output = await capability.execute({
        input: 'Classify the sentiment of this review.',
        labels: ['spam', 'not spam'],
      });

      expect(output).toEqual({ label: 'spam' });
      expect(complete.mock.calls[0][0].prompt).toContain(
        'Allowed labels: spam, not spam',
      );
    });

    describe('sentiment prompts without labels', () => {
      it('infers the full sentiment label set', async () => {
        const { capability, complete } = setup('{"label": "positive"}');

        const output = await capability.execute({
          input: 'Classify the sentiment of this review: I loved it!',
        });

        expect(output).toEqual({ label: 'positive' });
        expect(complete.mock.calls[0][0].prompt).toContain(
          'Allowed labels: positive, negative, neutral',
        );
      });

      it('restricts labels to the options enumerated in the prompt', async () => {
        const { capability, complete } = setup('{"label": "negative"}');

        const output = await capability.execute({
          input: 'Is this review positive or negative? Terrible product.',
        });

        expect(output).toEqual({ label: 'negative' });
        expect(complete.mock.calls[0][0].prompt).toContain(
          'Allowed labels: positive, negative\n',
        );
      });

      it('rejects a label outside the enumerated options', async () => {
        const { capability } = setup('{"label": "neutral"}');

        await expect(
          capability.execute({
            input: 'Is this review positive or negative? It was okay.',
          }),
        ).rejects.toThrow(CapabilityError);
      });
    });
  });
});
