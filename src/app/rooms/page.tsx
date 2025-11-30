import Link from "next/link";
import JoinRoomClient from "./JoinRoomClient";
import type { Room } from "@/types/room";
import GlassPanel from "../../components/ui/GlassPanel";
import { AuroraLinkButton } from "../../components/ui/AuroraButton";
import { buildRequestContext, fetchBackend } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const context = await buildRequestContext({ fetchUser: true });

  if (!context.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Rooms</h1>
        <p className="mt-4 text-muted leading-relaxed">
          Please sign in to wander through the clearings. Your presence unlocks the rooms and their gathered stories.
        </p>
        <AuroraLinkButton href="/login" className="mt-6 mx-auto uppercase tracking-[0.3em] text-xs">
          Sign In
        </AuroraLinkButton>
      </GlassPanel>
    );
  }

  const { user } = context;
  const currentRoomId = user?.current_room_id ?? null;

  const res = await fetchBackend("/rooms/");

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    const message =
      (error && (error.detail || error.error)) ??
      (res.status === 401 ? "Session expired. Please log in again." : "Failed to load rooms.");
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Rooms</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-rose-300">{message}</p>
      </GlassPanel>
    );
  }

  const rooms: Room[] = await res.json();

  return (
    <section className="max-w-6xl mx-auto">
      <GlassPanel className="px-7 py-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[0.08em] text-white">Choose your clearing</h1>
          <p className="mt-3 text-muted leading-relaxed md:max-w-2xl">
            Each room hums with its own energy. Join a public gathering, invite companions for a smaller circle,
            or simply listen as stories drift beneath the starlit canopy.
          </p>
        </div>
        {currentRoomId && (
          <div className="text-xs uppercase tracking-[0.36em] text-text-aurora">
            <div>Currently dwelling in room #{currentRoomId}.</div>
            <Link href={`/rooms/${currentRoomId}`} className="link-aurora mt-1 inline-block">
              Return to the circle
            </Link>
          </div>
        )}
      </GlassPanel>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {rooms.map((room) => (
          <JoinRoomClient key={room.id} room={room} currentRoomId={currentRoomId} />
        ))}
      </div>
    </section>
  );
}
