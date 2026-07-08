export const TASK_TYPES = ['qa', 'summarization', 'classification'] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export interface AgentTask {
  readonly type?: TaskType;
  readonly input: string;
  readonly context?: string;
  readonly labels?: readonly string[];
}

export interface QaOutput {
  readonly answer: string;
}

export interface SummarizationOutput {
  readonly summary: string;
}

export interface ClassificationOutput {
  readonly label: string;
}

export type TaskOutput = QaOutput | SummarizationOutput | ClassificationOutput;

export interface VerificationReport {
  readonly passed: boolean;
  readonly attempts: number;
  readonly feedback?: string;
}

export interface AgentResult {
  readonly taskType: TaskType;
  readonly output: TaskOutput;
  readonly verification: VerificationReport;
}
