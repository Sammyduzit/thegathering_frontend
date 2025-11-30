import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ entityId: string }>;
};

export async function POST(req: Request, context: Context) {
  const { entityId } = await context.params;
  return proxyBackendRequest(req, `/ai/entities/${entityId}/goodbye`, { method: "POST" });
}
