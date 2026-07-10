import { DomainError } from './domain.error';

export class ProviderError extends DomainError {
  readonly code = 'PROVIDER_ERROR';
}
