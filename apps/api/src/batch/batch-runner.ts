import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AgentOrchestrator } from '../agent/application/agent-orchestrator';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../config/config.service';
import { DomainError, WorkflowError } from '../core/errors';
import { BatchTask, BatchTaskResult, batchInputSchema } from './batch-task.dto';

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
    for (const [index, task] of tasks.entries()) {
      results.push(await this.runTask(task, index));
    }

    await this.writeResults(outputPath, results);
    const failed = results.filter((result) => result.status === 'failed');
    this.logger.log(
      `Wrote ${results.length} result(s) to ${outputPath} (${failed.length} failed)`,
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

  private async runTask(
    task: BatchTask,
    index: number,
  ): Promise<BatchTaskResult> {
    const { id, ...agentTask } = task;
    try {
      const result = await this.orchestrator.run(agentTask);
      return { index, id, status: 'completed', ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Task ${id ?? index} failed: ${message}`,
        undefined,
        BatchRunner.name,
      );
      return {
        index,
        id,
        status: 'failed',
        error: {
          code: error instanceof DomainError ? error.code : 'UNEXPECTED_ERROR',
          message,
        },
      };
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
