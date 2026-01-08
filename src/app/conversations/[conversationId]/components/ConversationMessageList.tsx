import Image from "next/image";
import { formatDateTime } from "@/lib/format-date";
import { AuroraButton } from "@/components/ui/AuroraButton";
import type { ConversationMessage, ConversationParticipant } from "@/types/conversation";

type ConversationMessageListProps = {
  messages: ConversationMessage[];
  participants: ConversationParticipant[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
    total: number;
    totalPages: number;
  };
  isPolling: boolean;
  isLoadingMore: boolean;
  onLoadOlder: () => void;
};

export function ConversationMessageList({
  messages,
  participants,
  pagination,
  isPolling,
  isLoadingMore,
  onLoadOlder,
}: ConversationMessageListProps) {
  const getParticipantAvatar = (username: string | null) => {
    if (!username) return null;
    const participant = participants.find(p => p.username === username);
    return participant?.avatar_url || null;
  };

  // DiceBear returns SVGs by default; swap to PNG to avoid Next/Image SVG restrictions.
  const normalizeAvatarUrl = (url: string | null) => {
    if (!url) return null;
    if (url.includes("api.dicebear.com") && url.includes("/svg")) {
      return url.replace("/svg", "/png");
    }
    return url;
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Messages</h2>
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-text-subtle">
            Auto-refresh every 3 seconds {isPolling ? "(refreshing...)" : ""}
          </p>
        </div>
        <span className="text-xs text-text-subtle">
          Showing {messages.length} of {pagination.total ?? messages.length} messages
          {pagination.totalPages > 1 && ` · Page ${pagination.page} of ${pagination.totalPages}`}
        </span>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet.</p>
        ) : (
          [...messages].reverse().map((message) => {
            const avatarUrl = normalizeAvatarUrl(getParticipantAvatar(message.sender_username));
            return (
              <article
                key={message.id}
                className="rounded-2xl border border-border-panel bg-surface-deep px-4 py-3"
              >
                <header className="flex items-center gap-3">
                  {avatarUrl && (
                    <Image
                      src={avatarUrl}
                      alt={message.sender_username || "User"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-2 text-xs text-text-subtle">
                    <span className="font-semibold text-white">
                      {message.sender_username ?? "Unknown sender"}
                    </span>
                    <time className="text-text-faint" dateTime={message.sent_at}>
                      {formatDateTime(message.sent_at)}
                    </time>
                  </div>
                </header>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted ml-11">{message.content}</p>
              </article>
            );
          })
        )}
      </div>

      {pagination.hasMore && (
        <div className="flex justify-center">
          <AuroraButton
            onClick={onLoadOlder}
            variant="ghost"
            className="text-[0.65rem]"
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load older messages"}
          </AuroraButton>
        </div>
      )}
    </>
  );
}
