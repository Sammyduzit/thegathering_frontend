import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost";

const variantClassNames: Record<Variant, string> = {
  primary: "button-primary",
  ghost: "ghost-button",
};

export interface AuroraButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function AuroraButton({ variant = "primary", className, ...rest }: AuroraButtonProps) {
  return <button className={cn(variantClassNames[variant], className)} {...rest} />;
}

export interface AuroraLinkButtonProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> {
  variant?: Variant;
  className?: string;
}

export function AuroraLinkButton({ variant = "primary", className, ...rest }: AuroraLinkButtonProps) {
  return <Link className={cn(variantClassNames[variant], className)} {...rest} />;
}
