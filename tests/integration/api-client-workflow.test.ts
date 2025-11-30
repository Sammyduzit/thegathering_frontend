/**
 * API Client Workflow Integration Tests
 * Tests that verify end-to-end API client behavior with CSRF, auth, and error handling
 */

import test from "node:test";
import assert from "node:assert/strict";
import { apiFetch, ApiError, UnauthorizedError, getErrorMessage } from "../../src/lib/client-api";
import { GlobalStateCleanup, createFetchMock, mockDocumentCookie } from "../setup/test-utils";

test("API Workflow - successful GET request with auth", async () => {
  const cleanup = new GlobalStateCleanup();
  const { mock, calls } = createFetchMock();
  globalThis.fetch = mock;

  const { data } = await apiFetch("/api/test");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "include");

  const headers = new Headers(calls[0].init.headers);
  assert.equal(headers.get("accept"), "application/json");

  cleanup.restore();
});

test("API Workflow - successful POST request with CSRF", async () => {
  const cleanup = new GlobalStateCleanup();
  const { mock, calls } = createFetchMock();

  globalThis.fetch = mock;
  mockDocumentCookie("tg_csrf=test-token");

  await apiFetch("/api/create", {
    method: "POST",
    body: { name: "Test" },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "POST");

  const headers = new Headers(calls[0].init.headers);
  assert.equal(headers.get("x-csrf-token"), "test-token");
  assert.equal(headers.get("content-type"), "application/json");

  cleanup.restore();
});

test("API Workflow - 401 triggers refresh and retry", async () => {
  const cleanup = new GlobalStateCleanup();
  mockDocumentCookie("tg_csrf=token");

  let callCount = 0;
  globalThis.fetch = (async (input, init) => {
    callCount++;

    // First call to actual endpoint returns 401
    if (callCount === 1) {
      return new Response(JSON.stringify({ detail: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Second call is refresh endpoint
    if (callCount === 2 && String(input).includes("/refresh")) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Third call is retry of original endpoint
    if (callCount === 3) {
      return new Response(JSON.stringify({ data: "success" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("", { status: 500 });
  }) as typeof fetch;

  const result = await apiFetch("/api/protected");

  assert.equal(callCount, 3);
  assert.deepEqual(result.data, { data: "success" });

  cleanup.restore();
});

test("API Workflow - 401 with failed refresh throws UnauthorizedError", async () => {
  const cleanup = new GlobalStateCleanup();
  mockDocumentCookie("tg_csrf=token");

  let callCount = 0;
  globalThis.fetch = (async (input, init) => {
    callCount++;

    // First call returns 401
    if (callCount === 1) {
      return new Response(JSON.stringify({ detail: "Session expired" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Refresh also fails with 401
    if (callCount === 2 && String(input).includes("/refresh")) {
      return new Response(JSON.stringify({ detail: "Refresh failed" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("", { status: 500 });
  }) as typeof fetch;

  await assert.rejects(
    async () => {
      await apiFetch("/api/protected");
    },
    {
      name: "UnauthorizedError",
    }
  );

  cleanup.restore();
});

test("API Workflow - network error handling", async () => {
  const cleanup = new GlobalStateCleanup();

  globalThis.fetch = (async () => {
    throw new Error("Network failure");
  }) as typeof fetch;

  await assert.rejects(
    async () => {
      await apiFetch("/api/test");
    },
    {
      message: "Network failure",
    }
  );

  cleanup.restore();
});

test("API Workflow - error message extraction from API errors", async () => {
  const cleanup = new GlobalStateCleanup();

  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({ detail: "Validation failed: email is required" }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      }
    );
  }) as typeof fetch;

  try {
    await apiFetch("/api/validate");
    assert.fail("Should have thrown an error");
  } catch (error) {
    const message = getErrorMessage(error);
    assert.equal(message, "Validation failed: email is required");
  }

  cleanup.restore();
});

test("API Workflow - validation error array handling", async () => {
  const cleanup = new GlobalStateCleanup();

  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        detail: [
          { loc: ["body", "email"], msg: "Invalid email format" },
          { loc: ["body", "password"], msg: "Password too short" },
        ],
      }),
      {
        status: 422,
        headers: { "content-type": "application/json" },
      }
    );
  }) as typeof fetch;

  try {
    await apiFetch("/api/register");
    assert.fail("Should have thrown an error");
  } catch (error) {
    const message = getErrorMessage(error);
    // Should extract first validation error
    assert.equal(message, "Invalid email format");
  }

  cleanup.restore();
});

test("API Workflow - complete CRUD workflow", async () => {
  const cleanup = new GlobalStateCleanup();
  mockDocumentCookie("tg_csrf=token");

  const resources: Record<string, unknown>[] = [];
  let nextId = 1;

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    const method = init?.method || "GET";

    // CREATE
    if (method === "POST" && url.includes("/api/items")) {
      const body = JSON.parse(init?.body as string);
      const newResource = { id: nextId++, ...body };
      resources.push(newResource);

      return new Response(JSON.stringify(newResource), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }

    // READ
    if (method === "GET" && url.includes("/api/items")) {
      return new Response(JSON.stringify(resources), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // UPDATE
    if (method === "PUT" && url.match(/\/api\/items\/\d+/)) {
      const id = parseInt(url.split("/").pop() || "0");
      const body = JSON.parse(init?.body as string);
      const index = resources.findIndex((r: Record<string, unknown>) => r.id === id);

      if (index >= 0) {
        resources[index] = { ...resources[index], ...body };
        return new Response(JSON.stringify(resources[index]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // DELETE
    if (method === "DELETE" && url.match(/\/api\/items\/\d+/)) {
      const id = parseInt(url.split("/").pop() || "0");
      const index = resources.findIndex((r: Record<string, unknown>) => r.id === id);

      if (index >= 0) {
        resources.splice(index, 1);
        return new Response(null, { status: 204 });
      }
    }

    return new Response("Not found", { status: 404 });
  }) as typeof fetch;

  // CREATE
  const created = await apiFetch("/api/items", {
    method: "POST",
    body: { name: "Item 1" },
  });

  assert.ok((created.data as Record<string, unknown>).id);
  assert.equal((created.data as Record<string, unknown>).name, "Item 1");

  // READ
  const list = await apiFetch("/api/items");
  assert.equal((list.data as unknown[]).length, 1);

  // UPDATE
  const updated = await apiFetch(`/api/items/${(created.data as Record<string, unknown>).id}`, {
    method: "PUT",
    body: { name: "Updated Item 1" },
  });

  assert.equal((updated.data as Record<string, unknown>).name, "Updated Item 1");

  // DELETE
  await apiFetch(`/api/items/${(created.data as Record<string, unknown>).id}`, {
    method: "DELETE",
    expectJson: false,
  });

  const finalList = await apiFetch("/api/items");
  assert.equal((finalList.data as unknown[]).length, 0);

  cleanup.restore();
});

test("API Workflow - FormData handling", async () => {
  const cleanup = new GlobalStateCleanup();
  mockDocumentCookie("tg_csrf=token");

  const { mock, calls } = createFetchMock();
  globalThis.fetch = mock;

  const formData = new FormData();
  formData.append("file", "test.txt");

  await apiFetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  assert.equal(calls.length, 1);

  const headers = new Headers(calls[0].init.headers);
  // FormData should not set Content-Type (browser sets it with boundary)
  assert.equal(headers.get("content-type"), null);

  cleanup.restore();
});

test("API Workflow - URLSearchParams handling", async () => {
  const cleanup = new GlobalStateCleanup();
  mockDocumentCookie("tg_csrf=token");

  const { mock, calls } = createFetchMock();
  globalThis.fetch = mock;

  const params = new URLSearchParams();
  params.append("key", "value");

  await apiFetch("/api/search", {
    method: "POST",
    body: params,
  });

  assert.equal(calls.length, 1);
  assert.ok(calls[0].init.body instanceof URLSearchParams);

  cleanup.restore();
});

test("API Workflow - 204 No Content response", async () => {
  const cleanup = new GlobalStateCleanup();
  mockDocumentCookie("tg_csrf=token");

  globalThis.fetch = (async () => {
    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const result = await apiFetch("/api/delete", {
    method: "DELETE",
  });

  assert.equal(result.data, undefined);

  cleanup.restore();
});
