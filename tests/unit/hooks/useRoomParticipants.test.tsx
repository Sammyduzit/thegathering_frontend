/**
 * useRoomParticipants Hook Tests
 * Tests for room participant management hook
 */

import test from "node:test";
import assert from "node:assert/strict";
import "../../setup/jsdom-setup";
import { renderHook } from "@testing-library/react";

import { useRoomParticipants } from "../../../src/app/rooms/[roomId]/hooks/useRoomParticipants";
import { createMockRoomParticipant, createMockRoomParticipantsResponse } from "../../setup/mock-data";

test("useRoomParticipants - handles null participants", () => {
  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: null,
      currentUsername: "testuser",
    })
  );

  assert.deepEqual(result.current.participantsData, []);
  assert.equal(result.current.totalParticipants, 0);
  assert.deepEqual(result.current.otherParticipants, []);
  assert.equal(result.current.currentParticipant, null);
});

test("useRoomParticipants - identifies current participant", () => {
  const mockParticipants = createMockRoomParticipantsResponse([
    createMockRoomParticipant({ username: "alice" }),
    createMockRoomParticipant({ username: "bob" }),
    createMockRoomParticipant({ username: "charlie" }),
  ]);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "bob",
    })
  );

  assert.equal(result.current.currentParticipant?.username, "bob");
  assert.equal(result.current.otherParticipants.length, 2);
});

test("useRoomParticipants - filters other participants correctly", () => {
  const mockParticipants = createMockRoomParticipantsResponse([
    createMockRoomParticipant({ username: "alice" }),
    createMockRoomParticipant({ username: "bob" }),
    createMockRoomParticipant({ username: "charlie" }),
  ]);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "alice",
    })
  );

  assert.equal(result.current.otherParticipants.length, 2);
  assert.ok(result.current.otherParticipants.every((p) => p.username !== "alice"));
});

test("useRoomParticipants - separates human and AI participants", () => {
  const mockParticipants = createMockRoomParticipantsResponse([
    createMockRoomParticipant({ username: "currentUser", is_ai: false }),
    createMockRoomParticipant({ username: "alice", is_ai: false }),
    createMockRoomParticipant({ username: "bot1", is_ai: true }),
    createMockRoomParticipant({ username: "bot2", is_ai: true }),
    createMockRoomParticipant({ username: "charlie", is_ai: false }),
  ]);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "currentUser",
    })
  );

  assert.equal(result.current.humanParticipants.length, 2);
  assert.equal(result.current.aiParticipants.length, 2);
  assert.ok(result.current.humanParticipants.every((p) => !p.isAi));
  assert.ok(result.current.aiParticipants.every((p) => p.isAi));
});

test("useRoomParticipants - creates selectable participants correctly", () => {
  const mockParticipants = createMockRoomParticipantsResponse([
    createMockRoomParticipant({ username: "currentUser" }),
    createMockRoomParticipant({
      username: "alice",
      status: "online",
    }),
    createMockRoomParticipant({
      username: "bot1",
      is_ai: true,
      status: "active",
    }),
  ]);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "currentUser",
    })
  );

  const { selectableParticipants } = result.current;

  assert.equal(selectableParticipants.length, 2);

  const alice = selectableParticipants.find((p) => p.username === "alice");
  assert.ok(alice);
  assert.equal(alice.label, "alice");
  assert.equal(alice.isAi, false);
  assert.equal(alice.status, "online");

  const bot = selectableParticipants.find((p) => p.username === "bot1");
  assert.ok(bot);
  assert.equal(bot.label, "bot1");
  assert.equal(bot.isAi, true);
  assert.equal(bot.status, "active");
});

test("useRoomParticipants - uses username as label", () => {
  const mockParticipants = createMockRoomParticipantsResponse([
    createMockRoomParticipant({ username: "currentUser" }),
    createMockRoomParticipant({ username: "alice" }),
  ]);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "currentUser",
    })
  );

  const alice = result.current.selectableParticipants.find((p) => p.username === "alice");
  assert.equal(alice?.label, "alice");
});

test("useRoomParticipants - creates AI usernames set", () => {
  const mockParticipants = createMockRoomParticipantsResponse([
    createMockRoomParticipant({ username: "alice", is_ai: false }),
    createMockRoomParticipant({ username: "bot1", is_ai: true }),
    createMockRoomParticipant({ username: "bob", is_ai: false }),
    createMockRoomParticipant({ username: "bot2", is_ai: true }),
  ]);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "alice",
    })
  );

  const { aiUsernames } = result.current;

  assert.equal(aiUsernames.size, 2);
  assert.ok(aiUsernames.has("bot1"));
  assert.ok(aiUsernames.has("bot2"));
  assert.ok(!aiUsernames.has("alice"));
  assert.ok(!aiUsernames.has("bob"));
});

test("useRoomParticipants - handles empty participants list", () => {
  const mockParticipants = createMockRoomParticipantsResponse([], { allowEmpty: true });

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "testuser",
    })
  );

  assert.equal(result.current.participantsData.length, 0);
  assert.equal(result.current.totalParticipants, 0);
  assert.equal(result.current.currentParticipant, null);
  assert.equal(result.current.humanParticipants.length, 0);
  assert.equal(result.current.aiParticipants.length, 0);
  assert.equal(result.current.aiUsernames.size, 0);
});

test("useRoomParticipants - handles participant without status", () => {
  const mockParticipants = createMockRoomParticipantsResponse([
    createMockRoomParticipant({ username: "currentUser" }),
    createMockRoomParticipant({ username: "alice", status: null }),
  ]);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "currentUser",
    })
  );

  const alice = result.current.selectableParticipants[0];
  assert.equal(alice.status, null);
});

test("useRoomParticipants - total participants matches array length", () => {
  const participants = [
    createMockRoomParticipant({ username: "alice" }),
    createMockRoomParticipant({ username: "bob" }),
    createMockRoomParticipant({ username: "charlie" }),
  ];

  const mockParticipants = createMockRoomParticipantsResponse(participants);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "alice",
    })
  );

  assert.equal(result.current.totalParticipants, 3);
  assert.equal(result.current.participantsData.length, 3);
});

test("useRoomParticipants - excludes current user from selectableParticipants", () => {
  const mockParticipants = createMockRoomParticipantsResponse([
    createMockRoomParticipant({ username: "currentUser" }),
    createMockRoomParticipant({ username: "alice" }),
    createMockRoomParticipant({ username: "bob" }),
  ]);

  const { result } = renderHook(() =>
    useRoomParticipants({
      participants: mockParticipants,
      currentUsername: "currentUser",
    })
  );

  const hasCurrentUser = result.current.selectableParticipants.some(
    (p) => p.username === "currentUser"
  );

  assert.equal(hasCurrentUser, false);
  assert.equal(result.current.selectableParticipants.length, 2);
});
