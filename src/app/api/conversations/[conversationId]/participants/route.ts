import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(req: Request, context: Context) {
  const { conversationId } = await context.params;
  return proxyBackendRequest(req, `/conversations/${conversationId}/participants`, {
    method: "GET",
  });
}

export async function POST(req: Request, context: Context) {
  const { conversationId } = await context.params;
  const body = await req.text();
  return proxyBackendRequest(
    req,
    `/conversations/${conversationId}/participants`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}
