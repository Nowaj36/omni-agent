import { AgentTask, TaskOutput, TaskType } from '../domain/task';

export interface Capability<TOutput extends TaskOutput = TaskOutput> {
  readonly type: TaskType;
  canHandle(task: AgentTask): boolean;
  execute(task: AgentTask, feedback?: string): Promise<TOutput>;
  validate(raw: unknown): TOutput;
}

export const CAPABILITIES = Symbol('CAPABILITIES');
