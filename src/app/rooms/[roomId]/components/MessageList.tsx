import { formatDateTime } from "@/lib/format-date";
import type { RoomMessage } from "@/types/room";

type MessageListProps = {
  messages: RoomMessage[];
  currentUsername: string;
  aiUsernames: Set<string>;
  isInRoom: boolean;
};

export function MessageList({ messages, currentUsername, aiUsernames, isInRoom }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted">
        {isInRoom
          ? "No messages yet. Start the conversation below."
          : "Messages are hidden until you join this room."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {[...messages].reverse().map((message) => {
        const displayName = message.sender_username ?? "Unknown sender";
        const isCurrentUserMessage = message.sender_username === currentUsername;
        const isAiSender = message.sender_username !== null && aiUsernames.has(message.sender_username);

        return (
          <article
            key={message.id}
            className="rounded-2xl border border-border-panel bg-surface-deep px-4 py-3"
          >
            <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-subtle">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{displayName}</span>
                {isCurrentUserMessage && (
                  <span className="inline-flex items-center rounded-full border border-border-aurora bg-aurora-haze px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-text-aurora">
                    You
                  </span>
                )}
                {isAiSender && (
                  <span className="inline-flex items-center rounded-full border border-border-ai bg-ai-glow px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-ai">
                    AI
                  </span>
                )}
              </div>
              <time className="text-text-faint" dateTime={message.sent_at}>
                {formatDateTime(message.sent_at)}
              </time>
            </header>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{message.content}</p>
          </article>
        );
      })}
    </div>
  );
}
