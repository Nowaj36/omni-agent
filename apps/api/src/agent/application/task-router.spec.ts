import { AgentTask, TaskType } from '../../core/domain/task';
import { WorkflowError } from '../../core/errors';
import { Capability } from '../../core/interfaces/capability.interface';
import { TaskRouter } from './task-router';

function capabilityStub(type: TaskType, matches: boolean): Capability {
  return {
    type,
    canHandle: () => matches,
    execute: () => Promise.resolve({ answer: 'stub' }),
    validate: () => ({ answer: 'stub' }),
  };
}

describe('TaskRouter', () => {
  it('routes to the capability matching an explicit type', () => {
    const classification = capabilityStub('classification', true);
    const qa = capabilityStub('qa', true);
    const router = new TaskRouter([classification, qa]);

    const task: AgentTask = { type: 'qa', input: 'What is 2 + 2?' };

    expect(router.route(task).type).toBe('qa');
  });

  it('auto-detects using the first capability that can handle the task', () => {
    const classification = capabilityStub('classification', false);
    const summarization = capabilityStub('summarization', true);
    const qa = capabilityStub('qa', true);
    const router = new TaskRouter([classification, summarization, qa]);

    const task: AgentTask = { input: 'Summarize this article...' };

    expect(router.route(task).type).toBe('summarization');
  });

  it('throws WorkflowError when no capability matches', () => {
    const classification = capabilityStub('classification', false);
    const router = new TaskRouter([classification]);

    const task: AgentTask = { input: 'Anything' };

    expect(() => router.route(task)).toThrow(WorkflowError);
  });
});
