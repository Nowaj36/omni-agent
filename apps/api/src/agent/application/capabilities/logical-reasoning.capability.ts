import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AgentTask, ReasoningOutput } from '../../../core/domain/task';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from '../../../core/interfaces/llm-provider.interface';
import { CapabilityPrompt, JsonLlmCapability } from './json-llm.capability';

const reasoningOutputSchema = z.object({ answer: z.string().min(1) });

const REASONING_KEYWORDS =
  /\b(syllogism|deduc(?:e|tion|tive)|premises?|infer(?:ence)?|logic(?:al(?:ly)?)?|riddle|puzzle|constraint satisfaction|paradox|eliminate|arrange|sequenc(?:e|ing)|ordering|truth table)\b/i;

// An "if ... then ..." within a single clause signals conditional reasoning.
const CONDITIONAL_PATTERN = /\bif\b[^.?!]*\bthen\b/i;

// The classic universal-quantifier syllogism form ("All men are mortal").
const QUANTIFIER_PATTERN = /\ball \w+ are \w+/i;

// A single comparative is usually a factual question; two or more chained
// comparatives signal an ordering puzzle.
const COMPARATIVE =
  '\\b(?:older|younger|taller|shorter|faster|slower|heavier|lighter|bigger|smaller) than\\b';
const ORDERING_PATTERN = new RegExp(
  `${COMPARATIVE}[\\s\\S]*${COMPARATIVE}`,
  'i',
);

@Injectable()
export class LogicalReasoningCapability extends JsonLlmCapability<ReasoningOutput> {
  readonly type = 'reasoning' as const;
  protected readonly outputSchema = reasoningOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(task: AgentTask): boolean {
    return (
      REASONING_KEYWORDS.test(task.input) ||
      CONDITIONAL_PATTERN.test(task.input) ||
      QUANTIFIER_PATTERN.test(task.input) ||
      ORDERING_PATTERN.test(task.input)
    );
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    return {
      system:
        'You are a precise logical-reasoning assistant. ' +
        'Respond with only a JSON object of the shape {"answer": string}. ' +
        'Think the problem through carefully and completely, then put only the final conclusion in "answer". ' +
        'Never expose chain-of-thought, reasoning steps, or explanations — state the conclusion directly. ' +
        'If multiple conclusions are possible, return the single best-supported conclusion.',
      prompt: task.context
        ? `Context:\n${task.context}\n\nSolve the following reasoning problem:\n\n${task.input}`
        : `Solve the following reasoning problem:\n\n${task.input}`,
    };
  }
}
