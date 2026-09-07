const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** FastAPI validation errors (422) return `detail` as an array of
 * { loc, msg, type } objects, not a string. Extract something readable
 * instead of letting it fall through to Error's default stringification
 * (which silently produces the literal string "[object Object]"). */
function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const detail = (data as Record<string, unknown>).detail ?? (data as Record<string, unknown>).message;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String((item as { msg: unknown }).msg) : null))
      .filter(Boolean);
    if (messages.length) return messages.join(' ');
  }

  return fallback;
}

const AUTH_TOKEN_STORAGE_KEY = 'fundry_auth_token';

/** Reads the stored JWT, if any. No-ops on the server (SSR has no localStorage). */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the stored bearer token. Defaults to true — opt out for public endpoints if it matters. */
  auth?: boolean;
}

/** Shared fetch wrapper: builds the request, attaches auth, and normalizes errors. */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getStoredAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(data, res.statusText || 'Request failed'), res.status);
  }
  return data as T;
}

/** Minimal typed fetch wrapper for POST requests. */
export async function apiPost<T>(path: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'POST', body });
}

/** Minimal typed fetch wrapper for GET requests. */
export async function apiGet<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' });
}

/** Minimal typed fetch wrapper for PUT requests (full-resource replace/upsert). */
export async function apiPut<T>(path: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'PUT', body });
}

/** Minimal typed fetch wrapper for PATCH requests (partial update). */
export async function apiPatch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'PATCH', body });
}

/** Minimal typed fetch wrapper for DELETE requests. */
export async function apiDelete<T = void>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' });
}
