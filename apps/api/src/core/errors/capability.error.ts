import { DomainError } from './domain.error';

export class CapabilityError extends DomainError {
  readonly code = 'CAPABILITY_ERROR';
}
