import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function PATCH(req: Request) {
  const body = await req.text();
  return proxyBackendRequest(
    req,
    "/rooms/users/status",
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    }
  );
}

