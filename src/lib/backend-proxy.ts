import { NextResponse } from "next/server";

const API_PREFIX = "/api/v1";
const CSRF_COOKIE_NAME = "tg_csrf";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function normalizePath(path: string): string {
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return cleaned.startsWith(API_PREFIX) ? cleaned : `${API_PREFIX}${cleaned}`;
}

export function getCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const prefix = `${name}=`;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return undefined;
}

export function buildBackendUrl(path: string): string {
  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const normalizedPath = normalizePath(path);
  return `${baseUrl}${normalizedPath}`;
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function buildResponseHeaders(source: Headers): Headers {
  const headers = new Headers();

  // Copy all headers except hop-by-hop headers
  source.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowerKey) && lowerKey !== "set-cookie") {
      headers.set(key, value);
    }
  });

  // Handle set-cookie specially (can have multiple values)
  const getSetCookie = (source as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === "function") {
    for (const cookie of getSetCookie.call(source)) {
      headers.append("set-cookie", cookie);
    }
  } else {
    source.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        headers.append("set-cookie", value);
      }
    });
  }

  return headers;
}

export async function proxyBackendRequest(
  req: Request,
  path: string,
  init: RequestInit = {},
  options: { csrf?: boolean } = {}
): Promise<Response> {
  const url = buildBackendUrl(path);
  const backendHeaders = new Headers(init.headers ?? {});

  if (!backendHeaders.has("accept")) {
    backendHeaders.set("accept", "application/json");
  }

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    backendHeaders.set("cookie", cookieHeader);
  }

  const method = (init.method ?? req.method ?? "GET").toUpperCase();

  const enforceCsrf = options.csrf ?? MUTATING_METHODS.has(method);

  if (enforceCsrf) {
    const csrfToken = getCookieValue(cookieHeader, CSRF_COOKIE_NAME);

    if (!csrfToken) {
      return NextResponse.json(
        { detail: "CSRF token missing. Please refresh the page and try again." },
        { status: 403 }
      );
    }
    backendHeaders.set("X-CSRF-Token", csrfToken);
  }

  const backendResponse = await fetch(url, {
    ...init,
    method,
    headers: backendHeaders,
    cache: "no-store",
    redirect: "manual",
  });

  // If backend cleared cookies (e.g. logout), propagate even on non-OK responses
  const headers = buildResponseHeaders(backendResponse.headers);
  const body = await backendResponse.arrayBuffer();

  // For 204 emit empty body
  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: backendResponse.status, headers });
  }

  return new NextResponse(body, { status: backendResponse.status, headers });
}

/**
 * Fetch backend directly from server components, bypassing Next.js API routes.
 * This avoids double network hops and reuses the same backend URL/path normalization logic.
 *
 * Note: CSRF tokens are NOT enforced here since server components don't have browser cookies.
 * Only use this for GET requests or when the request already has proper authentication.
 */
export async function fetchBackendDirect(
  path: string,
  init?: RequestInit & { cookieHeader?: string }
): Promise<Response> {
  const url = buildBackendUrl(path);
  const backendHeaders = new Headers(init?.headers ?? {});

  if (!backendHeaders.has("accept")) {
    backendHeaders.set("accept", "application/json");
  }

  if (init?.cookieHeader) {
    backendHeaders.set("cookie", init.cookieHeader);
  }

  return fetch(url, {
    ...init,
    headers: backendHeaders,
    cache: "no-store",
  });
}
