import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  return proxyBackendRequest(req, "/rooms/", { method: "GET" });
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyBackendRequest(
    req,
    "/rooms/",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}
