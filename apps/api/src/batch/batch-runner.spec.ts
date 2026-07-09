import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import { AgentOrchestrator } from '../agent/application/agent-orchestrator';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../config/config.service';
import { AgentResult, AgentTask } from '../core/domain/task';
import { CapabilityError, WorkflowError } from '../core/errors';
import { BatchRunner } from './batch-runner';
import { BatchTaskResult } from './batch-task.dto';

describe('BatchRunner', () => {
  const qaResult: AgentResult = {
    taskType: 'qa',
    output: { answer: '4' },
    verification: { passed: true, attempts: 1 },
  };

  let workDir: string;
  let inputPath: string;
  let outputPath: string;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'batch-runner-'));
    inputPath = join(workDir, 'tasks.json');
    outputPath = join(workDir, 'output', 'results.json');
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  async function setup(run: jest.Mock<Promise<AgentResult>, [AgentTask]>) {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BatchRunner,
        { provide: AgentOrchestrator, useValue: { run } },
        {
          provide: ConfigService,
          useValue: { batch: { inputPath, outputPath } },
        },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    return { runner: moduleRef.get(BatchRunner), run };
  }

  async function readResults(): Promise<BatchTaskResult[]> {
    return JSON.parse(await readFile(outputPath, 'utf8'));
  }

  it('processes every task and writes results in input order', async () => {
    await writeFile(
      inputPath,
      JSON.stringify([
        { id: 'task-1', type: 'qa', input: 'What is 2 + 2?' },
        { id: 'task-2', type: 'summarization', input: 'Long text here.' },
      ]),
    );
    const run = jest
      .fn<Promise<AgentResult>, [AgentTask]>()
      .mockResolvedValue(qaResult);
    const { runner } = await setup(run);

    await runner.run();

    const results = await readResults();
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      index: 0,
      id: 'task-1',
      status: 'completed',
      taskType: 'qa',
      output: { answer: '4' },
    });
    expect(run).toHaveBeenNthCalledWith(1, {
      type: 'qa',
      input: 'What is 2 + 2?',
    });
  });

  it('records a failure for a task that throws and keeps processing', async () => {
    await writeFile(
      inputPath,
      JSON.stringify({
        tasks: [
          { id: 1, type: 'qa', input: 'First task' },
          { id: 2, type: 'qa', input: 'Second task' },
        ],
      }),
    );
    const run = jest
      .fn<Promise<AgentResult>, [AgentTask]>()
      .mockRejectedValueOnce(new CapabilityError('model returned garbage'))
      .mockResolvedValueOnce(qaResult);
    const { runner } = await setup(run);

    await runner.run();

    const results = await readResults();
    expect(results[0]).toMatchObject({
      id: 1,
      status: 'failed',
      error: { message: 'model returned garbage' },
    });
    expect(results[1]).toMatchObject({ id: 2, status: 'completed' });
  });

  it('throws a WorkflowError when the input file is missing', async () => {
    const run = jest.fn<Promise<AgentResult>, [AgentTask]>();
    const { runner } = await setup(run);

    await expect(runner.run()).rejects.toBeInstanceOf(WorkflowError);
    expect(run).not.toHaveBeenCalled();
  });

  it('throws a WorkflowError when the input file has an invalid shape', async () => {
    await writeFile(inputPath, JSON.stringify([{ input: '' }]));
    const run = jest.fn<Promise<AgentResult>, [AgentTask]>();
    const { runner } = await setup(run);

    await expect(runner.run()).rejects.toBeInstanceOf(WorkflowError);
  });
});
