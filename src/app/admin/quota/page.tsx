import { cookies, headers } from "next/headers";
import GlassPanel from "@/components/ui/GlassPanel";
import type { UserQuotaExceededResponse } from "@/types/user";
import { formatDateTime } from "@/lib/format-date";

export const dynamic = "force-dynamic";

async function buildRequestContext() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get("tg_access");

  if (!accessCookie) {
    return { authenticated: false as const };
  }

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host") ?? "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const defaultHeaders = {
    cookie: cookieHeader,
    "content-type": "application/json",
  };

  return {
    authenticated: true as const,
    baseUrl,
    defaultHeaders,
  };
}

async function fetchQuotaExceeded(baseUrl: string, headers: Record<string, string>): Promise<UserQuotaExceededResponse[]> {
  try {
    const res = await fetch(`${baseUrl}/api/auth/admin/users/quota-exceeded`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch quota-exceeded users:", res.status);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching quota-exceeded users:", error);
    return [];
  }
}

export default async function QuotaAdminPage() {
  const ctx = await buildRequestContext();

  if (!ctx.authenticated) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <GlassPanel className="p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-muted">Please sign in to access this page.</p>
        </GlassPanel>
      </div>
    );
  }

  const users = await fetchQuotaExceeded(ctx.baseUrl, ctx.defaultHeaders);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Quota Monitoring</h1>
        <p className="text-muted">Users who have exceeded their weekly message quota</p>
      </div>

      <GlassPanel className="p-6">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">No users have exceeded their quota</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-panel-strong">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-white uppercase tracking-wide">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-white uppercase tracking-wide">Email</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-white uppercase tracking-wide">Used</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-white uppercase tracking-wide">Limit</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-white uppercase tracking-wide">Quota Reset</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-border-panel hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-sm text-white">{user.username}</td>
                    <td className="py-3 px-4 text-sm text-muted">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className="text-red-400 font-semibold">{user.used}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-white">{user.limit}</td>
                    <td className="py-3 px-4 text-sm text-right text-muted">
                      {formatDateTime(user.next_reset_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
