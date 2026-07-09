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
  });
});
