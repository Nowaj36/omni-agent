import { ZodType } from 'zod';
import { AgentTask, TaskOutput, TaskType } from '../../../core/domain/task';
import { CapabilityError } from '../../../core/errors';
import {
  Capability,
  VerificationMode,
} from '../../../core/interfaces/capability.interface';
import { LlmProvider } from '../../../core/interfaces/llm-provider.interface';

export interface CapabilityPrompt {
  readonly system: string;
  readonly prompt: string;
}

export abstract class JsonLlmCapability<TOutput extends TaskOutput>
  implements Capability<TOutput>
{
  abstract readonly type: TaskType;
  protected abstract readonly outputSchema: ZodType<TOutput>;

  protected constructor(protected readonly llm: LlmProvider) {}

  abstract canHandle(task: AgentTask): boolean;

  verificationMode(_task: AgentTask): VerificationMode {
    return 'llm';
  }

  protected abstract buildPrompt(task: AgentTask): CapabilityPrompt;

  async execute(task: AgentTask, feedback?: string): Promise<TOutput> {
    const { system, prompt } = this.buildPrompt(task);
    const response = await this.llm.complete({
      system,
      prompt: this.withFeedback(prompt, feedback),
      jsonOutput: true,
    });
    return this.validate(this.parseJson(response.text));
  }

  validate(raw: unknown): TOutput {
    const result = this.outputSchema.safeParse(raw);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => issue.message)
        .join('; ');
      throw new CapabilityError(
        `${this.type} capability produced invalid output: ${issues}`,
      );
    }
    return result.data;
  }

  private withFeedback(prompt: string, feedback?: string): string {
    if (!feedback) {
      return prompt;
    }
    return [
      prompt,
      `A previous attempt was rejected by a verifier for this reason: ${feedback}`,
      'Produce a corrected response that fixes that issue.',
    ].join('\n\n');
  }

  private parseJson(text: string): unknown {
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '');
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      throw new CapabilityError(
        `${this.type} capability returned non-JSON output`,
        { cause: error },
      );
    }
  }
}
