import { CompletionRequest } from '../../core/interfaces/llm-provider.interface';
import { lowConfidenceReason } from './response-confidence';

describe('lowConfidenceReason', () => {
  function jsonRequest(): CompletionRequest {
    return { system: 'system', prompt: 'prompt', jsonOutput: true };
  }

  function textRequest(): CompletionRequest {
    return { system: 'system', prompt: 'prompt' };
  }

  describe('confident responses', () => {
    it('accepts a valid JSON object', () => {
      expect(
        lowConfidenceReason(jsonRequest(), '{"label": "spam"}'),
      ).toBeUndefined();
    });

    it('accepts a fenced JSON object', () => {
      expect(
        lowConfidenceReason(jsonRequest(), '```json\n{"label": "spam"}\n```'),
      ).toBeUndefined();
    });

    it('accepts a JSON object with an empty array field', () => {
      expect(
        lowConfidenceReason(jsonRequest(), '{"entities": []}'),
      ).toBeUndefined();
    });

    it('accepts ordinary plain text', () => {
      expect(
        lowConfidenceReason(textRequest(), 'Paris is the capital of France.'),
      ).toBeUndefined();
    });
  });

  describe('unusable responses', () => {
    it('flags an empty response', () => {
      expect(lowConfidenceReason(jsonRequest(), '   ')).toBe('empty response');
    });

    it('flags explicit uncertainty in a JSON field', () => {
      expect(
        lowConfidenceReason(
          jsonRequest(),
          '{"label": "I cannot determine the category"}',
        ),
      ).toBe('explicit uncertainty');
    });

    it('flags explicit uncertainty in plain text', () => {
      expect(
        lowConfidenceReason(textRequest(), "I don't know the answer to that."),
      ).toBe('explicit uncertainty');
    });

    it('flags malformed JSON when JSON output was requested', () => {
      expect(lowConfidenceReason(jsonRequest(), 'sure, here you go')).toBe(
        'malformed JSON',
      );
    });

    it('flags a JSON scalar when an object was requested', () => {
      expect(lowConfidenceReason(jsonRequest(), '"spam"')).toBe(
        'not a JSON object',
      );
    });

    it('flags a JSON object with no fields', () => {
      expect(lowConfidenceReason(jsonRequest(), '{}')).toBe(
        'JSON object with no fields',
      );
    });

    it('flags an empty field value', () => {
      expect(lowConfidenceReason(jsonRequest(), '{"label": ""}')).toBe(
        'empty field value',
      );
    });

    it('flags a placeholder field value', () => {
      expect(lowConfidenceReason(jsonRequest(), '{"label": "N/A"}')).toBe(
        'placeholder field value',
      );
    });

    it('flags a nested placeholder field value', () => {
      expect(
        lowConfidenceReason(
          jsonRequest(),
          '{"entities": [{"text": "TODO", "type": "person"}]}',
        ),
      ).toBe('placeholder field value');
    });

    it('flags a placeholder plain-text response', () => {
      expect(lowConfidenceReason(textRequest(), 'N/A')).toBe(
        'placeholder response',
      );
    });

    it('flags an extremely short plain-text response', () => {
      expect(lowConfidenceReason(textRequest(), 'ok')).toBe(
        'extremely short response',
      );
    });
  });
});
