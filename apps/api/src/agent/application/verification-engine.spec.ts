import { VerificationError } from '../../core/errors';
import {
  CompletionRequest,
  CompletionResponse,
  LlmProvider,
} from '../../core/interfaces/llm-provider.interface';
import { VerificationEngine } from './verification-engine';

describe('VerificationEngine', () => {
  const task = { input: 'What is 2 + 2?' };
  const output = { answer: '4' };

  function setup(responseText = '{"passed": true, "feedback": "Correct."}') {
    const complete = jest
      .fn<Promise<CompletionResponse>, [CompletionRequest]>()
      .mockResolvedValue({ text: responseText });
    const llm: LlmProvider = { complete };
    return { engine: new VerificationEngine(llm), complete };
  }

  it('returns the parsed verdict', async () => {
    const { engine } = setup(
      '{"passed": false, "feedback": "The answer is wrong."}',
    );

    const result = await engine.verify(task, 'qa', output);

    expect(result).toEqual({
      passed: false,
      feedback: 'The answer is wrong.',
    });
  });

  it('requests a deterministic, token-capped JSON verdict', async () => {
    const { engine, complete } = setup();

    await engine.verify(task, 'qa', output);

    const request = complete.mock.calls[0][0];
    expect(request.temperature).toBe(0);
    expect(request.jsonOutput).toBe(true);
    expect(request.verifying).toBe('qa');
    expect(request.maxTokens).toBeLessThanOrEqual(256);
    expect(request.prompt).toContain('What is 2 + 2?');
    expect(request.prompt).toContain(JSON.stringify(output));
  });

  it('throws VerificationError on non-JSON verifier output', async () => {
    const { engine } = setup('looks good to me');

    await expect(engine.verify(task, 'qa', output)).rejects.toThrow(
      VerificationError,
    );
  });

  it('throws VerificationError on an unexpected verdict shape', async () => {
    const { engine } = setup('{"ok": true}');

    await expect(engine.verify(task, 'qa', output)).rejects.toThrow(
      VerificationError,
    );
  });
});
