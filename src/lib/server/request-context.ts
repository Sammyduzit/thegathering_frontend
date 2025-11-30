import { cookies, headers } from "next/headers";
import { fetchBackendDirect } from "../backend-proxy";

export type RequestContext =
  | { authenticated: false }
  | {
      authenticated: true;
      baseUrl: string;
      defaultHeaders: Record<string, string>;
      cookieHeader: string;
      user?: {
        username: string;
        current_room_id: number | null;
        is_admin: boolean;
      };
    };

export async function buildRequestContext(options?: {
  fetchUser?: boolean;
}): Promise<RequestContext> {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get("tg_access");

  if (!accessCookie) {
    return { authenticated: false };
  }

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host") ?? "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const defaultHeaders: Record<string, string> = {
    cookie: cookieHeader,
    authorization: `Bearer ${accessCookie.value}`,
    accept: "application/json",
  };

  // Optionally fetch user data (directly from backend, not through Next.js API route)
  if (options?.fetchUser) {
    // Use the authenticated user endpoint; "/me" does not exist on the backend
    const meResponse = await fetchBackendDirect("/auth/me", { cookieHeader });

    if (!meResponse.ok) {
      return { authenticated: false };
    }

    const me = await meResponse.json();

    return {
      authenticated: true,
      baseUrl,
      defaultHeaders,
      cookieHeader,
      user: {
        username: me?.username ?? "",
        current_room_id: me?.current_room_id ?? null,
        is_admin: me?.is_admin ?? false,
      },
    };
  }

  return { authenticated: true, baseUrl, defaultHeaders, cookieHeader };
}

/**
 * Convenience wrapper for fetchBackendDirect that automatically includes cookies.
 * Use this in server components to fetch backend data without double network hops.
 */
export async function fetchBackend(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  return fetchBackendDirect(path, { ...init, cookieHeader });
}
