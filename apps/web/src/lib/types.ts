// Mirrors apps/api/src/core/domain/task.ts — the public API contract.

export const TASK_TYPES = [
  'qa',
  'summarization',
  'classification',
  'math',
  'ner',
  'codegen',
  'debug',
  'reasoning',
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export interface AgentTaskRequest {
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

export interface MathOutput {
  readonly result: string;
}

export interface NamedEntity {
  readonly text: string;
  readonly type: string;
}

export interface NerOutput {
  readonly entities: readonly NamedEntity[];
}

export type CodeLanguage = 'javascript' | 'typescript' | 'python';

export interface CodeGenerationOutput {
  readonly language: CodeLanguage;
  readonly code: string;
}

export interface CodeIssue {
  readonly message: string;
}

export interface CodeDebuggingOutput {
  readonly language: CodeLanguage;
  readonly issues: readonly CodeIssue[];
  readonly fixedCode: string;
}

export interface ReasoningOutput {
  readonly answer: string;
}

export type TaskOutput =
  | QaOutput
  | SummarizationOutput
  | ClassificationOutput
  | MathOutput
  | NerOutput
  | CodeGenerationOutput
  | CodeDebuggingOutput
  | ReasoningOutput;

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

export interface HealthStatus {
  readonly status: 'ok';
  readonly environment: string;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
}

// Mirrors apps/api/src/batch/batch-task.dto.ts.

export interface BatchTask {
  readonly task_id: string;
  readonly prompt: string;
}

export interface BatchTaskResult {
  readonly task_id: string;
  readonly answer: string;
}
