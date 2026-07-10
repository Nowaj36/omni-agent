import { CapabilityError } from '../../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CodeDebuggingCapability } from './code-debugging.capability';

describe('CodeDebuggingCapability', () => {
  function setup(
    responseText = '{"language": "python", "issues": [], "fixedCode": "print(1)"}',
  ) {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return { capability: new CodeDebuggingCapability(llm), complete };
  }

  describe('canHandle', () => {
    const positives: string[] = [
      'Fix this Python code',
      'Debug this function',
      'Troubleshoot this script',
      'Resolve the TypeError in this snippet',
      'Repair the bug in my JavaScript',
      'Diagnose why this program crashes',
      'Fix the error in this TypeScript function',
    ];

    for (const input of positives) {
      it(`handles "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(true);
      });
    }

    const negatives: string[] = [
      'Fix my sleep schedule',
      'Write a Python function to reverse a string',
      'Debug my life choices',
      'The bug crawled across the floor',
      'Summarize this article about climate change',
      'What is 2 + 2?',
      'Resolve the dispute between the two teams',
    ];

    for (const input of negatives) {
      it(`does not handle "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(false);
      });
    }
  });

  describe('execute', () => {
    it('returns issues and fixed code for buggy Python', async () => {
      const output = {
        language: 'python',
        issues: [{ message: 'The loop range misses the last element.' }],
        fixedCode: 'for i in range(len(items)):\n    print(items[i])',
      };
      const { capability, complete } = setup(JSON.stringify(output));

      const result = await capability.execute({
        input: 'Fix this Python code: for i in range(len(items) - 1): ...',
      });

      expect(result).toEqual(output);
      expect(complete).toHaveBeenCalledTimes(1);
      expect(complete.mock.calls[0][0].jsonOutput).toBe(true);
    });

    it('returns multiple issues for TypeScript code', async () => {
      const output = {
        language: 'typescript',
        issues: [
          { message: 'The comparison uses assignment instead of equality.' },
          { message: 'The function never returns a value.' },
        ],
        fixedCode:
          'function isZero(n: number): boolean {\n  return n === 0;\n}',
      };
      const { capability } = setup(JSON.stringify(output));

      const result = await capability.execute({
        input:
          'Debug this TypeScript function: function isZero(n) { if (n = 0) {} }',
      });

      expect(result).toEqual(output);
      expect(result.issues).toHaveLength(2);
    });

    it('returns empty issues and unchanged code for clean code', async () => {
      const originalCode = 'function add(a, b) {\n  return a + b;\n}';
      const { capability } = setup(
        JSON.stringify({
          language: 'javascript',
          issues: [],
          fixedCode: originalCode,
        }),
      );

      const result = await capability.execute({
        input: `Fix this JavaScript code if needed:\n${originalCode}`,
      });

      expect(result.issues).toEqual([]);
      expect(result.fixedCode).toBe(originalCode);
    });

    it('rejects a fix in a different language than the one named', async () => {
      const { capability } = setup(
        '{"language": "typescript", "issues": [], "fixedCode": "const x = 1;"}',
      );

      await expect(
        capability.execute({ input: 'Fix this Python code: x = ' }),
      ).rejects.toThrow(CapabilityError);
    });

    it('accepts the detected language when none is named', async () => {
      const { capability } = setup(
        '{"language": "typescript", "issues": [], "fixedCode": "const x = 1;"}',
      );

      const result = await capability.execute({
        input: 'Fix this code: const x: number = "1";',
      });

      expect(result.language).toBe('typescript');
    });

    it('rejects fixedCode wrapped in a leading markdown fence', async () => {
      const { capability } = setup(
        JSON.stringify({
          language: 'python',
          issues: [],
          fixedCode: '```python\nprint(1)\n```',
        }),
      );

      await expect(
        capability.execute({ input: 'Fix this Python code: print(1' }),
      ).rejects.toThrow(CapabilityError);
    });

    it('accepts triple backticks inside valid fixed source code', async () => {
      const output = {
        language: 'javascript',
        issues: [{ message: 'The template literal was unterminated.' }],
        fixedCode: 'const doc = `usage:\n```\nnode cli.js\n```\n`;',
      };
      const { capability } = setup(JSON.stringify(output));

      const result = await capability.execute({
        input: 'Fix this JavaScript code: const doc = `usage:',
      });

      expect(result).toEqual(output);
    });

    it('includes task context in the prompt when present', async () => {
      const { capability, complete } = setup();

      await capability.execute({
        input: 'Fix this Python code: print(items[i])',
        context: 'Throws IndexError: list index out of range',
      });

      expect(complete.mock.calls[0][0].prompt).toContain(
        'Context:\nThrows IndexError: list index out of range',
      );
    });

    it('forwards verifier feedback into the prompt on retry', async () => {
      const { capability, complete } = setup();

      await capability.execute(
        { input: 'Fix this Python code: print(1' },
        'The fix still has a syntax error.',
      );

      expect(complete.mock.calls[0][0].prompt).toContain(
        'The fix still has a syntax error.',
      );
    });

    it('throws CapabilityError when the provider returns non-JSON output', async () => {
      const { capability } = setup('the bug is on line 3');

      await expect(
        capability.execute({ input: 'Fix this Python code: print(1' }),
      ).rejects.toThrow(CapabilityError);
    });
  });

  describe('validate', () => {
    it('accepts a valid output shape', () => {
      const { capability } = setup();
      const raw = {
        language: 'python',
        issues: [{ message: 'Off-by-one error.' }],
        fixedCode: 'print(1)',
      };
      expect(capability.validate(raw)).toEqual(raw);
    });

    it('accepts an empty issues array', () => {
      const { capability } = setup();
      const raw = { language: 'python', issues: [], fixedCode: 'print(1)' };
      expect(capability.validate(raw)).toEqual(raw);
    });

    it('rejects an unsupported language', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({
          language: 'go',
          issues: [],
          fixedCode: 'fmt.Println(1)',
        }),
      ).toThrow(CapabilityError);
    });

    it('rejects an empty issue message', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({
          language: 'python',
          issues: [{ message: '' }],
          fixedCode: 'print(1)',
        }),
      ).toThrow(CapabilityError);
    });

    it('rejects empty fixedCode', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({ language: 'python', issues: [], fixedCode: '' }),
      ).toThrow(CapabilityError);
    });

    it('rejects fixedCode starting with a markdown fence', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({
          language: 'python',
          issues: [],
          fixedCode: '```\nprint(1)\n```',
        }),
      ).toThrow(CapabilityError);
    });

    it('rejects a missing issues field', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({ language: 'python', fixedCode: 'print(1)' }),
      ).toThrow(CapabilityError);
    });
  });
});
