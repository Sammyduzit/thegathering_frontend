import "./globals.css";
import LogoutButton from "../components/LogoutButton";
import MyRoomLink from "../components/header/MyRoomLink";
import QuotaDisplay from "../components/header/QuotaDisplay";
import QuotaBannerWrapper from "../components/QuotaBannerWrapper";
import { NavLinks } from "../components/header/NavLinks";
import { MobileMenuButton } from "../components/header/MobileNav";
import Link from "next/link";
import { Spectral, Inter } from "next/font/google";
import GlassPanel from "../components/ui/GlassPanel";
import { ErrorBoundary } from "@/components/error-boundary";
import { buildRequestContext } from "@/lib/server/request-context";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

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

function AuroraHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-50 px-4 pt-6 pb-4">
      <GlassPanel className="rounded-[20px] px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative h-9 w-9 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(124,241,255,0.65),rgba(111,60,255,0.4))] shadow-[0_0_14px_rgba(124,241,255,0.45)]">
            <span className="absolute inset-0 rounded-full border border-border-panel-strong opacity-70" />
          </div>
          <div>
            <Link
              href="/"
              className="text-lg md:text-xl font-semibold tracking-[0.08em] text-white uppercase"
            >
              The Gathering
            </Link>
            <p className="hidden sm:block text-[0.6rem] text-text-muted uppercase tracking-[0.32em]">
              A quiet digital clearing
            </p>
          </div>
        </div>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavLinks isAdmin={isAdmin} />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Desktop: full actions */}
          <div className="hidden md:flex items-center gap-2">
            <QuotaDisplay />
            <MyRoomLink />
            <LogoutButton />
          </div>

          {/* Mobile: room link + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <MyRoomLink />
            <MobileMenuButton isAdmin={isAdmin} />
          </div>
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
            <footer className="px-6 py-10 text-center text-xs text-text-muted tracking-[0.32em] uppercase">
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
