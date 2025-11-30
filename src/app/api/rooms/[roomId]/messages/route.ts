import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ roomId: string }>;
};

export async function GET(req: Request, context: Context) {
  const { roomId } = await context.params;
  const url = new URL(req.url);
  const search = url.search;
  return proxyBackendRequest(
    req,
    `/rooms/${roomId}/messages${search}`,
    {
      method: "GET",
    },
    { csrf: false }
  );
}

export async function POST(req: Request, context: Context) {
  const { roomId } = await context.params;
  const body = await req.text();
  return proxyBackendRequest(
    req,
    `/rooms/${roomId}/messages`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}
