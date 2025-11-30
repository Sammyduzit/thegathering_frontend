import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  return proxyBackendRequest(req, "/auth/me", { method: "GET" });
}

export async function PATCH(req: Request) {
  const body = await req.text();
  return proxyBackendRequest(
    req,
    "/auth/me",
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}
