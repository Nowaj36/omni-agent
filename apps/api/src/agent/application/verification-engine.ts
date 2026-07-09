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
  // The verdict is a small JSON object; capping it keeps a rambling verifier
  // from spending output tokens.
  private static readonly MAX_VERDICT_TOKENS = 256;

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async verify(
    task: AgentTask,
    taskType: TaskType,
    output: TaskOutput,
  ): Promise<VerificationResult> {
    const response = await this.llm.complete({
      system:
        "You verify an AI agent's output against its task. " +
        'Respond with only JSON {"passed": boolean, "feedback": string}. ' +
        'passed=true only if the output is correct, relevant, and complete; ignore stylistic differences. ' +
        'When passed=false, feedback must state precisely what is wrong and how to fix it.',
      prompt: this.buildPrompt(task, taskType, output),
      temperature: 0,
      maxTokens: VerificationEngine.MAX_VERDICT_TOKENS,
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
