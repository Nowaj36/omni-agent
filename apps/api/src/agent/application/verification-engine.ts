import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AgentTask, TaskOutput, TaskType } from '../../core/domain/task';
import { VerificationResult } from '../../core/domain/verification';
import { VerificationError } from '../../core/errors';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../core/interfaces/llm-provider.interface';

const verificationOutputSchema = z.object({
  passed: z.boolean(),
  feedback: z.string(),
});

@Injectable()
export class VerificationEngine {
  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async verify(
    task: AgentTask,
    taskType: TaskType,
    output: TaskOutput,
  ): Promise<VerificationResult> {
    const response = await this.llm.complete({
      system:
        'You are a strict quality verifier for an AI agent. ' +
        'Evaluate whether the produced output correctly satisfies the task. ' +
        'Respond with only a JSON object of the shape {"passed": boolean, "feedback": string}. ' +
        'Set passed=true only if the output is correct, relevant, and complete; minor stylistic differences are acceptable. ' +
        'When passed=false, feedback must state precisely what is wrong and how to fix it.',
      prompt: this.buildPrompt(task, taskType, output),
      temperature: 0,
      jsonOutput: true,
    });

    return this.parse(response.text);
  }

  private buildPrompt(
    task: AgentTask,
    taskType: TaskType,
    output: TaskOutput,
  ): string {
    const sections = [
      `Task type: ${taskType}`,
      `Task input:\n${task.input}`,
      task.context ? `Context:\n${task.context}` : undefined,
      task.labels?.length
        ? `Allowed labels: ${task.labels.join(', ')}`
        : undefined,
      `Produced output:\n${JSON.stringify(output)}`,
    ];
    return sections
      .filter((section): section is string => section !== undefined)
      .join('\n\n');
  }

  private parse(text: string): VerificationResult {
    let raw: unknown;
    try {
      raw = JSON.parse(text.trim());
    } catch (error) {
      throw new VerificationError('Verifier returned non-JSON output', {
        cause: error,
      });
    }

    const result = verificationOutputSchema.safeParse(raw);
    if (!result.success) {
      throw new VerificationError('Verifier returned an unexpected shape');
    }
    return result.data;
  }
}
