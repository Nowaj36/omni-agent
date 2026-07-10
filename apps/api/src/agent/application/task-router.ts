import { Inject, Injectable } from '@nestjs/common';
import { AgentTask } from '../../core/domain/task';
import { WorkflowError } from '../../core/errors';
import {
  CAPABILITIES,
  type Capability,
} from '../../core/interfaces/capability.interface';

@Injectable()
export class TaskRouter {
  constructor(
    @Inject(CAPABILITIES) private readonly capabilities: readonly Capability[],
  ) {}

  route(task: AgentTask): Capability {
    const capability = task.type
      ? this.capabilities.find((candidate) => candidate.type === task.type)
      : this.capabilities.find((candidate) => candidate.canHandle(task));

    if (!capability) {
      throw new WorkflowError(
        task.type
          ? `No capability registered for task type "${task.type}"`
          : 'No capability can handle this task',
      );
    }
    return capability;
  }
}
