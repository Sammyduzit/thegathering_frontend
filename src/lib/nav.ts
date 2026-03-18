export const BASE_NAV_LINKS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/conversations", label: "Conversations" },
  { href: "/me", label: "Profile" },
] as const;

export const ADMIN_NAV_LINKS = [
  { href: "/admin/ai", label: "AI Entities" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/memories", label: "Memories" },
  { href: "/admin/quota", label: "Quota" },
] as const;

export function isLinkActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
