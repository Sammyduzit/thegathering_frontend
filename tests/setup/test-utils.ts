/**
 * Test Utilities - Single Source of Truth for test helpers
 * Following Single Responsibility Principle for each utility function
 */

/**
 * Mock fetch response helper
 */
export function createMockResponse(
  body: unknown,
  init: ResponseInit & { headers?: HeadersInit } = {}
): Response {
  const headers = new Headers(init.headers ?? undefined);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

/**
 * Mock fetch call tracker
 */
export interface FetchCall {
  input: Parameters<typeof fetch>[0];
  init: RequestInit;
}

export function createFetchMock(): {
  mock: typeof fetch;
  calls: FetchCall[];
  reset: () => void;
} {
  const calls: FetchCall[] = [];

  const mock = (async (
    input: Parameters<typeof fetch>[0],
    init: RequestInit = {}
  ) => {
    calls.push({ input, init });
    return createMockResponse({ ok: true }, { status: 200 });
  }) as typeof fetch;

  return {
    mock,
    calls,
    reset: () => {
      calls.length = 0;
    },
  };
}

/**
 * Mock document cookie helper
 */
export function mockDocumentCookie(cookie: string): void {
  globalThis.document = { cookie } as unknown as Document;
}

/**
 * Cleanup helper for restoring global state
 */
export class GlobalStateCleanup {
  private originalFetch: typeof globalThis.fetch;
  private originalDocument: typeof globalThis.document;
  private hadFetch: boolean;
  private hadDocument: boolean;

  constructor() {
    this.originalFetch = globalThis.fetch;
    this.originalDocument = globalThis.document;
    this.hadFetch = "fetch" in globalThis;
    this.hadDocument = "document" in globalThis;
  }

  restore(): void {
    if (this.hadFetch) {
      globalThis.fetch = this.originalFetch;
    } else {
      delete (globalThis as typeof globalThis & { fetch?: unknown }).fetch;
    }

    if (this.hadDocument) {
      globalThis.document = this.originalDocument;
    } else {
      delete (globalThis as typeof globalThis & { document?: undefined })
        .document;
    }
  }
}

/**
 * Async delay helper for testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create mock timer controls
 */
export function createMockTimers(): {
  setTimeout: typeof globalThis.setTimeout;
  setInterval: typeof globalThis.setInterval;
  clearTimeout: typeof globalThis.clearTimeout;
  clearInterval: typeof globalThis.clearInterval;
  timers: Set<ReturnType<typeof globalThis.setTimeout>>;
  clearAll: () => void;
} {
  const timers = new Set<ReturnType<typeof globalThis.setTimeout>>();

  const mockSetTimeout = ((
    callback: () => void,
    ms: number
  ): ReturnType<typeof globalThis.setTimeout> => {
    const id = setTimeout(() => {
      callback();
      timers.delete(id);
    }, ms);
    timers.add(id);
    return id;
  }) as typeof globalThis.setTimeout;

  const mockSetInterval = ((
    callback: () => void,
    ms: number
  ): ReturnType<typeof globalThis.setInterval> => {
    const id = setInterval(callback, ms);
    timers.add(id);
    return id;
  }) as typeof globalThis.setInterval;

  return {
    setTimeout: mockSetTimeout,
    setInterval: mockSetInterval,
    clearTimeout: (id) => {
      clearTimeout(id);
      timers.delete(id);
    },
    clearInterval: (id) => {
      clearInterval(id);
      timers.delete(id);
    },
    timers,
    clearAll: () => {
      timers.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
      timers.clear();
    },
  };
}
