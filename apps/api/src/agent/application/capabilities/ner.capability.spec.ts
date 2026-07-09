import { CapabilityError } from '../../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { NamedEntityRecognitionCapability } from './ner.capability';

describe('NamedEntityRecognitionCapability', () => {
  function setup(responseText = '{"entities": []}') {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return {
      capability: new NamedEntityRecognitionCapability(llm),
      complete,
    };
  }

  describe('canHandle', () => {
    const positives: string[] = [
      'Extract all people and organizations from this article',
      'Find the dates mentioned in the report',
      'Identify named entities in the following text',
      'List the email addresses in this thread',
      'Detect phone numbers in the transcript',
      'Run NER on this text',
      'Recognize the locations in this paragraph',
      'Extract every company name from the press release',
      'Find all places referenced in the diary',
    ];

    for (const input of positives) {
      it(`handles "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(true);
      });
    }

    const negatives: string[] = [
      'What is the capital of France?',
      'Find the sum of 3 and 4',
      'Extract the main argument from the essay',
      'The people of France celebrated the holiday',
      'Summarize this article about climate change',
      'What is 2 + 2?',
      'Translate this sentence into Spanish',
    ];

    for (const input of negatives) {
      it(`does not handle "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(false);
      });
    }
  });

  describe('verificationMode', () => {
    it('is local because verbatim-span and type checks run in execute()', () => {
      const { capability } = setup();
      expect(capability.verificationMode({ input: 'Run NER on this' })).toBe(
        'local',
      );
    });
  });

  describe('execute', () => {
    const input =
      'Extract entities: John Smith works at Acme Corp in Paris. ' +
      'He arrives on 2026-07-09. Email john@acme.com or call 555-1234.';

    it('returns mixed entity types verbatim from the input', async () => {
      const entities = [
        { text: 'John Smith', type: 'person' },
        { text: 'Acme Corp', type: 'organization' },
        { text: 'Paris', type: 'location' },
        { text: '2026-07-09', type: 'date' },
        { text: 'john@acme.com', type: 'email' },
        { text: '555-1234', type: 'phone' },
      ];
      const { capability, complete } = setup(JSON.stringify({ entities }));

      const output = await capability.execute({ input });

      expect(output).toEqual({ entities });
      expect(complete).toHaveBeenCalledTimes(1);
      expect(complete.mock.calls[0][0].jsonOutput).toBe(true);
    });

    it('returns duplicate entities as produced', async () => {
      const entities = [
        { text: 'Paris', type: 'location' },
        { text: 'Paris', type: 'location' },
      ];
      const { capability } = setup(JSON.stringify({ entities }));

      const output = await capability.execute({ input });

      expect(output.entities).toHaveLength(2);
      expect(output.entities[0]).toEqual(output.entities[1]);
    });

    it('returns an empty entity list when nothing is found', async () => {
      const { capability } = setup('{"entities": []}');

      const output = await capability.execute({
        input: 'Find the people in: nothing here.',
      });

      expect(output).toEqual({ entities: [] });
    });

    it('rejects an entity that is not a verbatim span of the input', async () => {
      const { capability } = setup(
        '{"entities": [{"text": "Jonathan Smith", "type": "person"}]}',
      );

      await expect(capability.execute({ input })).rejects.toThrow(
        CapabilityError,
      );
    });

    it('includes task context in the prompt when present', async () => {
      const { capability, complete } = setup();

      await capability.execute({
        input: 'Find the people mentioned.',
        context: 'A meeting transcript',
      });

      expect(complete.mock.calls[0][0].prompt).toContain(
        'Context:\nA meeting transcript',
      );
    });

    it('forwards verifier feedback into the prompt on retry', async () => {
      const { capability, complete } = setup();

      await capability.execute(
        { input: 'Find the people mentioned.' },
        'You missed an entity.',
      );

      expect(complete.mock.calls[0][0].prompt).toContain(
        'You missed an entity.',
      );
    });

    it('throws CapabilityError when the provider returns non-JSON output', async () => {
      const { capability } = setup('no entities found');

      await expect(capability.execute({ input })).rejects.toThrow(
        CapabilityError,
      );
    });
  });

  describe('validate', () => {
    it('accepts a valid output shape', () => {
      const { capability } = setup();
      const raw = { entities: [{ text: 'Paris', type: 'location' }] };
      expect(capability.validate(raw)).toEqual(raw);
    });

    it('accepts an empty entity list', () => {
      const { capability } = setup();
      expect(capability.validate({ entities: [] })).toEqual({ entities: [] });
    });

    it('rejects entity text with leading whitespace', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({
          entities: [{ text: ' Paris', type: 'location' }],
        }),
      ).toThrow(CapabilityError);
    });

    it('rejects entity text with trailing whitespace', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({
          entities: [{ text: 'Paris ', type: 'location' }],
        }),
      ).toThrow(CapabilityError);
    });

    it('rejects an unsupported entity type', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({ entities: [{ text: '$40', type: 'money' }] }),
      ).toThrow(CapabilityError);
    });

    it('rejects empty entity text', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({ entities: [{ text: '', type: 'person' }] }),
      ).toThrow(CapabilityError);
    });

    it('rejects a missing entities field', () => {
      const { capability } = setup();
      expect(() => capability.validate({ items: [] })).toThrow(CapabilityError);
    });
  });
});
