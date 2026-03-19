import type { ReactNode } from "react";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return <div className="flex items-start justify-center px-4 pt-10 pb-16">{children}</div>;
}
