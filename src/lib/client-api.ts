const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T;

  constructor(status: number, data: T, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export class UnauthorizedError<T = unknown> extends ApiError<T> {
  constructor(data: T, message?: string) {
    super(401, data, message ?? "Authentication required");
    this.name = "UnauthorizedError";
  }
}

export class QuotaExceededError<T = unknown> extends ApiError<T> {
  constructor(data: T, message?: string) {
    super(429, data, message ?? "Message quota exceeded");
    this.name = "QuotaExceededError";
  }
}

export interface ApiFetchOptions<TBody = unknown> {
  method?: string;
  body?: TBody;
  headers?: HeadersInit;
  csrf?: boolean;
  retryOn401?: boolean;
  expectJson?: boolean;
  requestInit?: Omit<RequestInit, "method" | "headers" | "body" | "credentials">;
}

export interface ApiResponse<T = unknown> {
  data: T;
  response: Response;
}

export function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)tg_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function mergeHeaders(existing: HeadersInit | undefined, updates: Record<string, string>): Headers {
  const headers = new Headers(existing ?? {});
  Object.entries(updates).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return headers;
}

export function authFetch(input: FetchInput, init: FetchInit = {}): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: "include",
  });
}

export function csrfFetch(input: FetchInput, init: FetchInit = {}): Promise<Response> {
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    return Promise.reject(new Error("CSRF token missing. Please sign in again."));
  }

  const headers = mergeHeaders(init?.headers, { "X-CSRF-Token": csrfToken });

  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
}

type RefreshResult =
  | { ok: true }
  | { ok: false; status?: number; data?: unknown };

async function refreshSession(): Promise<RefreshResult> {
  try {
    const res = await authFetch("/api/auth/refresh", { method: "POST" });
    if (res.ok) {
      return { ok: true };
    }

    const contentType = res.headers.get("content-type") ?? "";
    let data: unknown;

    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => undefined);
    } else if (contentType.includes("text/")) {
      data = await res.text().catch(() => undefined);
    }

    return { ok: false, status: res.status, data };
  } catch (error) {
    console.error("Session refresh failed", error);
    return { ok: false };
  }
}

function shouldUseCsrf(method: string, override: boolean | undefined): boolean {
  if (typeof override === "boolean") return override;
  return MUTATING_METHODS.has(method);
}

function prepareBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === "string" || body instanceof Blob || body instanceof FormData || body instanceof URLSearchParams) {
    return body as BodyInit;
  }

  headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json().catch(() => undefined)) as T;
  }

  return (await response.text().catch(() => undefined)) as T;
}

function buildErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const maybeDetail = (data as Record<string, unknown>).detail;
    if (typeof maybeDetail === "string") return maybeDetail;
    if (Array.isArray(maybeDetail)) {
      const entry = maybeDetail[0];
      if (entry && typeof entry === "object" && "msg" in entry) {
        return String((entry as Record<string, unknown>).msg);
      }
    }

    const maybeError = (data as Record<string, unknown>).error;
    if (typeof maybeError === "string") return maybeError;
  }

  return `Request failed with status ${status}`;
}

/**
 * Extract error message from various error types.
 *
 * @deprecated Use getErrorMessage from '@/types/api-error' instead.
 * This function is kept for backward compatibility but will be removed in a future version.
 *
 * @param error - The error to extract message from
 * @returns Human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return buildErrorMessage(error.data, error.status);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

/**
 * Extract error message for message sending with special handling for quota exceeded (429).
 * Returns a friendly, poetic message for quota errors instead of technical error text.
 *
 * @param error - The error from message send attempt
 * @returns Human-readable error message
 *
 * @example
 * ```ts
 * try {
 *   await sendMessage(content);
 * } catch (err) {
 *   setError(getMessageSendErrorMessage(err));
 * }
 * ```
 */
export function getMessageSendErrorMessage(error: unknown): string {
  if (error instanceof QuotaExceededError) {
    return "Your weekly message limit has been reached.";
  }

  if (error instanceof ApiError) {
    return buildErrorMessage(error.data, error.status);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to send message";
}

export async function apiFetch<T = unknown>(input: FetchInput, options: ApiFetchOptions = {}): Promise<ApiResponse<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = mergeHeaders(options.headers, { Accept: "application/json" });
  const body = prepareBody(options.body, headers);

  const needsCsrf = shouldUseCsrf(method, options.csrf);
  const fetcher = needsCsrf ? csrfFetch : authFetch;

  const init: RequestInit = {
    ...(options.requestInit ?? {}),
    method,
    headers,
    body,
    credentials: "include",
  };

  let response = await fetcher(input, init);

  if (response.status === 401 && options.retryOn401 !== false) {
    const refreshResult = await refreshSession();
    if (refreshResult.ok) {
      response = await fetcher(input, init);
    } else if (refreshResult.status === 401 && refreshResult.data !== undefined) {
      const message = buildErrorMessage(refreshResult.data, refreshResult.status);
      throw new UnauthorizedError(refreshResult.data, message);
    }
  }

  const responsePayload = await readBody<T>(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new UnauthorizedError(responsePayload, buildErrorMessage(responsePayload, response.status));
    }
    if (response.status === 429) {
      throw new QuotaExceededError(responsePayload, buildErrorMessage(responsePayload, response.status));
    }
    throw new ApiError(response.status, responsePayload, buildErrorMessage(responsePayload, response.status));
  }

  const data = options.expectJson === false ? (undefined as T) : (responsePayload as T);
  return { data, response };
}
