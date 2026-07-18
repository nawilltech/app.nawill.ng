import { getAccessToken } from './session';
import { ApiEnvelope, ApiError } from './types';

const API_URL = process.env.NAWILL_API_URL ?? 'http://localhost:4000/api/v1';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string;
  idempotencyKey?: string;
  /** Server Components caching — most dashboard reads want 'no-store' since balances/statuses change often. */
  cache?: RequestCache;
}

/**
 * Every apiFetch() call goes through this — the one place that knows the envelope
 * shape, attaches auth, and turns a `{success:false}` response into a thrown
 * ApiError so callers can just `await` and catch, rather than checking `.success`
 * everywhere (see docs/ARCHITECTURE.md §10 for the full request lifecycle).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.accessToken ?? getAccessToken();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? 'no-store',
  });

  const envelope = (await res.json()) as ApiEnvelope<T>;

  if (!envelope.success) {
    throw new ApiError(envelope.message, res.status, envelope.errorCode, envelope.errors);
  }

  return envelope.data;
}

/** Same as apiFetch, but returns the full envelope (data + meta) — for paginated list reads. */
export async function apiFetchPage<T>(path: string, options: RequestOptions = {}) {
  const token = options.accessToken ?? getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    cache: options.cache ?? 'no-store',
  });

  const envelope = (await res.json()) as ApiEnvelope<T[]>;
  if (!envelope.success) {
    throw new ApiError(envelope.message, res.status, envelope.errorCode, envelope.errors);
  }

  return { items: envelope.data, meta: envelope.meta };
}
