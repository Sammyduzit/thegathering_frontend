import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ roomId: string }>;
};

export async function GET(req: Request, context: Context) {
  const { roomId } = await context.params;
  return proxyBackendRequest(req, `/rooms/${roomId}`, { method: "GET" });
}

export async function POST(req: Request, context: Context) {
  const { roomId } = await context.params;
  const body = await req.text();
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "leave") {
    return proxyBackendRequest(req, `/rooms/${roomId}/leave`, { method: "POST", body: body || undefined });
  }

  return proxyBackendRequest(req, `/rooms/${roomId}/join`, { method: "POST", body: body || undefined });
}

export async function PUT(req: Request, context: Context) {
  const { roomId } = await context.params;
  const body = await req.text();
  return proxyBackendRequest(
    req,
    `/rooms/${roomId}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}

export async function DELETE(req: Request, context: Context) {
  const { roomId } = await context.params;
  return proxyBackendRequest(req, `/rooms/${roomId}`, { method: "DELETE" });
}
