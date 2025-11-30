import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  return proxyBackendRequest(req, "/rooms/count", { method: "GET" }, { csrf: false });
}

