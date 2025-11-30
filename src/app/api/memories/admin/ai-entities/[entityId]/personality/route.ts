import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ entityId: string }>;
};

export async function POST(req: Request, context: Context) {
  const { entityId } = await context.params;
  const body = await req.text();

  return proxyBackendRequest(
    req,
    `/memories/admin/ai-entities/${entityId}/personality`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}
