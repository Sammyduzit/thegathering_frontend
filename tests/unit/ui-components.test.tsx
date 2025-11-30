/**
 * UI Components Test Suite
 * Tests for AuroraButton, AlertStrip, and GlassPanel components
 */

import test from "node:test";
import assert from "node:assert/strict";
import "../setup/jsdom-setup";
import { render, screen } from "@testing-library/react";

import { AuroraButton, AuroraLinkButton } from "../../src/components/ui/AuroraButton";
import AlertStrip from "../../src/components/ui/AlertStrip";
import GlassPanel from "../../src/components/ui/GlassPanel";

// AuroraButton Tests
test("AuroraButton - renders with default variant", () => {
  render(<AuroraButton>Click me</AuroraButton>);
  const button = screen.getByRole("button", { name: "Click me" });

  assert.ok(button);
  assert.ok(button.classList.contains("button-primary"));
});

test("AuroraButton - renders with ghost variant", () => {
  render(<AuroraButton variant="ghost">Ghost Button</AuroraButton>);
  const button = screen.getByRole("button", { name: "Ghost Button" });

  assert.ok(button.classList.contains("ghost-button"));
});

test("AuroraButton - forwards additional props", () => {
  render(
    <AuroraButton type="submit" disabled data-testid="test-button">
      Submit
    </AuroraButton>
  );
  const button = screen.getByTestId("test-button") as HTMLButtonElement;

  assert.equal(button.type, "submit");
  assert.equal(button.disabled, true);
});

test("AuroraButton - merges custom className", () => {
  render(<AuroraButton className="custom-class">Button</AuroraButton>);
  const button = screen.getByRole("button", { name: "Button" });

  assert.ok(button.classList.contains("button-primary"));
  assert.ok(button.classList.contains("custom-class"));
});

test("AuroraButton - handles onClick event", () => {
  let clicked = false;
  render(<AuroraButton onClick={() => (clicked = true)}>Click</AuroraButton>);
  const button = screen.getByRole("button", { name: "Click" });

  button.click();
  assert.equal(clicked, true);
});

test("AuroraLinkButton - renders as Next.js Link", () => {
  render(<AuroraLinkButton href="/test">Link</AuroraLinkButton>);
  const link = screen.getByRole("link", { name: "Link" }) as HTMLAnchorElement;

  assert.ok(link);
  assert.equal(link.href, "http://localhost:3000/test");
});

test("AuroraLinkButton - applies variant classes", () => {
  render(
    <AuroraLinkButton href="/test" variant="ghost">
      Ghost Link
    </AuroraLinkButton>
  );
  const link = screen.getByRole("link", { name: "Ghost Link" });

  assert.ok(link.classList.contains("ghost-button"));
});

// AlertStrip Tests
test("AlertStrip - renders with default info variant", () => {
  render(<AlertStrip>Info message</AlertStrip>);
  const alert = screen.getByText("Info message");

  assert.ok(alert);
  assert.ok(alert.classList.contains("bg-surface-soft"));
});

test("AlertStrip - renders with notice variant", () => {
  render(<AlertStrip variant="notice">Notice message</AlertStrip>);
  const alert = screen.getByText("Notice message");

  assert.ok(alert.classList.contains("bg-notice"));
  assert.ok(alert.classList.contains("text-gold"));
});

test("AlertStrip - renders with warning variant", () => {
  render(<AlertStrip variant="warning">Warning message</AlertStrip>);
  const alert = screen.getByText("Warning message");

  assert.ok(alert.classList.contains("text-text-soft"));
});

test("AlertStrip - renders with danger variant", () => {
  render(<AlertStrip variant="danger">Error message</AlertStrip>);
  const alert = screen.getByText("Error message");

  assert.ok(alert.classList.contains("bg-rose-veil"));
  assert.ok(alert.classList.contains("text-text-rose"));
});

test("AlertStrip - merges custom className", () => {
  render(<AlertStrip className="mt-4">Message</AlertStrip>);
  const alert = screen.getByText("Message");

  assert.ok(alert.classList.contains("rounded-3xl"));
  assert.ok(alert.classList.contains("mt-4"));
});

test("AlertStrip - renders children correctly", () => {
  render(
    <AlertStrip variant="danger">
      <strong>Error:</strong> Something went wrong
    </AlertStrip>
  );

  assert.ok(screen.getByText("Error:"));
  assert.ok(screen.getByText(/Something went wrong/));
});

// GlassPanel Tests
test("GlassPanel - renders as div by default", () => {
  render(<GlassPanel>Content</GlassPanel>);
  const panel = screen.getByText("Content");

  assert.equal(panel.tagName, "DIV");
  assert.ok(panel.classList.contains("glass-panel"));
});

test("GlassPanel - renders with custom element", () => {
  render(<GlassPanel as="section">Section content</GlassPanel>);
  const panel = screen.getByText("Section content");

  assert.equal(panel.tagName, "SECTION");
});

test("GlassPanel - renders with article element", () => {
  render(<GlassPanel as="article">Article content</GlassPanel>);
  const panel = screen.getByText("Article content");

  assert.equal(panel.tagName, "ARTICLE");
});

test("GlassPanel - merges custom className", () => {
  render(<GlassPanel className="p-8">Panel</GlassPanel>);
  const panel = screen.getByText("Panel");

  assert.ok(panel.classList.contains("glass-panel"));
  assert.ok(panel.classList.contains("p-8"));
});

test("GlassPanel - forwards props to rendered element", () => {
  render(
    <GlassPanel data-testid="test-panel" aria-label="Test panel">
      Content
    </GlassPanel>
  );
  const panel = screen.getByTestId("test-panel");

  assert.equal(panel.getAttribute("aria-label"), "Test panel");
});

test("GlassPanel - applies border styles", () => {
  render(<GlassPanel data-testid="border-test">Border styles</GlassPanel>);
  const panel = screen.getByTestId("border-test");

  assert.ok(panel.classList.contains("border"));
  assert.ok(panel.classList.contains("rounded-3xl"));
});

test("GlassPanel - renders complex children", () => {
  render(
    <GlassPanel>
      <h2>Title</h2>
      <p>Description</p>
    </GlassPanel>
  );

  assert.ok(screen.getByText("Title"));
  assert.ok(screen.getByText("Description"));
});

test("GlassPanel - supports button element", () => {
  render(
    <GlassPanel as="button" type="button">
      Clickable Panel
    </GlassPanel>
  );
  const panel = screen.getByRole("button", { name: "Clickable Panel" });

  assert.ok(panel);
  assert.ok(panel.classList.contains("glass-panel"));
});
