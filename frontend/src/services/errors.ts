import { fr } from '../i18n/fr';

/** Erreur unique remontée par la couche de services (API réelle ou mock). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const toApiError = (e: unknown): ApiError => {
  if (e instanceof ApiError) return e;
  if (e instanceof DOMException && (e.name === 'AbortError' || e.name === 'TimeoutError'))
    return new ApiError(0, 'TIMEOUT', fr.errors.timeout);
  if (e instanceof TypeError) return new ApiError(0, 'NETWORK_ERROR', fr.errors.network);
  return new ApiError(0, 'UNKNOWN', fr.errors.unknown);
};
