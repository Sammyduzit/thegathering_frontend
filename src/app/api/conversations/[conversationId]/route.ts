import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(req: Request, context: Context) {
  const { conversationId } = await context.params;
  return proxyBackendRequest(req, `/conversations/${conversationId}`, {
    method: "GET",
  });
}

export async function PATCH(req: Request, context: Context) {
  const { conversationId } = await context.params;
  const body = await req.text();

  return proxyBackendRequest(
    req,
    `/conversations/${conversationId}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}

export async function DELETE(req: Request, context: Context) {
  const { conversationId } = await context.params;
  return proxyBackendRequest(req, `/conversations/${conversationId}`, {
    method: "DELETE",
  });
}
