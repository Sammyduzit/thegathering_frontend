import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function POST(req: Request) {
  return proxyBackendRequest(
    req,
    "/auth/logout",
    {
      method: "POST",
    },
    { csrf: true }
  );
}
