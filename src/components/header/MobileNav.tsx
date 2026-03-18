"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { BASE_NAV_LINKS, ADMIN_NAV_LINKS, isLinkActive } from "@/lib/nav";
import QuotaDisplay from "./QuotaDisplay";
import MyRoomLink from "./MyRoomLink";
import LogoutButton from "../LogoutButton";

export function MobileMenuButton({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-border-mist text-text-muted hover:text-white hover:border-border-mist-strong transition-colors"
      >
        {open ? (
          <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 12" className="w-4 h-3" fill="none">
            <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-72 z-50 md:hidden glass-panel border-l border-border-panel",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full px-6 py-8 overflow-y-auto">
          {/* Close */}
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-mist text-text-subtle hover:text-white hover:border-border-mist-strong transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Base nav links */}
          <nav className="flex flex-col gap-1">
            {BASE_NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-sm uppercase tracking-[0.24em] transition-colors duration-150",
                  isLinkActive(href, pathname)
                    ? "text-text-aurora bg-surface-soft"
                    : "text-text-muted hover:text-white hover:bg-surface-soft"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="my-5 h-px bg-border-mist" />
              <p className="px-3 mb-2 text-[0.6rem] uppercase tracking-[0.32em] text-text-faint">
                Admin
              </p>
              <nav className="flex flex-col gap-1">
                {ADMIN_NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-sm uppercase tracking-[0.24em] transition-colors duration-150",
                      isLinkActive(href, pathname)
                        ? "text-text-aurora bg-surface-soft"
                        : "text-text-muted hover:text-white hover:bg-surface-soft"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </>
          )}

          {/* Bottom actions */}
          <div className="mt-auto pt-6">
            <div className="star-divider mb-6" />
            <div className="flex flex-col gap-3">
              <MyRoomLink />
              <QuotaDisplay />
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
