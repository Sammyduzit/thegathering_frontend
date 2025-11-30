/**
 * React Testing Utilities - Single Source of Truth for React component testing
 * Following Single Responsibility Principle for each utility function
 */

import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";

/**
 * Custom render function that wraps components with common providers
 * Single Source of Truth for rendering React components in tests
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  function Wrapper({ children }: { children: ReactNode }) {
    // Add common providers here (e.g., ErrorBoundary, Context providers)
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock router utilities for Next.js components
 */
export function createMockRouter(overrides: Partial<{
  push: (url: string) => void | Promise<boolean>;
  replace: (url: string) => void | Promise<boolean>;
  back: () => void;
  pathname: string;
  query: Record<string, string>;
}> = {}) {
  return {
    push: overrides.push || (() => Promise.resolve(true)),
    replace: overrides.replace || (() => Promise.resolve(true)),
    back: overrides.back || (() => {}),
    pathname: overrides.pathname || "/",
    query: overrides.query || {},
    prefetch: () => Promise.resolve(),
    route: overrides.pathname || "/",
    asPath: overrides.pathname || "/",
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
  };
}

/**
 * Mock intersection observer for components using lazy loading
 */
export function mockIntersectionObserver() {
  const mockIntersectionObserver = class {
    observe = () => null;
    unobserve = () => null;
    disconnect = () => null;
  };

  globalThis.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;
}

/**
 * Mock ResizeObserver for components using responsive behavior
 */
export function mockResizeObserver() {
  const mockResizeObserver = class {
    observe = () => null;
    unobserve = () => null;
    disconnect = () => null;
  };

  globalThis.ResizeObserver = mockResizeObserver as unknown as typeof ResizeObserver;
}

/**
 * Mock window.matchMedia for responsive component testing
 */
export function mockMatchMedia(matches: boolean = true) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}

/**
 * Wait for async state updates in React components
 */
export async function waitForNextUpdate(ms: number = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Simulate user interaction delay
 */
export function simulateUserDelay(ms: number = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
