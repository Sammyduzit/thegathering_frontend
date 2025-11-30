import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ conversationId: string; username: string }>;
};

export async function DELETE(req: Request, context: Context) {
  const { conversationId, username } = await context.params;
  const encodedUsername = encodeURIComponent(username);
  return proxyBackendRequest(req, `/conversations/${conversationId}/participants/${encodedUsername}`, {
    method: "DELETE",
  });
}
