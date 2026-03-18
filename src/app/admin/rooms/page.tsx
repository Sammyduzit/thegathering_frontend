import GlassPanel from "@/components/ui/GlassPanel";
import RoomManagementClient from "./RoomManagementClient";
import { buildRequestContext, fetchBackend } from "@/lib/server/request-context";
import type { Room } from "@/types/room";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const ctx = await buildRequestContext({ fetchUser: true });

  if (!ctx.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Room Management</h1>
        <p className="mt-4 text-sm text-text-muted">Please sign in as an administrator.</p>
      </GlassPanel>
    );
  }

  const { user } = ctx;

  if (!user?.is_admin) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Room Management</h1>
        <p className="mt-4 text-sm text-text-muted">This page is restricted to administrators.</p>
      </GlassPanel>
    );
  }

  const roomsResponse = await fetchBackend("/rooms/");

  if (!roomsResponse.ok) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Room Management</h1>
        <p className="mt-4 text-sm text-text-rose">
          Failed to load rooms (status {roomsResponse.status}).
        </p>
      </GlassPanel>
    );
  }

  const rooms: Room[] = await roomsResponse.json();

  return (
    <GlassPanel as="section" className="mx-auto max-w-6xl space-y-6 p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Room Management</h1>
        <p className="mt-2 text-sm text-text-muted">
          Create, update, or close rooms. This view is intended for administrators only.
        </p>
      </header>
      <RoomManagementClient initialRooms={rooms} />
    </GlassPanel>
  );
}
