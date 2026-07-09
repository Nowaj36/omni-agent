export const TASK_TYPES = [
  'qa',
  'summarization',
  'classification',
  'math',
  'ner',
  'codegen',
] as const;

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

export interface MathOutput {
  readonly result: string;
}

export const ENTITY_TYPES = [
  'person',
  'organization',
  'location',
  'date',
  'email',
  'phone',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export interface NamedEntity {
  readonly text: string;
  readonly type: EntityType;
}

export interface NerOutput {
  readonly entities: readonly NamedEntity[];
}

export const CODE_LANGUAGES = ['javascript', 'typescript', 'python'] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export interface CodeGenerationOutput {
  readonly language: CodeLanguage;
  readonly code: string;
}

export type TaskOutput =
  | QaOutput
  | SummarizationOutput
  | ClassificationOutput
  | MathOutput
  | NerOutput
  | CodeGenerationOutput;

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
