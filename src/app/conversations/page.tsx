import Link from "next/link";
import { formatDateTime } from "@/lib/format-date";
import GlassPanel from "../../components/ui/GlassPanel";
import { AuroraLinkButton } from "../../components/ui/AuroraButton";
import { buildRequestContext, fetchBackend } from "@/lib/server/request-context";
import ConversationAlert from "./ConversationAlert";

type ConversationListItem = {
  id: number;
  type: string;
  room_id: number | null;
  room_name: string | null;
  participants: string[];
  participant_count: number;
  created_at: string;
  latest_message_at: string | null;
  latest_message_preview: string | null;
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ message?: string }>;
};

function ConversationCard({ conv }: { conv: ConversationListItem }) {
  const hasMessages = !!conv.latest_message_at;
  const title = conv.room_name ?? `Conversation #${conv.id}`;
  const timestamp = conv.latest_message_at ?? conv.created_at;
  const participantDisplay =
    conv.participants.length > 0
      ? conv.participants.slice(0, 4).join(", ") +
        (conv.participants.length > 4
          ? ` +${conv.participants.length - 4}`
          : "")
      : null;

  return (
    <Link href={`/conversations/${conv.id}`} className="block group">
      <GlassPanel className="px-5 py-4 md:px-6 md:py-5 rounded-2xl hover:border-border-panel-strong transition-all duration-200 hover:-translate-y-px">
        <div className="flex items-start gap-4">
          {/* Status dot */}
          <div className="mt-[0.4rem] flex-shrink-0">
            {hasMessages ? (
              <span className="block w-2 h-2 rounded-full bg-ai shadow-[0_0_6px_var(--color-accent-ai)]" />
            ) : (
              <span className="block w-2 h-2 rounded-full bg-border-mist-strong" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Row 1: title + type + timestamp */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold tracking-[0.04em] text-white group-hover:text-ai transition-colors text-sm truncate">
                  {title}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-border-mist bg-surface-soft text-[0.6rem] uppercase tracking-[0.2em] text-text-soft flex-shrink-0">
                  {conv.type}
                </span>
                {conv.room_id !== null && (
                  <span className="hidden sm:inline text-[0.6rem] uppercase tracking-[0.2em] text-text-faint">
                    Room #{conv.room_id}
                  </span>
                )}
              </div>
              <span className="text-[0.62rem] text-text-faint uppercase tracking-[0.2em] whitespace-nowrap flex-shrink-0 mt-0.5">
                {formatDateTime(timestamp)}
              </span>
            </div>

            {/* Row 2: participants */}
            {participantDisplay && (
              <div className="mt-1 text-xs text-text-subtle truncate">
                {participantDisplay}
                <span className="ml-2 text-text-faint">
                  · {conv.participant_count} souls
                </span>
              </div>
            )}

            {/* Row 3: message preview */}
            {conv.latest_message_preview ? (
              <p className="mt-2 text-sm text-text-aurora opacity-80 italic truncate">
                &ldquo;{conv.latest_message_preview}&rdquo;
              </p>
            ) : (
              <p className="mt-2 text-xs text-text-faint uppercase tracking-[0.2em]">
                No messages yet
              </p>
            )}
          </div>
        </div>
      </GlassPanel>
    </Link>
  );
}

export default async function ConversationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const message = params.message;
  const ctx = await buildRequestContext({ fetchUser: true });

  if (!ctx.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">
          Conversations
        </h1>
        <p className="mt-4 text-text-muted leading-relaxed">
          Please sign in to revisit the circles you&apos;ve sparked. Your
          dialogues wait where you left them.
        </p>
        <AuroraLinkButton
          href="/login"
          className="mt-6 mx-auto uppercase tracking-[0.3em] text-xs"
        >
          Sign In
        </AuroraLinkButton>
      </GlassPanel>
    );
  }

  const { user } = ctx;
  const currentRoomId = user?.current_room_id ?? null;

  const conversationsResponse = await fetchBackend("/conversations/");

  if (conversationsResponse.status === 401) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">
          Conversations
        </h1>
        <p className="mt-6 text-[0.7rem] uppercase tracking-[0.28em] text-text-rose">
          Session expired — please sign in again.
        </p>
        <AuroraLinkButton href="/login" className="mt-6 mx-auto text-xs uppercase tracking-[0.3em]">
          Sign In
        </AuroraLinkButton>
      </GlassPanel>
    );
  }

  if (!conversationsResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">
          Conversations
        </h1>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-rose bg-rose-veil">
          <span className="w-1.5 h-1.5 rounded-full bg-text-rose" />
          <span className="text-[0.65rem] uppercase tracking-[0.24em] text-text-rose">
            Failed to load conversations
          </span>
        </div>
      </GlassPanel>
    );
  }

  const conversations: ConversationListItem[] = await conversationsResponse.json();

  return (
    <section className="max-w-4xl mx-auto">
      {message && <ConversationAlert message={message} />}

      {/* Header */}
      <GlassPanel className="px-7 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">
            Conversations
          </h1>
          <p className="mt-2 text-text-muted leading-relaxed text-sm">
            Your active circles and private exchanges.
          </p>
        </div>
        {currentRoomId ? (
          <AuroraLinkButton
            href={`/rooms/${currentRoomId}?create=group`}
            variant="ghost"
            className="text-[0.65rem] flex-shrink-0"
          >
            New conversation
          </AuroraLinkButton>
        ) : (
          <span className="text-xs uppercase tracking-[0.32em] text-text-faint">
            Join a room first
          </span>
        )}
      </GlassPanel>

      {/* Inbox list */}
      {conversations.length > 0 ? (
        <div className="mt-6 space-y-3">
          {conversations.map((conv) => (
            <ConversationCard key={conv.id} conv={conv} />
          ))}
        </div>
      ) : (
        <GlassPanel className="mt-6 py-16 text-center rounded-2xl">
          <div className="text-3xl text-text-faint mb-4">◎</div>
          <p className="text-sm uppercase tracking-[0.32em] text-text-subtle">
            No conversations yet
          </p>
          <p className="mt-2 text-xs text-text-faint">
            Join a room to start a conversation
          </p>
        </GlassPanel>
      )}
    </section>
  );
}
