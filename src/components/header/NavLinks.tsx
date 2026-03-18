"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { BASE_NAV_LINKS, ADMIN_NAV_LINKS, isLinkActive } from "@/lib/nav";

const linkBase = "text-[0.68rem] md:text-[0.72rem] uppercase tracking-[0.24em] transition-colors duration-200";
const linkActive = "text-text-aurora";
const linkIdle = "text-text-primary hover:text-text-aurora";

function AdminDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = ADMIN_NAV_LINKS.some((l) => isLinkActive(l.href, pathname));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(linkBase, "flex items-center gap-1", active ? linkActive : linkIdle)}
      >
        Admin
        <svg
          className={cn("w-2.5 h-2.5 transition-transform duration-200", open && "rotate-180")}
          viewBox="0 0 10 6"
          fill="none"
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-3 glass-panel border border-border-panel rounded-xl py-1.5 min-w-[160px] z-50 shadow-xl">
          {ADMIN_NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2.5 text-[0.68rem] uppercase tracking-[0.24em] transition-colors duration-150",
                isLinkActive(href, pathname)
                  ? "text-text-aurora bg-surface-deep"
                  : "text-text-muted hover:text-white hover:bg-surface-soft"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 md:gap-5">
      {BASE_NAV_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(linkBase, isLinkActive(href, pathname) ? linkActive : linkIdle)}
        >
          {label}
        </Link>
      ))}
      {isAdmin && <AdminDropdown pathname={pathname} />}
    </nav>
  );
}
