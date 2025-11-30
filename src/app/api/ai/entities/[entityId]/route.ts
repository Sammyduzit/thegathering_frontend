import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ entityId: string }>;
};

export async function GET(req: Request, context: Context) {
  const { entityId } = await context.params;
  return proxyBackendRequest(req, `/ai/entities/${entityId}`, { method: "GET" });
}

export async function PATCH(req: Request, context: Context) {
  const { entityId } = await context.params;
  const body = await req.text();
  return proxyBackendRequest(
    req,
    `/ai/entities/${entityId}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    },
  );
}

export async function DELETE(req: Request, context: Context) {
  const { entityId } = await context.params;
  return proxyBackendRequest(req, `/ai/entities/${entityId}`, { method: "DELETE" });
}
