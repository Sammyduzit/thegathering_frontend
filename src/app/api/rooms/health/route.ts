import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  return proxyBackendRequest(req, "/rooms/health", { method: "GET" }, { csrf: false });
}

