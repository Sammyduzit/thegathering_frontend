import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  return proxyBackendRequest(req, "/conversations/", { method: "GET" });
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyBackendRequest(
    req,
    "/conversations/",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}
