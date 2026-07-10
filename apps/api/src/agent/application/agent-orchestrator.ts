import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import {
  AgentResult,
  AgentTask,
  TaskOutput,
  TaskType,
} from '../../core/domain/task';
import { VerificationResult } from '../../core/domain/verification';
import { TaskRouter } from './task-router';
import { VerificationEngine } from './verification-engine';

@Injectable()
export class AgentOrchestrator {
  private static readonly MAX_ATTEMPTS = 2;

  constructor(
    private readonly router: TaskRouter,
    private readonly verificationEngine: VerificationEngine,
    private readonly logger: LoggerService,
  ) {}

  async run(task: AgentTask): Promise<AgentResult> {
    const capability = this.router.route(task);
    this.logger.log(
      `Routed task to ${capability.type} capability`,
      AgentOrchestrator.name,
    );

    let attempts = 1;
    let output = await capability.execute(task);

    if (capability.verificationMode(task) === 'local') {
      this.logger.log(
        `Accepted ${capability.type} output via local validation (LLM verification skipped)`,
        AgentOrchestrator.name,
      );
      return {
        taskType: capability.type,
        output,
        verification: { passed: true, attempts, feedback: undefined },
      };
    }

    let verification = await this.verifySafely(task, capability.type, output);
    while (
      verification !== undefined &&
      this.shouldRetry(verification, attempts)
    ) {
      this.logger.warn(
        `Verification failed (attempt ${attempts}): ${verification.feedback}`,
        AgentOrchestrator.name,
      );
      attempts += 1;
      output = await capability.execute(task, verification.feedback);
      verification = await this.verifySafely(task, capability.type, output);
    }

    if (verification === undefined) {
      return {
        taskType: capability.type,
        output,
        verification: {
          passed: false,
          attempts,
          feedback:
            'Verification was unavailable; the output passed local validation only.',
        },
      };
    }

    return {
      taskType: capability.type,
      output,
      verification: {
        passed: verification.passed,
        attempts,
        feedback: verification.passed ? undefined : verification.feedback,
      },
    };
  }

  // Retrying without feedback would regenerate a near-identical answer, so it
  // only wastes provider calls.
  private shouldRetry(
    verification: VerificationResult,
    attempts: number,
  ): boolean {
    return (
      !verification.passed &&
      verification.feedback.trim().length > 0 &&
      attempts < AgentOrchestrator.MAX_ATTEMPTS
    );
  }

  // A verifier failure must not discard an output that already passed the
  // capability's local validation — the generation call would be wasted and
  // retrying would not make the verifier available again.
  private async verifySafely(
    task: AgentTask,
    taskType: TaskType,
    output: TaskOutput,
  ): Promise<VerificationResult | undefined> {
    try {
      return await this.verificationEngine.verify(task, taskType, output);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Verification unavailable (${message}); accepting locally validated output`,
        AgentOrchestrator.name,
      );
      return undefined;
    }
  }
}
