import test from "node:test";
import assert from "node:assert/strict";
import { getErrorMessage, ApiError, UnauthorizedError } from "../../src/lib/client-api";

test("getErrorMessage - handles ApiError with detail string", () => {
  const error = new ApiError(400, { detail: "Invalid input" });
  const message = getErrorMessage(error);

  assert.equal(message, "Invalid input");
});

test("getErrorMessage - handles ApiError with detail array (validation errors)", () => {
  const error = new ApiError(422, {
    detail: [{ msg: "Field is required", type: "value_error" }],
  });
  const message = getErrorMessage(error);

  assert.equal(message, "Field is required");
});

test("getErrorMessage - handles ApiError with error property", () => {
  const error = new ApiError(500, { error: "Server error occurred" });
  const message = getErrorMessage(error);

  assert.equal(message, "Server error occurred");
});

test("getErrorMessage - handles ApiError without detail or error", () => {
  const error = new ApiError(404, { some: "data" });
  const message = getErrorMessage(error);

  assert.equal(message, "Request failed with status 404");
});

test("getErrorMessage - handles ApiError with null data", () => {
  const error = new ApiError(500, null);
  const message = getErrorMessage(error);

  assert.equal(message, "Request failed with status 500");
});

test("getErrorMessage - handles UnauthorizedError", () => {
  const error = new UnauthorizedError({ detail: "Please log in" });
  const message = getErrorMessage(error);

  assert.equal(message, "Please log in");
});

test("getErrorMessage - handles standard Error", () => {
  const error = new Error("Network failure");
  const message = getErrorMessage(error);

  assert.equal(message, "Network failure");
});

test("getErrorMessage - handles TypeError", () => {
  const error = new TypeError("Cannot read property");
  const message = getErrorMessage(error);

  assert.equal(message, "Cannot read property");
});

test("getErrorMessage - handles unknown error types", () => {
  const message = getErrorMessage("string error");

  assert.equal(message, "Unknown error");
});

test("getErrorMessage - handles null error", () => {
  const message = getErrorMessage(null);

  assert.equal(message, "Unknown error");
});

test("getErrorMessage - handles undefined error", () => {
  const message = getErrorMessage(undefined);

  assert.equal(message, "Unknown error");
});

test("getErrorMessage - handles number error", () => {
  const message = getErrorMessage(42);

  assert.equal(message, "Unknown error");
});

test("getErrorMessage - handles object without error properties", () => {
  const message = getErrorMessage({ foo: "bar" });

  assert.equal(message, "Unknown error");
});

test("ApiError - stores status and data correctly", () => {
  const data = { detail: "Test error" };
  const error = new ApiError(400, data);

  assert.equal(error.status, 400);
  assert.deepEqual(error.data, data);
  assert.equal(error.name, "ApiError");
});

test("ApiError - uses custom message when provided", () => {
  const error = new ApiError(400, {}, "Custom message");

  assert.equal(error.message, "Custom message");
});

test("ApiError - uses default message when not provided", () => {
  const error = new ApiError(500, {});

  assert.equal(error.message, "Request failed with status 500");
});

test("UnauthorizedError - extends ApiError correctly", () => {
  const error = new UnauthorizedError({ detail: "Auth failed" });

  assert.ok(error instanceof ApiError);
  assert.ok(error instanceof UnauthorizedError);
  assert.equal(error.status, 401);
  assert.equal(error.name, "UnauthorizedError");
});

test("UnauthorizedError - uses default message", () => {
  const error = new UnauthorizedError({});

  assert.equal(error.message, "Authentication required");
});

test("UnauthorizedError - uses custom message when provided", () => {
  const error = new UnauthorizedError({}, "Please sign in");

  assert.equal(error.message, "Please sign in");
});

test("getErrorMessage - handles complex validation error structure", () => {
  const error = new ApiError(422, {
    detail: [
      { loc: ["body", "email"], msg: "Invalid email format", type: "value_error" },
      { loc: ["body", "password"], msg: "Too short", type: "value_error" },
    ],
  });
  const message = getErrorMessage(error);

  // Should extract first error message
  assert.equal(message, "Invalid email format");
});

test("getErrorMessage - prioritizes detail over error property", () => {
  const error = new ApiError(400, {
    detail: "Detail message",
    error: "Error message",
  });
  const message = getErrorMessage(error);

  assert.equal(message, "Detail message");
});
