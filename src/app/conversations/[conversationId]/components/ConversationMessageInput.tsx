import { AuroraButton } from "@/components/ui/AuroraButton";
import { AuroraTextarea } from "@/components/ui/AuroraInput";

type ConversationMessageInputProps = {
  canPost: boolean;
  messageContent: string;
  messageError: string | null;
  messageSubmitting: boolean;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onClearError: () => void;
};

export function ConversationMessageInput({
  canPost,
  messageContent,
  messageError,
  messageSubmitting,
  onMessageChange,
  onSendMessage,
  onClearError,
}: ConversationMessageInputProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-[0.08em] text-white">Send a message</h3>
      {canPost ? (
        <div className="mt-4 space-y-2">
          <AuroraTextarea
            rows={5}
            placeholder="Write your message (max. 500 characters)..."
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
            <span>{messageContent.trim().length} / 500</span>
            <AuroraButton
              onClick={onSendMessage}
              className="text-xs uppercase tracking-[0.28em]"
              disabled={messageSubmitting}
            >
              {messageSubmitting ? "Sending..." : "Send"}
            </AuroraButton>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          You do not have permission to send messages in this conversation.
        </p>
      )}
    </div>
  );
}
