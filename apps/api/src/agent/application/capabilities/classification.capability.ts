import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AgentTask, ClassificationOutput } from '../../../core/domain/task';
import { CapabilityError } from '../../../core/errors';
import { VerificationMode } from '../../../core/interfaces/capability.interface';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CapabilityPrompt, JsonLlmCapability } from './json-llm.capability';

const classificationOutputSchema = z.object({ label: z.string().min(1) });

@Injectable()
export class ClassificationCapability extends JsonLlmCapability<ClassificationOutput> {
  readonly type = 'classification' as const;
  protected readonly outputSchema = classificationOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(task: AgentTask): boolean {
    return (task.labels?.length ?? 0) > 0;
  }

  // execute() already rejects any label outside the allowed set, so the
  // output space is fully constrained without an LLM verification pass.
  override verificationMode(): VerificationMode {
    return 'local';
  }

  override async execute(
    task: AgentTask,
    feedback?: string,
  ): Promise<ClassificationOutput> {
    const labels = this.requireLabels(task);
    const output = await super.execute(task, feedback);
    if (!labels.includes(output.label)) {
      throw new CapabilityError(
        `classification returned "${output.label}", which is not an allowed label`,
      );
    }
    return output;
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    const labels = this.requireLabels(task);
    return {
      system:
        'You are a precise text-classification assistant. ' +
        'Respond with only a JSON object of the shape {"label": string}. ' +
        'The label must be exactly one of the allowed labels.',
      prompt: `Allowed labels: ${labels.join(', ')}\n\nClassify the following text:\n\n${task.input}`,
    };
  }

  private requireLabels(task: AgentTask): readonly string[] {
    if (!task.labels || task.labels.length === 0) {
      throw new CapabilityError('classification tasks require labels');
    }
    return task.labels;
  }
}
