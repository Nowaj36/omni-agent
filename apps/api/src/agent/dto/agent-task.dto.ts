import { z } from 'zod';
import { TASK_TYPES } from '../../core/domain/task';

export const agentTaskRequestSchema = z
  .object({
    type: z.enum(TASK_TYPES).optional(),
    input: z.string().min(1).max(20_000),
    context: z.string().min(1).max(20_000).optional(),
    labels: z.array(z.string().min(1)).min(2).max(25).optional(),
  })
  .refine(
    (task) => task.type !== 'classification' || (task.labels?.length ?? 0) >= 2,
    {
      message: 'classification tasks require at least 2 labels',
      path: ['labels'],
    },
  );

export type AgentTaskRequestDto = z.infer<typeof agentTaskRequestSchema>;
