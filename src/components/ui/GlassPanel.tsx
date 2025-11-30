import type { ElementType, ReactNode, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type GlassPanelProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & ComponentPropsWithoutRef<T>;

export default function GlassPanel<T extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: GlassPanelProps<T>) {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component className={cn("glass-panel border border-border-panel rounded-3xl", className)} {...rest}>
      {children}
    </Component>
  );
}
