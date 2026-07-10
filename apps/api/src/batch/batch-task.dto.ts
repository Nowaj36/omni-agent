import { z } from 'zod';

const batchTaskSchema = z.object({
  task_id: z.string().min(1),
  prompt: z.string().min(1).max(20_000),
});

export const batchInputSchema = z.array(batchTaskSchema);

export type BatchTask = z.infer<typeof batchTaskSchema>;

export interface BatchTaskResult {
  readonly task_id: string;
  readonly answer: string;
}
