"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";
import { logError } from "./error-logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: "app" | "feature" | "component";
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component following Single Responsibility Principle.
 * Catches JavaScript errors anywhere in the child component tree.
 *
 * @param children - Components to wrap with error boundary
 * @param fallback - Optional custom error UI renderer
 * @param onError - Optional error handler for logging/reporting
 * @param level - Boundary level for contextual error handling
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error using centralized logger (Single Source of Truth)
    logError({
      error,
      errorInfo,
      level: this.props.level || "component",
      timestamp: new Date().toISOString(),
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({ errorInfo });
  }

  reset = (): void => {
    this.setState({ error: null, errorInfo: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback, level = "component" } = this.props;

    if (error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.reset);
      }

      // Use default ErrorFallback component
      return <ErrorFallback error={error} reset={this.reset} level={level} />;
    }

    return children;
  }
}
