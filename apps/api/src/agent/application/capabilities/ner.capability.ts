import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AgentTask, ENTITY_TYPES, NerOutput } from '../../../core/domain/task';
import { CapabilityError } from '../../../core/errors';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CapabilityPrompt, JsonLlmCapability } from './json-llm.capability';

const nerOutputSchema = z.object({
  entities: z.array(
    z.object({
      text: z
        .string()
        .min(1)
        .refine((text) => text === text.trim(), {
          message: 'entity text must not have leading or trailing whitespace',
        }),
      type: z.enum(ENTITY_TYPES),
    }),
  ),
});

const ACTION_KEYWORDS =
  /\b(extract|identify|find|detect|list|recognize|run|perform|apply)\b/i;

const ENTITY_KEYWORDS =
  /\b(named entit(?:y|ies)|entit(?:y|ies)|ner|people|persons?|names?|organizations?|compan(?:y|ies)|locations?|places?|dates?|e-?mails?|phone(?: numbers?)?)\b/i;

@Injectable()
export class NamedEntityRecognitionCapability extends JsonLlmCapability<NerOutput> {
  readonly type = 'ner' as const;
  protected readonly outputSchema = nerOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(task: AgentTask): boolean {
    return ACTION_KEYWORDS.test(task.input) && ENTITY_KEYWORDS.test(task.input);
  }

  override async execute(
    task: AgentTask,
    feedback?: string,
  ): Promise<NerOutput> {
    const output = await super.execute(task, feedback);
    const hallucinated = output.entities.find(
      (entity) => !task.input.includes(entity.text),
    );
    if (hallucinated) {
      throw new CapabilityError(
        `ner returned "${hallucinated.text}", which is not a verbatim span of the input`,
      );
    }
    return output;
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    return {
      system:
        'You are a precise named-entity-recognition assistant. ' +
        'Respond with only a JSON object of the shape {"entities": [{"text": string, "type": string}]}. ' +
        `"type" must be exactly one of: ${ENTITY_TYPES.join(', ')}. ` +
        'Each "text" must be an exact verbatim span copied from the source text: ' +
        'never normalize, never infer, never correct spelling, and never add or remove characters or whitespace. ' +
        'Return {"entities": []} when the text contains no entities.',
      prompt: task.context
        ? `Context:\n${task.context}\n\nExtract named entities from the following text:\n\n${task.input}`
        : `Extract named entities from the following text:\n\n${task.input}`,
    };
  }
}
