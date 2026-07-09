import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  AgentTask,
  CODE_LANGUAGES,
  CodeGenerationOutput,
} from '../../../core/domain/task';
import { CapabilityError } from '../../../core/errors';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CapabilityPrompt, JsonLlmCapability } from './json-llm.capability';

const codeGenerationOutputSchema = z.object({
  language: z.enum(CODE_LANGUAGES),
  code: z
    .string()
    .min(1)
    .refine((code) => !code.trimStart().startsWith('```'), {
      message: 'code must be plain source without a markdown fence',
    }),
});

const ACTION_KEYWORDS =
  /\b(write|implement|generate|program|code|create\s+(?:a\s+|an\s+|the\s+)?(?:function|script))\b/i;

const CODE_KEYWORDS =
  /\b(javascript|typescript|python|code|function|script|snippet|program|algorithm|regex)\b/i;

@Injectable()
export class CodeGenerationCapability extends JsonLlmCapability<CodeGenerationOutput> {
  readonly type = 'codegen' as const;
  protected readonly outputSchema = codeGenerationOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(task: AgentTask): boolean {
    return ACTION_KEYWORDS.test(task.input) && CODE_KEYWORDS.test(task.input);
  }

  override async execute(
    task: AgentTask,
    feedback?: string,
  ): Promise<CodeGenerationOutput> {
    const output = await super.execute(task, feedback);
    const requested = CODE_LANGUAGES.filter((language) =>
      new RegExp(`\\b${language}\\b`, 'i').test(task.input),
    );
    if (requested.length === 1 && output.language !== requested[0]) {
      throw new CapabilityError(
        `codegen returned ${output.language} code, but the task asked for ${requested[0]}`,
      );
    }
    return output;
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    return {
      system:
        'You are a precise code-generation assistant. ' +
        'Respond with only a JSON object of the shape {"language": string, "code": string}. ' +
        `"language" must be lowercase and exactly one of: ${CODE_LANGUAGES.join(', ')}. ` +
        '"code" must be plain source code: never use markdown fences and never include explanations outside the JSON object; code comments are allowed. ' +
        'Use the language the request names; when none is named, choose the most suitable of the three. ' +
        'The code must be complete and runnable.',
      prompt: task.context
        ? `Context:\n${task.context}\n\nCoding request:\n${task.input}`
        : `Coding request:\n${task.input}`,
    };
  }
}
