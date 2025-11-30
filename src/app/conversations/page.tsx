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

export default async function ConversationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const message = params.message;
  const ctx = await buildRequestContext({ fetchUser: true });

  if (!ctx.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversations</h1>
        <p className="mt-4 text-muted leading-relaxed">
          Please sign in to revisit the circles you&apos;ve sparked. Your dialogues wait where you left them.
        </p>
        <AuroraLinkButton href="/login" className="mt-6 mx-auto uppercase tracking-[0.3em] text-xs">
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
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversations</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">Session expired. Please sign in again.</p>
      </GlassPanel>
    );
  }

  if (!conversationsResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversations</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">
          Failed to load conversations (status {conversationsResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const conversations: ConversationListItem[] = await conversationsResponse.json();

  return (
    <section className="max-w-6xl mx-auto">
      {message && <ConversationAlert message={message} />}

      <GlassPanel className="px-7 py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversations</h1>
          <p className="mt-3 text-muted leading-relaxed">Overview of your active circles and private exchanges.</p>
        </div>
        {currentRoomId ? (
          <AuroraLinkButton
            href={`/rooms/${currentRoomId}?create=group`}
            variant="ghost"
            className="text-[0.65rem]"
          >
            Create conversation
          </AuroraLinkButton>
        ) : (
          <span className="text-xs uppercase tracking-[0.32em] text-muted">
            Join a room to create conversations
          </span>
        )}
      </GlassPanel>

      <GlassPanel className="mt-8 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-muted">
            <thead className="bg-panel-hover text-[0.65rem] uppercase tracking-[0.28em] text-text-soft">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Conversation</th>
                <th className="px-5 py-4 text-left font-semibold">Participants</th>
                <th className="px-5 py-4 text-left font-semibold">Latest activity</th>
                <th className="px-5 py-4 text-left font-semibold">Created</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv) => (
                <tr
                  key={conv.id}
                  className="border-t border-border-panel hover:bg-surface-deep transition-colors"
                >
                  <td className="px-5 py-4 align-top">
                    <div className="font-medium text-white">
                      {conv.room_name ? conv.room_name : `Conversation #${conv.id}`}
                    </div>
                    <div className="mt-1 text-[0.7rem] uppercase tracking-[0.28em] text-text-soft">
                      {conv.type}
                      {conv.room_id !== null && <span className="ml-2">· Room #{conv.room_id}</span>}
                      <span className="ml-2">· {conv.participant_count} souls</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-muted">
                    {conv.participants.length > 0 ? conv.participants.join(", ") : "—"}
                  </td>
                  <td className="px-5 py-4 align-top text-xs text-muted">
                    {conv.latest_message_preview && (
                      <span className="block text-text-aurora italic">
                        &ldquo;{conv.latest_message_preview}&rdquo;
                      </span>
                    )}
                    <span className="block mt-1 text-text-subtle">
                      {conv.latest_message_at
                        ? formatDateTime(conv.latest_message_at)
                        : "No messages yet."}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-xs text-muted">
                    {formatDateTime(conv.created_at)}
                  </td>
                  <td className="px-5 py-4 align-top text-right">
                    <Link
                      href={`/conversations/${conv.id}`}
                      className="link-aurora text-[0.65rem] uppercase tracking-[0.32em]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {conversations.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-text-soft uppercase tracking-[0.28em]"
                  >
                    No conversations available.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
        </div>
      </GlassPanel>
    </section>
  );
}
