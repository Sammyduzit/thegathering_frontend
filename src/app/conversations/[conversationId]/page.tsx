import ConversationDetailClient from "./ConversationDetailClient";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraLinkButton } from "@/components/ui/AuroraButton";
import type { ConversationDetail, PaginatedMessagesResponse } from "@/types/conversation";
import { buildRequestContext, fetchBackend } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationDetailPage({ params }: PageProps) {
  // Next.js requires awaiting params in async server components for dynamic routes
  const { conversationId } = await params;
  const context = await buildRequestContext({ fetchUser: true });
  const initialPageSize = 50;

  if (!context.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversation</h1>
        <p className="mt-4 text-muted leading-relaxed">
          Please sign in to open this circle again. Your words remain sheltered until you return.
        </p>
        <AuroraLinkButton href="/login" className="mt-6 mx-auto uppercase tracking-[0.3em] text-xs">
          Sign In
        </AuroraLinkButton>
      </GlassPanel>
    );
  }

  const { user } = context;
  const username = user?.username ?? "";

  const conversationResponse = await fetchBackend(`/conversations/${conversationId}`);

  if (conversationResponse.status === 404) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversation</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">Conversation not found.</p>
      </GlassPanel>
    );
  }

  if (conversationResponse.status === 403) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversation</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">
          You do not have access to this conversation.
        </p>
      </GlassPanel>
    );
  }

  if (!conversationResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversation</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">Failed to load conversation data.</p>
      </GlassPanel>
    );
  }

  const conversation: ConversationDetail = await conversationResponse.json();

  const messagesResponse = await fetchBackend(
    `/conversations/${conversationId}/messages?page=1&page_size=${initialPageSize}`
  );

  if (!messagesResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Conversation</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">
          Failed to load conversation messages (status {messagesResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const initialMessages: PaginatedMessagesResponse = await messagesResponse.json();
  const resolvedPageSize = initialMessages.page_size || initialPageSize;
  const totalPages =
    initialMessages.total_pages ||
    (initialMessages.total && resolvedPageSize
      ? Math.max(1, Math.ceil(initialMessages.total / resolvedPageSize))
      : 1);

  return (
    <ConversationDetailClient
      conversation={conversation}
      currentUser={username}
      initialMessages={initialMessages.messages}
      initialPagination={{
        page: initialMessages.page || 1,
        pageSize: resolvedPageSize,
        hasMore: Boolean(initialMessages.has_more),
        total: initialMessages.total,
        totalPages,
      }}
    />
  );
}
