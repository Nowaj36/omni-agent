import { DomainError } from './domain.error';

export class WorkflowError extends DomainError {
  readonly code = 'WORKFLOW_ERROR';
}
