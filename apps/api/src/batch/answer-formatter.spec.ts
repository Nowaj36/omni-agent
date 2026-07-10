import { formatAnswer } from './answer-formatter';

describe('formatAnswer', () => {
  it('returns the answer for qa and reasoning output', () => {
    expect(formatAnswer({ answer: 'Canberra' })).toBe('Canberra');
  });

  it('returns the summary for summarization output', () => {
    expect(formatAnswer({ summary: 'A short summary.' })).toBe(
      'A short summary.',
    );
  });

  it('returns the label for classification output', () => {
    expect(formatAnswer({ label: 'mixed' })).toBe('mixed');
  });

  it('returns the result for math output', () => {
    expect(formatAnswer({ result: '144' })).toBe('144');
  });

  it('formats entities as a comma-separated list', () => {
    expect(
      formatAnswer({
        entities: [
          { text: 'Fireworks AI', type: 'organization' },
          { text: 'last March', type: 'date' },
        ],
      }),
    ).toBe('Fireworks AI (organization), last March (date)');
  });

  it('reports when no entities were found', () => {
    expect(formatAnswer({ entities: [] })).toBe('No entities found.');
  });

  it('returns the code for code generation output', () => {
    expect(
      formatAnswer({ language: 'python', code: 'def f():\n    return 1' }),
    ).toBe('def f():\n    return 1');
  });

  it('combines issues and fixed code for debugging output', () => {
    expect(
      formatAnswer({
        language: 'python',
        issues: [{ message: 'Returns only the first element.' }],
        fixedCode: 'def get_max(nums):\n    return max(nums)',
      }),
    ).toBe(
      'Issues found:\n- Returns only the first element.\n\n' +
        'Fixed code:\ndef get_max(nums):\n    return max(nums)',
    );
  });

  it('returns only the fixed code when no issues are listed', () => {
    expect(
      formatAnswer({
        language: 'javascript',
        issues: [],
        fixedCode: 'const x = 1;',
      }),
    ).toBe('const x = 1;');
  });
});
