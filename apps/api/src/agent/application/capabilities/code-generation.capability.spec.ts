import { CapabilityError } from '../../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CodeGenerationCapability } from './code-generation.capability';

describe('CodeGenerationCapability', () => {
  function setup(responseText = '{"language": "python", "code": "print(1)"}') {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return { capability: new CodeGenerationCapability(llm), complete };
  }

  describe('canHandle', () => {
    const positives: string[] = [
      'Write a Python function to reverse a string',
      'Generate a TypeScript snippet that debounces a callback',
      'Implement a sorting algorithm',
      'Create a function that adds two numbers',
      'Create a script that renames files',
      'Program a JavaScript timer',
      'Write a regex that matches ISO dates',
      'Code a solution in Python',
    ];

    for (const input of positives) {
      it(`handles "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(true);
      });
    }

    const negatives: string[] = [
      'Write a summary of this article',
      'Create a travel itinerary for a week in Japan',
      'What is the capital of France?',
      'Calculate the average of 1, 2 and 3',
      'Extract the people mentioned in this text',
      'Translate this sentence into Spanish',
      'Generate a list of dinner ideas',
    ];

    for (const input of negatives) {
      it(`does not handle "${input}"`, () => {
        const { capability } = setup();
        expect(capability.canHandle({ input })).toBe(false);
      });
    }
  });

  describe('execute', () => {
    it('generates Python code', async () => {
      const output = {
        language: 'python',
        code: 'def greet(name):\n    print(f"hi {name}")',
      };
      const { capability, complete } = setup(JSON.stringify(output));

      const result = await capability.execute({
        input: 'Write a Python function that greets a user',
      });

      expect(result).toEqual(output);
      expect(complete).toHaveBeenCalledTimes(1);
      expect(complete.mock.calls[0][0].jsonOutput).toBe(true);
    });

    it('generates TypeScript code', async () => {
      const output = {
        language: 'typescript',
        code: 'export const add = (a: number, b: number): number => a + b;',
      };
      const { capability } = setup(JSON.stringify(output));

      const result = await capability.execute({
        input: 'Write a TypeScript function that adds two numbers',
      });

      expect(result).toEqual(output);
    });

    it('generates JavaScript code', async () => {
      const output = {
        language: 'javascript',
        code: 'function add(a, b) {\n  return a + b;\n}',
      };
      const { capability } = setup(JSON.stringify(output));

      const result = await capability.execute({
        input: 'Write a JavaScript function that adds two numbers',
      });

      expect(result).toEqual(output);
    });

    it('rejects code in a different language than the one requested', async () => {
      const { capability } = setup(
        '{"language": "typescript", "code": "export const x = 1;"}',
      );

      await expect(
        capability.execute({ input: 'Write a Python function to sort a list' }),
      ).rejects.toThrow(CapabilityError);
    });

    it('accepts any supported language when none is named', async () => {
      const { capability } = setup(
        '{"language": "typescript", "code": "export const x = 1;"}',
      );

      const result = await capability.execute({
        input: 'Write a function that returns 1',
      });

      expect(result.language).toBe('typescript');
    });

    it('accepts either language when several are named', async () => {
      const { capability } = setup(
        '{"language": "typescript", "code": "export const x = 1;"}',
      );

      const result = await capability.execute({
        input: 'Write a function in TypeScript or Python that returns 1',
      });

      expect(result.language).toBe('typescript');
    });

    it('rejects code wrapped in a leading markdown fence', async () => {
      const { capability } = setup(
        JSON.stringify({
          language: 'python',
          code: '```python\nprint(1)\n```',
        }),
      );

      await expect(
        capability.execute({ input: 'Write a Python script that prints 1' }),
      ).rejects.toThrow(CapabilityError);
    });

    it('accepts triple backticks inside valid source code', async () => {
      const output = {
        language: 'javascript',
        code: 'const doc = `usage:\n```\nnode cli.js\n```\n`;',
      };
      const { capability } = setup(JSON.stringify(output));

      const result = await capability.execute({
        input: 'Write a JavaScript snippet that stores usage docs',
      });

      expect(result).toEqual(output);
    });

    it('includes task context in the prompt when present', async () => {
      const { capability, complete } = setup();

      await capability.execute({
        input: 'Write a Python function that parses this format',
        context: 'Lines look like: key=value',
      });

      expect(complete.mock.calls[0][0].prompt).toContain(
        'Context:\nLines look like: key=value',
      );
    });

    it('forwards verifier feedback into the prompt on retry', async () => {
      const { capability, complete } = setup();

      await capability.execute(
        { input: 'Write a Python function that sorts a list' },
        'The code does not handle empty lists.',
      );

      expect(complete.mock.calls[0][0].prompt).toContain(
        'The code does not handle empty lists.',
      );
    });

    it('throws CapabilityError when the provider returns non-JSON output', async () => {
      const { capability } = setup('here is your code');

      await expect(
        capability.execute({ input: 'Write a Python function' }),
      ).rejects.toThrow(CapabilityError);
    });
  });

  describe('validate', () => {
    it('accepts a valid output shape', () => {
      const { capability } = setup();
      const raw = { language: 'python', code: 'print(1)' };
      expect(capability.validate(raw)).toEqual(raw);
    });

    it('rejects an unsupported language', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({ language: 'go', code: 'fmt.Println(1)' }),
      ).toThrow(CapabilityError);
    });

    it('rejects empty code', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({ language: 'python', code: '' }),
      ).toThrow(CapabilityError);
    });

    it('rejects code starting with a markdown fence', () => {
      const { capability } = setup();
      expect(() =>
        capability.validate({ language: 'python', code: '```\nprint(1)\n```' }),
      ).toThrow(CapabilityError);
    });

    it('rejects a missing code field', () => {
      const { capability } = setup();
      expect(() => capability.validate({ language: 'python' })).toThrow(
        CapabilityError,
      );
    });
  });
});
