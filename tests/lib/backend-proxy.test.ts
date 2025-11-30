import { beforeEach, afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";

import { proxyBackendRequest } from "../../src/lib/backend-proxy";

let originalBackendUrl: string | undefined;

beforeEach(() => {
  originalBackendUrl = process.env.BACKEND_URL;
  process.env.BACKEND_URL = "http://backend.internal";
});

afterEach(() => {
  mock.restoreAll();
  if (originalBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = originalBackendUrl;
  }
  delete (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch;
});

test("proxyBackendRequest forwards GET requests with cookies", async () => {
  const fetchSpy = mock.fn(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    assert.equal(input, "http://backend.internal/api/v1/rooms");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("accept"), "application/json");
    assert.equal(headers.get("cookie"), "foo=bar");
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  globalThis.fetch = fetchSpy as unknown as typeof fetch;

  const request = new Request("http://localhost/api/rooms", {
    method: "GET",
    headers: { cookie: "foo=bar" },
  });

  const response = await proxyBackendRequest(request, "/rooms", { method: "GET" }, { csrf: false });

  assert.equal(fetchSpy.mock.calls.length, 1);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload, { ok: true });
});

test("proxyBackendRequest blocks mutating requests lacking CSRF", async () => {
  const fetchSpy = mock.fn(async () => new Response(null, { status: 500 }));
  globalThis.fetch = fetchSpy as unknown as typeof fetch;

  const request = new Request("http://localhost/api/rooms", { method: "POST" });
  const response = await proxyBackendRequest(request, "/rooms", { method: "POST" });

  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(String(body.detail).includes("CSRF token missing"), true);
  assert.equal(fetchSpy.mock.calls.length, 0);
});

test("proxyBackendRequest attaches CSRF token for mutating requests", async () => {
  const fetchSpy = mock.fn(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    assert.equal(input, "http://backend.internal/api/v1/rooms/1");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("x-csrf-token"), "secure-token");
    assert.equal(headers.get("accept"), "application/json");
    return new Response(null, { status: 204 });
  });

  globalThis.fetch = fetchSpy as unknown as typeof fetch;

  const request = new Request("http://localhost/api/rooms/1", {
    method: "PATCH",
    headers: { cookie: "tg_csrf=secure-token; other=value" },
  });

  const response = await proxyBackendRequest(
    request,
    "/rooms/1",
    { method: "PATCH", body: JSON.stringify({ name: "Updated" }) }
  );

  assert.equal(fetchSpy.mock.calls.length, 1);
  assert.equal(response.status, 204);
});
