import { Test } from '@nestjs/testing';
import { LoggerService } from '../../common/logger/logger.service';
import { AgentTask, QaOutput } from '../../core/domain/task';
import { VerificationResult } from '../../core/domain/verification';
import { Capability } from '../../core/interfaces/capability.interface';
import { AgentOrchestrator } from './agent-orchestrator';
import { TaskRouter } from './task-router';
import { VerificationEngine } from './verification-engine';

describe('AgentOrchestrator', () => {
  const task: AgentTask = { type: 'qa', input: 'What is 2 + 2?' };
  const firstOutput: QaOutput = { answer: '5' };
  const correctedOutput: QaOutput = { answer: '4' };

  async function setup(verdicts: VerificationResult[]) {
    const execute = jest
      .fn<Promise<QaOutput>, [AgentTask, string?]>()
      .mockResolvedValueOnce(firstOutput)
      .mockResolvedValueOnce(correctedOutput);
    const capability: Capability<QaOutput> = {
      type: 'qa',
      canHandle: () => true,
      execute,
      validate: () => firstOutput,
    };
    const verify = jest.fn<Promise<VerificationResult>, unknown[]>();
    for (const verdict of verdicts) {
      verify.mockResolvedValueOnce(verdict);
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        AgentOrchestrator,
        { provide: TaskRouter, useValue: { route: () => capability } },
        { provide: VerificationEngine, useValue: { verify } },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile();

    return { orchestrator: moduleRef.get(AgentOrchestrator), execute, verify };
  }

  it('returns after one attempt when verification passes', async () => {
    const { orchestrator, execute } = await setup([
      { passed: true, feedback: 'Looks correct.' },
    ]);

    const result = await orchestrator.run(task);

    expect(result.taskType).toBe('qa');
    expect(result.output).toEqual(firstOutput);
    expect(result.verification).toEqual({
      passed: true,
      attempts: 1,
      feedback: undefined,
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('retries once with verifier feedback when verification fails', async () => {
    const { orchestrator, execute } = await setup([
      { passed: false, feedback: 'The answer is wrong: 2 + 2 = 4.' },
      { passed: true, feedback: 'Correct now.' },
    ]);

    const result = await orchestrator.run(task);

    expect(result.output).toEqual(correctedOutput);
    expect(result.verification.passed).toBe(true);
    expect(result.verification.attempts).toBe(2);
    expect(execute).toHaveBeenNthCalledWith(
      2,
      task,
      'The answer is wrong: 2 + 2 = 4.',
    );
  });

  it('stops after max attempts and reports the failure', async () => {
    const { orchestrator, execute } = await setup([
      { passed: false, feedback: 'Wrong.' },
      { passed: false, feedback: 'Still wrong.' },
    ]);

    const result = await orchestrator.run(task);

    expect(result.verification).toEqual({
      passed: false,
      attempts: 2,
      feedback: 'Still wrong.',
    });
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
