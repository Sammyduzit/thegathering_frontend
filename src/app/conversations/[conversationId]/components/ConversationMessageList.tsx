import { formatDateTime } from "@/lib/format-date";
import { AuroraButton } from "@/components/ui/AuroraButton";
import type { ConversationMessage } from "@/types/conversation";

type ConversationMessageListProps = {
  messages: ConversationMessage[];
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
  pagination,
  isPolling,
  isLoadingMore,
  onLoadOlder,
}: ConversationMessageListProps) {
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
          [...messages].reverse().map((message) => (
            <article
              key={message.id}
              className="rounded-2xl border border-border-panel bg-surface-deep px-4 py-3"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-subtle">
                <span className="font-semibold text-white">
                  {message.sender_username ?? "Unknown sender"}
                </span>
                <time className="text-text-faint" dateTime={message.sent_at}>
                  {formatDateTime(message.sent_at)}
                </time>
              </header>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{message.content}</p>
            </article>
          ))
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
