import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function POST(req: Request) {
  const body = await req.text();
  return proxyBackendRequest(
    req,
    "/auth/register",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    },
    { csrf: false }
  );
}
