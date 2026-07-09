import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  AgentTask,
  CODE_LANGUAGES,
  CodeDebuggingOutput,
} from '../../../core/domain/task';
import { CapabilityError } from '../../../core/errors';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { namedLanguages, plainSourceCode } from './code-language';
import { CapabilityPrompt, JsonLlmCapability } from './json-llm.capability';

const codeDebuggingOutputSchema = z.object({
  language: z.enum(CODE_LANGUAGES),
  issues: z.array(z.object({ message: z.string().min(1) })),
  fixedCode: plainSourceCode,
});

const ACTION_KEYWORDS = /\b(debug|fix|repair|troubleshoot|diagnose|resolve)\b/i;

const CODE_KEYWORDS =
  /\b(javascript|typescript|python|code|function|script|snippet|program|error|exception|bug|crash)\b/i;

@Injectable()
export class CodeDebuggingCapability extends JsonLlmCapability<CodeDebuggingOutput> {
  readonly type = 'debug' as const;
  protected readonly outputSchema = codeDebuggingOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(task: AgentTask): boolean {
    return ACTION_KEYWORDS.test(task.input) && CODE_KEYWORDS.test(task.input);
  }

  override async execute(
    task: AgentTask,
    feedback?: string,
  ): Promise<CodeDebuggingOutput> {
    const output = await super.execute(task, feedback);
    const requested = namedLanguages(task.input);
    if (requested.length === 1 && output.language !== requested[0]) {
      throw new CapabilityError(
        `debug returned ${output.language} code, but the task asked for ${requested[0]}`,
      );
    }
    return output;
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    return {
      system:
        'You are a precise code-debugging assistant. ' +
        'Respond with only a JSON object of the shape {"language": string, "issues": [{"message": string}], "fixedCode": string}. ' +
        `"language" must be lowercase and exactly one of: ${CODE_LANGUAGES.join(', ')} — the language of the source code. ` +
        'List each distinct defect as one clear message in "issues". ' +
        '"fixedCode" must be the complete corrected source as executable source code only: ' +
        'never use markdown fences, never summarize changes, and never describe fixes outside the JSON object. ' +
        'If the code has no defects, return an empty "issues" array and the original code unchanged.',
      prompt: task.context
        ? `Context:\n${task.context}\n\nDebug the following code:\n\n${task.input}`
        : `Debug the following code:\n\n${task.input}`,
    };
  }
}
