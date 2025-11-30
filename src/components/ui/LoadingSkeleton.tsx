/**
 * Flexible loading skeleton component for memory management UI.
 * Provides visual feedback during data loading.
 */

type LoadingSkeletonProps = {
  variant?: "memory" | "list" | "inline";
  count?: number;
  className?: string;
};

export function LoadingSkeleton({
  variant = "list",
  count = 3,
  className = ""
}: LoadingSkeletonProps) {
  // Inline spinner variant
  if (variant === "inline") {
    return (
      <div className={`inline-block ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-text-soft border-t-gold"></div>
      </div>
    );
  }

  // Memory card skeleton (more detailed)
  if (variant === "memory") {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border-panel bg-surface-soft p-5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-panel-hover rounded w-3/4"></div>
                <div className="h-3 bg-panel-hover rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-panel-hover rounded-full"></div>
                  <div className="h-5 w-16 bg-panel-hover rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 w-16 bg-panel-hover rounded-full"></div>
                <div className="h-8 w-16 bg-panel-hover rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List item skeleton (default - simpler)
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border-panel bg-surface-soft p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-panel-hover rounded w-2/3"></div>
              <div className="h-3 bg-panel-hover rounded w-1/2"></div>
            </div>
            <div className="h-3 w-20 bg-panel-hover rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
