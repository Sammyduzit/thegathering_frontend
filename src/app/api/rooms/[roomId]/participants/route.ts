import { proxyBackendRequest } from "@/lib/backend-proxy";

type Context = {
  params: Promise<{ roomId: string }>;
};

export async function GET(req: Request, context: Context) {
  const { roomId } = await context.params;
  return proxyBackendRequest(req, `/rooms/${roomId}/participants`, { method: "GET" }, { csrf: false });
}

