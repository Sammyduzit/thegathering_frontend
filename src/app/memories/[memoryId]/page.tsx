import Link from "next/link";
import { notFound } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import MemoryDetailClient from "./MemoryDetailClient";
import { buildRequestContext } from "@/lib/server/request-context";
import type { MemoryResponse } from "@/lib/memories";

type PageProps = {
  params: { memoryId: string };
};

export const dynamic = "force-dynamic";

export default async function MemoryDetailPage({ params }: PageProps) {
  const ctx = await buildRequestContext();

  if (!ctx.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Memories</h1>
        <p className="mt-4 text-sm text-muted">Please sign in as an administrator.</p>
      </GlassPanel>
    );
  }

  const { baseUrl, defaultHeaders } = ctx;

  const meResponse = await fetch(`${baseUrl}/api/me`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (meResponse.status === 401) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Memories</h1>
        <p className="mt-4 text-sm text-muted">Session expired. Please sign in again.</p>
      </GlassPanel>
    );
  }

  const me = await meResponse.json();

  if (!me?.is_admin) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Memories</h1>
        <p className="mt-4 text-sm text-muted">This page is restricted to administrators.</p>
      </GlassPanel>
    );
  }

  const memoryResponse = await fetch(`${baseUrl}/api/memories/${params.memoryId}`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (memoryResponse.status === 404) {
    notFound();
  }

  if (!memoryResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">AI Memories</h1>
        <p className="mt-4 text-sm text-text-rose">
          Failed to load memory (status {memoryResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const memory: MemoryResponse = await memoryResponse.json();

  return (
    <GlassPanel as="section" className="mx-auto max-w-5xl space-y-6 p-8">
      <Link href="/admin/memories" className="text-xs uppercase tracking-[0.32em] text-muted hover:text-white">
        &lt; Back to memories
      </Link>
      <MemoryDetailClient initialMemory={memory} />
    </GlassPanel>
  );
}
