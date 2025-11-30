/**
 * JSDOM Setup - Single Source of Truth for DOM testing environment
 */

import { JSDOM } from "jsdom";
import React from "react";

// Make React globally available for JSX
(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000",
  pretendToBeVisual: true,
});

globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;

// Use defineProperty for read-only properties
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  writable: true,
  configurable: true,
});

// Mock self for Next.js
(globalThis as typeof globalThis & { self?: unknown }).self = globalThis.window;

globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;

// Mock sessionStorage for error logging tests
if (!globalThis.window.sessionStorage) {
  const storage: Record<string, string> = {};
  globalThis.window.sessionStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    },
  } as Storage;
}

// Mock Next.js router
if (!globalThis.window.__NEXT_DATA__) {
  (globalThis.window as typeof globalThis.window & { __NEXT_DATA__?: unknown }).__NEXT_DATA__ = {
    props: {},
    page: "/",
    query: {},
    buildId: "test",
  };
}
