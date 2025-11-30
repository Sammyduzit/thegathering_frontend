import { ErrorInfo } from "react";

export interface ErrorLogEntry {
  error: Error;
  errorInfo: ErrorInfo;
  level: "app" | "feature" | "component";
  timestamp: string;
  userAgent?: string;
  url?: string;
}

/**
 * Centralized error logging utility.
 * Single Source of Truth for all error logging in the application.
 *
 * This function can be extended to send errors to external services
 * like Sentry, LogRocket, or custom logging endpoints.
 */
export function logError(entry: ErrorLogEntry): void {
  // Add browser context
  const enrichedEntry: ErrorLogEntry = {
    ...entry,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  };

  // Console logging (always in development, controlled in production)
  if (process.env.NODE_ENV === "development") {
    console.group(
      `🚨 Error Boundary [${enrichedEntry.level}] - ${enrichedEntry.timestamp}`
    );
    console.error("Error:", enrichedEntry.error);
    console.error("Error Info:", enrichedEntry.errorInfo);
    console.error("Component Stack:", enrichedEntry.errorInfo.componentStack);
    if (enrichedEntry.url) {
      console.error("URL:", enrichedEntry.url);
    }
    console.groupEnd();
  }

  // TODO: Send to external error tracking service in production
  // Example integrations:
  // - Sentry.captureException(enrichedEntry.error, { contexts: { react: enrichedEntry.errorInfo } })
  // - Custom API endpoint: fetch('/api/errors', { method: 'POST', body: JSON.stringify(enrichedEntry) })

  // Store in sessionStorage for debugging (only last 10 errors)
  if (typeof window !== "undefined") {
    try {
      const storageKey = "error-boundary-logs";
      const existingLogs = sessionStorage.getItem(storageKey);
      const logs: ErrorLogEntry[] = existingLogs
        ? JSON.parse(existingLogs)
        : [];

      // Keep only last 10 errors
      const updatedLogs = [
        {
          ...enrichedEntry,
          error: {
            name: enrichedEntry.error.name,
            message: enrichedEntry.error.message,
            stack: enrichedEntry.error.stack,
          },
        },
        ...logs,
      ].slice(0, 10);

      sessionStorage.setItem(storageKey, JSON.stringify(updatedLogs));
    } catch (storageError) {
      // Ignore storage errors
      console.warn("Failed to store error in sessionStorage:", storageError);
    }
  }
}

/**
 * Retrieve stored error logs from sessionStorage.
 * Useful for debugging or displaying error history to users.
 */
export function getErrorLogs(): ErrorLogEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const storageKey = "error-boundary-logs";
    const existingLogs = sessionStorage.getItem(storageKey);
    return existingLogs ? JSON.parse(existingLogs) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all stored error logs.
 */
export function clearErrorLogs(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem("error-boundary-logs");
  } catch {
    // Ignore errors
  }
}
