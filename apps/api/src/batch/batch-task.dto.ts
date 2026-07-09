import { z } from 'zod';
import { agentTaskRequestSchema } from '../agent/dto/agent-task.dto';
import { AgentResult } from '../core/domain/task';

const batchTaskSchema = z.intersection(
  z.object({ id: z.union([z.string(), z.number()]).optional() }),
  agentTaskRequestSchema,
);

export const batchInputSchema = z
  .union([
    z.array(batchTaskSchema),
    z.object({ tasks: z.array(batchTaskSchema) }),
  ])
  .transform((input) => (Array.isArray(input) ? input : input.tasks));

export type BatchTask = z.infer<typeof batchTaskSchema>;

export interface BatchTaskSuccess extends AgentResult {
  readonly index: number;
  readonly id?: string | number;
  readonly status: 'completed';
}

export interface BatchTaskFailure {
  readonly index: number;
  readonly id?: string | number;
  readonly status: 'failed';
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

export type BatchTaskResult = BatchTaskSuccess | BatchTaskFailure;
