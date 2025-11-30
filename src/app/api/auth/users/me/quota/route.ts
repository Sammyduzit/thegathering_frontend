import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  return proxyBackendRequest(req, "/auth/users/me/quota", { method: "GET" });
}
