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
// A dedicated flag for *where* the token lives, so a page reload knows
// which storage to check without guessing (checking both every time would
// silently "restore" a session-only login after the browser was reopened —
// exactly what remember-me=off is supposed to prevent).
const AUTH_TOKEN_PERSIST_KEY = 'fundry_auth_persist';
// Dispatched when the server tells us this session was invalidated because
// the account logged in somewhere else — AuthProvider listens for this to
// force a logout + show a message, since call sites all over the app hit
// this same 401 and most of them just swallow errors silently.
export const SESSION_SUPERSEDED_EVENT = 'fundry:session-superseded';

/** Reads the stored JWT, if any. No-ops on the server (SSR has no localStorage). */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const persisted = window.localStorage.getItem(AUTH_TOKEN_PERSIST_KEY) === 'true';
  return persisted ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

/** `persist=true` (remember me checked) survives closing the browser;
 * `persist=false` only lasts for the current tab/session, same convention
 * as most "remember me" checkboxes. */
export function setStoredAuthToken(token: string, persist: boolean = true): void {
  window.localStorage.setItem(AUTH_TOKEN_PERSIST_KEY, String(persist));
  if (persist) {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
}

export function clearStoredAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_PERSIST_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
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
    if (res.status === 401 && res.headers.get('x-session-superseded') === 'true') {
      clearStoredAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SESSION_SUPERSEDED_EVENT));
      }
    }
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

/** Multipart file upload — used for media.upload. Skips the JSON
 * Content-Type header (fetch sets the multipart boundary itself) and
 * doesn't run the body through JSON.stringify. */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getStoredAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    if (res.status === 401 && res.headers.get('x-session-superseded') === 'true') {
      clearStoredAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SESSION_SUPERSEDED_EVENT));
      }
    }
    throw new ApiError(extractErrorMessage(data, res.statusText || 'Upload failed'), res.status);
  }
  return data as T;
}
