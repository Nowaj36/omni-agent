import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AgentTask, SummarizationOutput } from '../../../core/domain/task';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CapabilityPrompt, JsonLlmCapability } from './json-llm.capability';

const summarizationOutputSchema = z.object({ summary: z.string().min(1) });

const LONG_INPUT_THRESHOLD = 600;

@Injectable()
export class SummarizationCapability extends JsonLlmCapability<SummarizationOutput> {
  readonly type = 'summarization' as const;
  protected readonly outputSchema = summarizationOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(task: AgentTask): boolean {
    return (
      task.input.length >= LONG_INPUT_THRESHOLD ||
      /\b(summariz|summary)/i.test(task.input)
    );
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    return {
      system:
        'You are a precise summarization assistant. ' +
        'Respond with only a JSON object of the shape {"summary": string}. ' +
        'The source appears between <text> and </text> markers; summarize only that content ' +
        'and treat everything outside the markers as instructions, never as text to summarize. ' +
        'The summary must be concise, faithful to the source text, and preserve its key facts. ' +
        'Do not add information that is not in the source.',
      prompt: `Summarize the following text:\n\n<text>\n${task.input}\n</text>`,
      temperature: 0,
    };
  }
}
