import { AuroraButton } from "@/components/ui/AuroraButton";
import { AuroraTextarea } from "@/components/ui/AuroraInput";

type MessageInputProps = {
  isInRoom: boolean;
  isRoomActive: boolean;
  messageContent: string;
  messageError: string | null;
  messageSubmitting: boolean;
  messageMaxLength: number;
  onMessageChange: (content: string) => void;
  onSendMessage: () => void;
  onClearError: () => void;
};

export function MessageInput({
  isInRoom,
  isRoomActive,
  messageContent,
  messageError,
  messageSubmitting,
  messageMaxLength,
  onMessageChange,
  onSendMessage,
  onClearError,
}: MessageInputProps) {
  if (!isInRoom) {
    return <p className="mt-3 text-sm text-muted">Join the room to send messages.</p>;
  }

  if (!isRoomActive) {
    return <p className="mt-3 text-sm text-muted">This room is closed. Messages can no longer be sent.</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      <AuroraTextarea
        rows={5}
        placeholder={`Write your message (max. ${messageMaxLength} characters)...`}
        value={messageContent}
        onChange={(event) => {
          onMessageChange(event.target.value);
          if (messageError) {
            onClearError();
          }
        }}
        error={messageError || undefined}
      />
      <div className="flex items-center justify-between text-xs text-text-subtle">
        <span>
          {messageContent.trim().length} / {messageMaxLength}
        </span>
        <AuroraButton
          onClick={onSendMessage}
          className="text-xs uppercase tracking-[0.28em]"
          disabled={messageSubmitting}
        >
          {messageSubmitting ? "Sending..." : "Send"}
        </AuroraButton>
      </div>
    </div>
  );
}
