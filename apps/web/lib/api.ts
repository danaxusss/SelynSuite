/**
 * Tiny typed wrapper around the Selyn API. Used by Auth.js callbacks and
 * server actions only — never imported into a client component (we don't
 * leak the API base URL or session token into the bundle).
 */
import 'server-only';

const API_BASE =
  process.env.SELYN_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; body: unknown };

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<ApiResult<T>> {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers, cache: 'no-store' });
  const text = await res.text();
  const body: unknown = text ? safeJson(text) : null;
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, data: body as T };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
