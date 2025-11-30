import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.search;
  return proxyBackendRequest(req, `/memories/search${search}`, { method: "GET" }, { csrf: false });
}

