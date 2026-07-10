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

const SENTIMENT_LABELS = ['positive', 'negative', 'neutral'] as const;

const SENTIMENT_KEYWORD = /\bsentiments?\b/i;

// A sentiment mention alone is not enough (a review can talk about
// "public sentiment"); it must be paired with an explicit request verb or a
// bare "Sentiment:" / "...sentiment?" prompt form.
const SENTIMENT_REQUEST_CUE =
  /\b(?:classify|classification|categori[sz]e|label|determine|identify|analy[sz]e|detect|what\s+is|what's)\b/i;

const BARE_SENTIMENT_CUE = /\bsentiments?\s*[:?]/i;

// "positive or negative" / "positive, negative, or neutral" — the prompt
// enumerates polarity options to choose from.
const POLARITY_CHOICE =
  /\b(?:positive|negative|neutral)\b(?:\s*,\s*(?:positive|negative|neutral)\b)*\s*,?\s*or\s+(?:positive|negative|neutral)\b/i;

// The polarity choice must be asked about a piece of text ("is this review
// ...", "whether the comment is ..."), so factual QA such as "is 7 a positive
// or negative number" is never captured.
const TEXT_SUBJECT =
  /\b(?:is|was)\s+(?:this|that|the)\s+(?:review|text|comment|feedback|tweet|post|message|sentence|paragraph)\b|\b(?:this|that|the)\s+(?:review|text|comment|feedback|tweet|post|message|sentence|paragraph)\s+(?:is|was)\b/i;

@Injectable()
export class ClassificationCapability extends JsonLlmCapability<ClassificationOutput> {
  readonly type = 'classification' as const;
  protected readonly outputSchema = classificationOutputSchema;

  constructor(@Inject(LLM_PROVIDER) llm: LlmProvider) {
    super(llm);
  }

  canHandle(task: AgentTask): boolean {
    return (
      (task.labels?.length ?? 0) > 0 ||
      this.isSentimentClassificationPrompt(task.input)
    );
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
    const labels = this.resolveLabels(task);
    const output = await super.execute(task, feedback);
    if (!labels.includes(output.label)) {
      throw new CapabilityError(
        `classification returned "${output.label}", which is not an allowed label`,
      );
    }
    return output;
  }

  protected buildPrompt(task: AgentTask): CapabilityPrompt {
    const labels = this.resolveLabels(task);
    return {
      system:
        'You are a precise text-classification assistant. ' +
        'Respond with only a JSON object of the shape {"label": string}. ' +
        'The label must be exactly one of the allowed labels.',
      prompt: `Allowed labels: ${labels.join(', ')}\n\nClassify the following text:\n\n${task.input}`,
    };
  }

  // Explicit labels always win; label-less tasks are only accepted when the
  // prompt itself clearly requests sentiment classification.
  private resolveLabels(task: AgentTask): readonly string[] {
    if (task.labels && task.labels.length > 0) {
      return task.labels;
    }
    if (this.isSentimentClassificationPrompt(task.input)) {
      return this.inferSentimentLabels(task.input);
    }
    throw new CapabilityError('classification tasks require labels');
  }

  private isSentimentClassificationPrompt(input: string): boolean {
    if (SENTIMENT_KEYWORD.test(input)) {
      return (
        SENTIMENT_REQUEST_CUE.test(input) || BARE_SENTIMENT_CUE.test(input)
      );
    }
    return POLARITY_CHOICE.test(input) && TEXT_SUBJECT.test(input);
  }

  // When the prompt enumerates the options ("positive or negative"), only
  // those become allowed labels; otherwise the full sentiment set applies.
  private inferSentimentLabels(input: string): readonly string[] {
    const choice = POLARITY_CHOICE.exec(input);
    if (!choice) {
      return SENTIMENT_LABELS;
    }
    const enumerated = SENTIMENT_LABELS.filter((label) =>
      choice[0].toLowerCase().includes(label),
    );
    return enumerated.length >= 2 ? enumerated : SENTIMENT_LABELS;
  }
}
