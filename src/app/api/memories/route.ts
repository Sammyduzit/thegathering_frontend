import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.search;
  return proxyBackendRequest(req, `/memories${search}`, { method: "GET" }, { csrf: false });
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyBackendRequest(
    req,
    "/memories",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}

