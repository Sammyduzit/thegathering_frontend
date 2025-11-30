"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton } from "@/components/ui/AuroraButton";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface RoomErrorBoundaryProps {
  children: ReactNode;
  roomId: string;
}

/**
 * Room-specific Error Boundary with navigation fallback.
 * Single Responsibility: Handle room-specific errors with contextual recovery.
 */
export function RoomErrorBoundary({
  children,
  roomId,
}: RoomErrorBoundaryProps) {
  const router = useRouter();

  return (
    <ErrorBoundary
      level="feature"
      fallback={(error, reset) => (
        <div className="container mx-auto px-4 py-8">
          <GlassPanel className="max-w-2xl mx-auto p-8 text-center">
            <div className="space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              {/* Error Title */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Room Unavailable
                </h2>
                <p className="text-gray-300">
                  This room encountered an error. You can try again or return
                  to the rooms list.
                </p>
              </div>

              {/* Error Message */}
              {process.env.NODE_ENV === "development" && (
                <div className="bg-black/30 rounded-lg p-4 text-sm text-red-400">
                  {error.message}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <AuroraButton onClick={reset} variant="primary">
                  Try Again
                </AuroraButton>
                <AuroraButton
                  onClick={() => router.push("/rooms")}
                  variant="ghost"
                >
                  Back to Rooms
                </AuroraButton>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
