import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AgentOrchestrator } from '../agent/application/agent-orchestrator';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../config/config.service';
import { WorkflowError } from '../core/errors';
import { formatAnswer } from './answer-formatter';
import { BatchTask, BatchTaskResult, batchInputSchema } from './batch-task.dto';

const FALLBACK_ANSWER = 'Unable to produce an answer for this task.';

@Injectable()
export class BatchRunner {
  constructor(
    private readonly orchestrator: AgentOrchestrator,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async run(): Promise<void> {
    const { inputPath, outputPath } = this.config.batch;
    const tasks = await this.readTasks(inputPath);
    this.logger.log(
      `Processing ${tasks.length} task(s) from ${inputPath}`,
      BatchRunner.name,
    );

    const results: BatchTaskResult[] = [];
    for (const task of tasks) {
      results.push(await this.runTask(task));
    }

    await this.writeResults(outputPath, results);
    this.logger.log(
      `Wrote ${results.length} result(s) to ${outputPath}`,
      BatchRunner.name,
    );
  }

  private async readTasks(inputPath: string): Promise<readonly BatchTask[]> {
    let text: string;
    try {
      text = await readFile(inputPath, 'utf8');
    } catch (error) {
      throw new WorkflowError(`Cannot read batch input file at ${inputPath}`, {
        cause: error,
      });
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (error) {
      throw new WorkflowError(
        `Batch input file at ${inputPath} is not valid JSON`,
        { cause: error },
      );
    }

    const parsed = batchInputSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      throw new WorkflowError(
        `Batch input file has an invalid shape: ${issues}`,
      );
    }
    return parsed.data;
  }

  private async runTask(task: BatchTask): Promise<BatchTaskResult> {
    try {
      const result = await this.orchestrator.run({ input: task.prompt });
      this.logger.debug(
        `Task ${task.task_id} completed by ${result.taskType} ` +
          `(verification ${result.verification.passed ? 'passed' : 'failed'} ` +
          `after ${result.verification.attempts} attempt(s))`,
        BatchRunner.name,
      );
      return { task_id: task.task_id, answer: formatAnswer(result.output) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Task ${task.task_id} failed: ${message}`,
        undefined,
        BatchRunner.name,
      );
      return { task_id: task.task_id, answer: FALLBACK_ANSWER };
    }
  }

  private async writeResults(
    outputPath: string,
    results: readonly BatchTaskResult[],
  ): Promise<void> {
    try {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, JSON.stringify(results, null, 2), 'utf8');
    } catch (error) {
      throw new WorkflowError(`Cannot write batch results to ${outputPath}`, {
        cause: error,
      });
    }
  }
}
