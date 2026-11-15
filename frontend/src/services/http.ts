import { fr } from '../i18n/fr';
import type { ErrorEnvelope } from '../types/api';
import { ApiError, toApiError } from './errors';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 20_000;

interface RequestOptions {
  body?: unknown;
  timeoutMs?: number;
}

const isErrorEnvelope = (x: unknown): x is ErrorEnvelope =>
  typeof x === 'object' &&
  x !== null &&
  'error' in x &&
  typeof (x as ErrorEnvelope).error?.message === 'string';

/** Appel JSON typé vers l'API Django REST. Les clés restent en snake_case. */
export async function request<T>(method: 'GET' | 'POST' | 'PUT', path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      if (isErrorEnvelope(payload)) throw new ApiError(response.status, payload.error.code, payload.error.message);
      throw new ApiError(response.status, 'HTTP_ERROR', fr.errors.unknown);
    }
    return payload as T;
  } catch (e) {
    throw toApiError(e);
  }
}
