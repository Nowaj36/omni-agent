import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AgentTask, QaOutput } from '../../../core/domain/task';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CapabilityPrompt, JsonLlmCapability } from './json-llm.capability';

const qaOutputSchema = z.object({ answer: z.string().min(1) });

@Injectable()
export class QaCapability extends JsonLlmCapability<QaOutput> {
  readonly type = 'qa' as const;
  protected readonly outputSchema = qaOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(): boolean {
    return true;
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    return {
      system:
        'You are a precise question-answering assistant. ' +
        'Respond with only a JSON object of the shape {"answer": string}. ' +
        'Answer directly and state only facts you are certain of; never guess or embellish. ' +
        'If the question assumes something false, correct the assumption instead of inventing an answer that satisfies it. ' +
        'Use the provided context when it is relevant.',
      prompt: task.context
        ? `Context:\n${task.context}\n\nQuestion:\n${task.input}`
        : `Question:\n${task.input}`,
      temperature: 0,
    };
  }
}
