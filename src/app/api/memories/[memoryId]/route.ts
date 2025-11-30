import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ memoryId: string }>;
};

export async function GET(req: Request, context: Context) {
  const { memoryId } = await context.params;
  return proxyBackendRequest(req, `/memories/${memoryId}`, { method: "GET" }, { csrf: false });
}

export async function PATCH(req: Request, context: Context) {
  const { memoryId } = await context.params;
  const body = await req.text();
  return proxyBackendRequest(
    req,
    `/memories/${memoryId}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}

export async function DELETE(req: Request, context: Context) {
  const { memoryId } = await context.params;
  return proxyBackendRequest(req, `/memories/${memoryId}`, { method: "DELETE" });
}

