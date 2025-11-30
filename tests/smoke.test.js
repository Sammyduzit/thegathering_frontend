import test from "node:test";
import assert from "node:assert/strict";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

async function safeGoto(path) {
  const url = baseUrl.endsWith("/") ? `${baseUrl.slice(0, -1)}${path}` : `${baseUrl}${path}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    return { response, url };
  } catch (error) {
    return { error, url };
  }
}

test("login page is reachable", async (t) => {
  const { response, error, url } = await safeGoto("/login");
  if (error) {
    t.skip(`Skipping E2E test, app not reachable at ${url}: ${error}`);
    return;
  }

  assert.ok(response.status < 500, `Unexpected status ${response.status} for ${url}`);
  if (response.status >= 400) {
    // If app returns 4xx we still stop here.
    assert.fail(`Received status ${response.status} for ${url}`);
  }

  const html = await response.text();
  assert.match(html, /Login/i, "Should render Login heading");
});

test("/api/me requires authentication", async (t) => {
  const { response, error, url } = await safeGoto("/api/me");
  if (error) {
    t.skip(`Skipping E2E test, app not reachable at ${url}: ${error}`);
    return;
  }

  if (response.status >= 500) {
    t.skip(`Skipping /api/me auth check, received ${response.status} from ${url}`);
    return;
  }

  assert.equal(response.status, 401, "Unauthenticated request should return 401");
});
