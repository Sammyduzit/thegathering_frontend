"use client";

import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton } from "@/components/ui/AuroraButton";

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
  level: "app" | "feature" | "component";
}

/**
 * Error Fallback UI component.
 * Single Responsibility: Display error information and recovery options.
 */
export function ErrorFallback({ error, reset, level }: ErrorFallbackProps) {
  const getTitle = () => {
    switch (level) {
      case "app":
        return "Application Error";
      case "feature":
        return "Something went wrong";
      case "component":
        return "Component Error";
      default:
        return "Error";
    }
  };

  const getDescription = () => {
    switch (level) {
      case "app":
        return "The application encountered an unexpected error. Please try refreshing the page.";
      case "feature":
        return "This feature is currently unavailable. You can try again or continue using other parts of the application.";
      case "component":
        return "A component failed to load. Please try again.";
      default:
        return "An error occurred.";
    }
  };

  const showReloadPage = level === "app";

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <GlassPanel className="max-w-2xl w-full p-8 text-center">
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
              {getTitle()}
            </h2>
            <p className="text-gray-300">{getDescription()}</p>
          </div>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                Error Details
              </summary>
              <div className="bg-black/30 rounded-lg p-4 text-xs font-mono text-red-400 overflow-auto max-h-48">
                <div className="mb-2 font-semibold">{error.name}</div>
                <div className="mb-2">{error.message}</div>
                {error.stack && (
                  <pre className="text-gray-500 whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <AuroraButton onClick={reset} variant="primary">
              Try Again
            </AuroraButton>

            {showReloadPage && (
              <AuroraButton
                onClick={() => window.location.reload()}
                variant="ghost"
              >
                Reload Page
              </AuroraButton>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
