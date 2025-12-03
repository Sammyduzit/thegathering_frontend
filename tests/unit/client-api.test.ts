import test from "node:test";
import assert from "node:assert/strict";

import { apiFetch, getCsrfToken } from "../../src/lib/client-api";

type FetchCall = { input: Parameters<typeof fetch>[0]; init: RequestInit };

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_DOCUMENT = globalThis.document;

function jsonResponse(body: unknown, init: ResponseInit & { headers?: HeadersInit } = {}): Response {
  const headers = new Headers(init.headers ?? undefined);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

test.after(() => {
  if (ORIGINAL_FETCH) {
    globalThis.fetch = ORIGINAL_FETCH;
  } else {
    delete (globalThis as Record<string, unknown>).fetch;
  }
  if (ORIGINAL_DOCUMENT === undefined) {
    delete (globalThis as Record<string, unknown>).document;
  } else {
    globalThis.document = ORIGINAL_DOCUMENT;
  }
});

test("getCsrfToken returns correct value from document cookie", () => {
  globalThis.document = { cookie: "foo=bar; tg_csrf=token123; another=value" } as unknown as Document;
  assert.equal(getCsrfToken(), "token123");
});

test("apiFetch performs GET requests without CSRF header and includes Accept header", async () => {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init: RequestInit = {}) => {
    calls.push({ input, init });
    return jsonResponse({ ok: true }, { status: 200 });
  }) as typeof fetch;

  const { data } = await apiFetch("/api/example");

  assert.deepEqual(data, { ok: true });
  assert.equal(calls.length, 1);

  const [{ init }] = calls;
  assert.equal(init.credentials, "include", "apiFetch should always include credentials");

  const headers = new Headers(init.headers);
  assert.equal(headers.get("accept"), "application/json");
  assert.equal(headers.get("x-csrf-token"), null);
});

test("apiFetch attaches CSRF token for mutating requests", async () => {
  globalThis.document = { cookie: "tg_csrf=secureToken" } as unknown as Document;

  let lastHeaders: Headers | null = null;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init: RequestInit = {}) => {
    lastHeaders = new Headers(init.headers);
    return jsonResponse({ created: true }, { status: 201 });
  }) as typeof fetch;

  const { data } = await apiFetch("/api/rooms/1/messages", {
    method: "POST",
    body: { content: "hello" },
  });

  assert.deepEqual(data, { created: true });
  assert.ok(lastHeaders, "lastHeaders should be set");
  const headers = lastHeaders as Headers;
  assert.equal(headers.get("x-csrf-token"), "secureToken");
  assert.equal(headers.get("content-type"), "application/json");
});

test("apiFetch rejects when CSRF token is missing for mutating requests", async () => {
  globalThis.document = { cookie: "" } as unknown as Document;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return jsonResponse({}, { status: 200 });
  }) as typeof fetch;

  await assert.rejects(
    apiFetch("/api/rooms/1/messages", { method: "POST", body: { content: "oops" } }),
    /CSRF token missing/i
  );

  assert.equal(called, false, "fetch should not be called without CSRF token");
});

test("apiFetch retries after successful token refresh on 401 response", async () => {
  globalThis.document = { cookie: "tg_csrf=rotateToken" } as unknown as Document;

  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init: RequestInit = {}) => {
    calls.push({ input, init });
    const index = calls.length - 1;
    if (index === 0) {
      return jsonResponse({ detail: "expired" }, { status: 401 });
    }
    if (index === 1) {
      return new Response(null, { status: 200 });
    }
    if (index === 2) {
      return jsonResponse({ ok: true }, { status: 200 });
    }
    throw new Error("Unexpected fetch invocation");
  }) as typeof fetch;

  const { data } = await apiFetch("/api/rooms/1/messages", {
    method: "POST",
    body: { content: "retry-me" },
  });

  assert.deepEqual(data, { ok: true });
  assert.equal(calls.length, 3);

  const firstHeaders = new Headers(calls[0].init.headers ?? undefined);
  assert.equal(firstHeaders.get("x-csrf-token"), "rotateToken");

  assert.equal(calls[1].input, "/api/auth/refresh");
  assert.equal(calls[1].init.method, "POST");

  const thirdHeaders = new Headers(calls[2].init.headers ?? undefined);
  assert.equal(thirdHeaders.get("x-csrf-token"), "rotateToken");
});
