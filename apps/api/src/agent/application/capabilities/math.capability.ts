import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AgentTask, MathOutput } from '../../../core/domain/task';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CapabilityPrompt, JsonLlmCapability } from './json-llm.capability';

const mathOutputSchema = z.object({ result: z.string().min(1) });

const MATH_KEYWORDS =
  /\b(calculate|compute|solve|equation|percent(?:age)?|average of|mean of|median|probability|algebra(?:ic)?|geometry|trigonometry|calculus|integral|derivative|ratio|proportion|fraction|square root|logarithm|exponent|sum of|product of|perimeter|circumference|hypotenuse|polynomial)\b/i;

// Digits joined by an arithmetic operator (e.g. "12 * (3 + 4)"). The minus
// sign requires surrounding spaces so dates like "2026-07-09" do not match.
const MATH_EXPRESSION =
  /\d(?:\.\d+)?\s*[+*/^×÷=]\s*\d|\d\s+-\s+\d|\d(?:\.\d+)?\s*%\s*of\b/i;

@Injectable()
export class MathCapability extends JsonLlmCapability<MathOutput> {
  readonly type = 'math' as const;
  protected readonly outputSchema = mathOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(task: AgentTask): boolean {
    return MATH_KEYWORDS.test(task.input) || MATH_EXPRESSION.test(task.input);
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    return {
      system:
        'You are a precise mathematical problem-solving assistant. ' +
        'Respond with only a JSON object of the shape {"result": string}. ' +
        'Solve the problem carefully and put only the final answer in "result". ' +
        'Simplify fully; include units or symbols only when the problem requires them.',
      prompt: task.context
        ? `Context:\n${task.context}\n\nProblem:\n${task.input}`
        : `Problem:\n${task.input}`,
    };
  }
}
