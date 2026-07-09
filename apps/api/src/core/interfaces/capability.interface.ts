import { AgentTask, TaskOutput, TaskType } from '../domain/task';

/**
 * How a capability's output must be gated before it is returned:
 * - 'llm'   — an LLM verification pass is required.
 * - 'local' — deterministic checks inside the capability already gate the
 *             output; no LLM verification call is needed.
 */
export type VerificationMode = 'llm' | 'local';

export interface Capability<TOutput extends TaskOutput = TaskOutput> {
  readonly type: TaskType;
  canHandle(task: AgentTask): boolean;
  execute(task: AgentTask, feedback?: string): Promise<TOutput>;
  validate(raw: unknown): TOutput;
  verificationMode(task: AgentTask): VerificationMode;
}

export const CAPABILITIES = Symbol('CAPABILITIES');
