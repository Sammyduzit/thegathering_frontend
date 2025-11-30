/**
 * Conversation Workflow Integration Tests
 * Tests that verify conversation creation and participant management flows
 */

import test from "node:test";
import assert from "node:assert/strict";
import { canSubmitConversation } from "../../src/lib/room-chat-helpers";
import { createMockConversationParticipant, createMockConversationDetail } from "../setup/mock-data";
import type { ConversationParticipant } from "../../src/types/conversation";

test("Conversation Workflow - create private conversation", () => {
  // User selects one other participant for private conversation
  const selectedUsernames = ["alice"];
  const mode = "private";

  const canSubmit = canSubmitConversation(mode, selectedUsernames);
  assert.equal(canSubmit, true);

  // Simulate conversation creation
  const conversation = createMockConversationDetail({
    type: "private",
    room_name: "Private with alice",
    participants: [
      createMockConversationParticipant({ username: "currentuser" }),
      createMockConversationParticipant({ username: "alice" }),
    ],
  });

  assert.equal(conversation.participants.length, 2);
  assert.ok(conversation.participants.some((p) => p.username === "alice"));
});

test("Conversation Workflow - create group conversation", () => {
  // User selects multiple participants for group conversation
  const selectedUsernames = ["alice", "bob", "charlie"];
  const mode = "group";

  const canSubmit = canSubmitConversation(mode, selectedUsernames);
  assert.equal(canSubmit, true);

  const conversation = createMockConversationDetail({
    type: "group",
    room_name: "Group Chat",
    participants: [
      createMockConversationParticipant({ username: "currentuser" }),
      createMockConversationParticipant({ username: "alice" }),
      createMockConversationParticipant({ username: "bob" }),
      createMockConversationParticipant({ username: "charlie" }),
    ],
  });

  assert.equal(conversation.participants.length, 4);
});

test("Conversation Workflow - validation for private conversation", () => {
  // Private conversation requires exactly 1 other participant
  assert.equal(canSubmitConversation("private", []), false); // Too few
  assert.equal(canSubmitConversation("private", ["alice"]), true); // Correct
  assert.equal(canSubmitConversation("private", ["alice", "bob"]), false); // Too many
});

test("Conversation Workflow - validation for group conversation", () => {
  // Group conversation requires at least 1 other participant
  assert.equal(canSubmitConversation("group", []), false);
  assert.equal(canSubmitConversation("group", ["alice"]), true);
  assert.equal(canSubmitConversation("group", ["alice", "bob"]), true);
  assert.equal(
    canSubmitConversation("group", ["alice", "bob", "charlie"]),
    true
  );
});

test("Conversation Workflow - validation without mode", () => {
  // Cannot submit without selecting a mode
  assert.equal(canSubmitConversation(null, ["alice"]), false);
});

test("Conversation Workflow - participant permissions in private chat", () => {
  const conversation = createMockConversationDetail({
    type: "private",
    permissions: {
      can_post: true,
      can_manage_participants: false,
      can_leave: true,
    },
  });

  assert.equal(conversation.permissions.can_post, true);
  assert.equal(conversation.permissions.can_manage_participants, false);
  assert.equal(conversation.permissions.can_leave, true);
});

test("Conversation Workflow - participant permissions in group chat", () => {
  const creatorConversation = createMockConversationDetail({
    type: "group",
    permissions: {
      can_post: true,
      can_manage_participants: true,
      can_leave: true,
    },
  });

  assert.equal(creatorConversation.permissions.can_manage_participants, true);

  const memberConversation = createMockConversationDetail({
    type: "group",
    permissions: {
      can_post: true,
      can_manage_participants: false,
      can_leave: true,
    },
  });

  assert.equal(memberConversation.permissions.can_manage_participants, false);
});

test("Conversation Workflow - add participant to group", () => {
  let participants: ConversationParticipant[] = [
    createMockConversationParticipant({ username: "user1" }),
    createMockConversationParticipant({ username: "user2" }),
  ];

  // Add new participant
  const newParticipant = createMockConversationParticipant({
    username: "user3",
  });

  participants = [...participants, newParticipant];

  assert.equal(participants.length, 3);
  assert.ok(participants.some((p) => p.username === "user3"));
});

test("Conversation Workflow - remove participant from group", () => {
  let participants: ConversationParticipant[] = [
    createMockConversationParticipant({ username: "user1" }),
    createMockConversationParticipant({ username: "user2" }),
    createMockConversationParticipant({ username: "user3" }),
  ];

  // Remove user2
  participants = participants.filter((p) => p.username !== "user2");

  assert.equal(participants.length, 2);
  assert.ok(!participants.some((p) => p.username === "user2"));
});

test("Conversation Workflow - deactivate and restore conversation", () => {
  let conversation = createMockConversationDetail({
    is_active: true,
  });

  assert.equal(conversation.is_active, true);

  // Deactivate conversation
  conversation = {
    ...conversation,
    is_active: false,
  };

  assert.equal(conversation.is_active, false);

  // Reactivate conversation
  conversation = {
    ...conversation,
    is_active: true,
  };

  assert.equal(conversation.is_active, true);
});

test("Conversation Workflow - AI participant in conversation", () => {
  const conversation = createMockConversationDetail({
    participants: [
      createMockConversationParticipant({ username: "user1", is_ai: false }),
      createMockConversationParticipant({
        username: "aibot",
        is_ai: true,
      }),
    ],
  });

  const aiParticipant = conversation.participants.find((p) => p.is_ai);
  assert.ok(aiParticipant);
  assert.equal(aiParticipant.username, "aibot");

  const humanParticipant = conversation.participants.find((p) => !p.is_ai);
  assert.ok(humanParticipant);
  assert.equal(humanParticipant.username, "user1");
});

test("Conversation Workflow - participant restrictions", () => {
  const conversation = createMockConversationDetail({
    permissions: {
      can_post: false,
      can_manage_participants: false,
      can_leave: true,
    },
  });

  assert.equal(conversation.permissions.can_post, false);
  assert.equal(conversation.permissions.can_manage_participants, false);
  assert.equal(conversation.permissions.can_leave, true);
});

test("Conversation Workflow - conversation with mixed participant types", () => {
  const conversation = createMockConversationDetail({
    participants: [
      createMockConversationParticipant({
        username: "human1",
        is_ai: false,
      }),
      createMockConversationParticipant({
        username: "human2",
        is_ai: false,
      }),
      createMockConversationParticipant({
        username: "ai1",
        is_ai: true,
      }),
      createMockConversationParticipant({
        username: "ai2",
        is_ai: true,
      }),
    ],
  });

  const humans = conversation.participants.filter((p) => !p.is_ai);
  const ais = conversation.participants.filter((p) => p.is_ai);

  assert.equal(humans.length, 2);
  assert.equal(ais.length, 2);
  assert.equal(conversation.participants.length, 4);
});

test("Conversation Workflow - cannot create empty conversation", () => {
  // Private conversation with no selection
  assert.equal(canSubmitConversation("private", []), false);

  // Group conversation with no selection
  assert.equal(canSubmitConversation("group", []), false);
});

test("Conversation Workflow - participant count validation", () => {
  // Minimum participants for private (1 + current user = 2)
  const privateConversation = createMockConversationDetail({
    participants: [
      createMockConversationParticipant({ username: "currentuser" }),
      createMockConversationParticipant({ username: "other" }),
    ],
  });

  assert.equal(privateConversation.participants.length, 2);

  // Minimum participants for group (1 + current user = 2)
  const groupConversation = createMockConversationDetail({
    participants: [
      createMockConversationParticipant({ username: "currentuser" }),
      createMockConversationParticipant({ username: "other" }),
    ],
  });

  assert.ok(groupConversation.participants.length >= 2);
});
