import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import { AgentResult, AgentTask } from '../../core/domain/task';
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
    let verification = await this.verificationEngine.verify(
      task,
      capability.type,
      output,
    );

    while (!verification.passed && attempts < AgentOrchestrator.MAX_ATTEMPTS) {
      this.logger.warn(
        `Verification failed (attempt ${attempts}): ${verification.feedback}`,
        AgentOrchestrator.name,
      );
      attempts += 1;
      output = await capability.execute(task, verification.feedback);
      verification = await this.verificationEngine.verify(
        task,
        capability.type,
        output,
      );
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
}
