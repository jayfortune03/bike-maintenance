export type ApiErrorKind = 'configuration' | 'http' | 'network';

export class ApiClientError extends Error {
  readonly name = 'ApiClientError';

  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export class SessionExpiredError extends Error {
  readonly name = 'SessionExpiredError';

  constructor() {
    super('Session expired');
  }
}

export class StaleSessionError extends Error {
  readonly name = 'StaleSessionError';

  constructor() {
    super('Session changed while request was running');
  }
}

export class SessionStorageError extends Error {
  readonly name = 'SessionStorageError';

  constructor() {
    super('Secure session storage is unavailable');
  }
}
