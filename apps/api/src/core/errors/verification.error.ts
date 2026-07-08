import { DomainError } from './domain.error';

export class VerificationError extends DomainError {
  readonly code = 'VERIFICATION_ERROR';
}
