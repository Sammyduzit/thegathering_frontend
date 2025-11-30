import test from "node:test";
import assert from "node:assert/strict";
import { formatDateTime } from "../../src/lib/format-date";

test("formatDateTime - formats ISO date string correctly", () => {
  const result = formatDateTime("2024-01-15T14:30:45Z");
  // Should format in German timezone (Europe/Berlin)
  assert.match(result, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.ok(result.startsWith("2024-01-15"));
});

test("formatDateTime - handles winter time correctly", () => {
  const result = formatDateTime("2024-01-01T12:00:00Z");
  // Winter time in Berlin is UTC+1
  assert.match(result, /^2024-01-01 13:00:00$/);
});

test("formatDateTime - handles summer time correctly", () => {
  const result = formatDateTime("2024-07-01T12:00:00Z");
  // Summer time in Berlin is UTC+2
  assert.match(result, /^2024-07-01 14:00:00$/);
});

test("formatDateTime - pads single digits with zeros", () => {
  const result = formatDateTime("2024-01-05T08:05:03Z");
  // Should have leading zeros for single digit numbers
  assert.ok(result.includes("01"));
  assert.ok(result.includes("05"));
});

test("formatDateTime - handles midnight correctly", () => {
  const result = formatDateTime("2024-01-01T00:00:00+01:00");
  assert.ok(result.includes("00:00:00"));
});

test("formatDateTime - handles end of day correctly", () => {
  const result = formatDateTime("2024-01-01T23:59:59+01:00");
  assert.ok(result.includes("23:59:59"));
});

test("formatDateTime - throws on invalid date", () => {
  // Invalid dates throw RangeError in Intl.DateTimeFormat
  assert.throws(
    () => formatDateTime("invalid-date"),
    {
      name: "RangeError",
    }
  );
});

test("formatDateTime - consistent format for hydration", () => {
  const dateString = "2024-06-15T10:30:00Z";
  const result1 = formatDateTime(dateString);
  const result2 = formatDateTime(dateString);

  // Same input should always produce same output (SSR/CSR consistency)
  assert.equal(result1, result2);
});

test("formatDateTime - returns YYYY-MM-DD HH:MM:SS format", () => {
  const result = formatDateTime("2024-12-25T20:15:30Z");
  const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

  assert.match(result, pattern, "Should match YYYY-MM-DD HH:MM:SS format");
});

test("formatDateTime - handles dates across year boundaries", () => {
  const result = formatDateTime("2023-12-31T23:30:00Z");
  assert.ok(result.startsWith("2024-01-01") || result.startsWith("2023-12-31"));
  // Depending on timezone, could be next day
});
