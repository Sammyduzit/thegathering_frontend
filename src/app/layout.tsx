import "./globals.css";
import LogoutButton from "../components/LogoutButton";
import MyRoomLink from "../components/header/MyRoomLink";
import QuotaDisplay from "../components/header/QuotaDisplay";
import QuotaBannerWrapper from "../components/QuotaBannerWrapper";
import Link from "next/link";
import { Spectral, Inter } from "next/font/google";
import GlassPanel from "../components/ui/GlassPanel";
import { ErrorBoundary } from "@/components/error-boundary";
import { buildRequestContext } from "@/lib/server/request-context";
import type { ReactNode } from "react";

export const dynamic = 'force-dynamic';

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const baseNavLinks = [
  { href: "/rooms", label: "Rooms" },
  { href: "/conversations", label: "Conversations" },
  { href: "/me", label: "Profile" },
];

const adminNavLinks = [
  { href: "/admin/ai", label: "AI Mgmt" },
  { href: "/admin/rooms", label: "Room Mgmt" },
  { href: "/admin/memories", label: "Memories" },
  { href: "/admin/quota", label: "Quota" },
];

function AuroraHeader({ isAdmin }: { isAdmin: boolean }) {
  const navLinks = isAdmin ? [...baseNavLinks, ...adminNavLinks] : baseNavLinks;

  return (
    <header className="sticky top-0 z-50 px-4 pt-6 pb-4">
      <GlassPanel className="rounded-[20px] px-6 md:px-10 py-4 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(124,241,255,0.65),rgba(111,60,255,0.4))] shadow-[0_0_14px_rgba(124,241,255,0.45)]">
            <span className="absolute inset-0 rounded-full border border-border-panel-strong opacity-70" />
          </div>
          <div>
            <Link href="/" className="text-xl md:text-2xl font-semibold tracking-[0.08em] text-white uppercase">
              The Gathering
            </Link>
            <p className="text-xs text-muted uppercase tracking-[0.32em]">A quiet digital clearing</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2 md:gap-3 text-sm uppercase tracking-[0.24em]">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="link-aurora text-[0.68rem] md:text-[0.72rem]">
              {label}
            </Link>
          ))}
          <MyRoomLink />
        </nav>
        <div className="flex items-center gap-3 justify-end">
          <QuotaDisplay />
          <LogoutButton />
        </div>
      </GlassPanel>
    </header>
  );
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const ctx = await buildRequestContext({ fetchUser: true });
  const isAdmin = ctx.authenticated && ctx.user?.is_admin ? true : false;

  return (
    <html lang="en">
      <body className={`${spectral.variable} ${inter.variable}`}>
        <ErrorBoundary level="app">
          <div className="min-h-screen flex flex-col">
            <AuroraHeader isAdmin={isAdmin} />
            <QuotaBannerWrapper />
            <main className="flex-1">
              <ErrorBoundary level="feature">{children}</ErrorBoundary>
            </main>
            <footer className="px-6 py-10 text-center text-xs text-muted tracking-[0.32em] uppercase">
              <div className="star-divider mb-6" />
              <p>
                Guided by starlight · Humans &amp; AI in harmony ·{" "}
                {new Date().getFullYear()} © The Gathering
              </p>
            </footer>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
