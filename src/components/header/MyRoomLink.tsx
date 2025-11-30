"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

type MeResponse = {
  current_room_id: number | null;
};

export default function MyRoomLink() {
  const [roomId, setRoomId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    apiFetch<MeResponse>("/api/me", { retryOn401: false })
      .then(({ data }) => {
        if (!active) return;
        setRoomId(data.current_room_id ?? null);
      })
      .catch(() => {
        if (!active) return;
        setRoomId(null);
      });

    return () => {
      active = false;
    };
  }, []);

  if (roomId === undefined || roomId === null) {
    return null;
  }

  return (
    <Link
      href={`/rooms/${roomId}`}
      className="inline-flex items-center gap-1 rounded-full border border-border-aurora bg-aurora-haze px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.24em] font-semibold text-text-aurora"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-text-aurora animate-pulse" />
      My Room
    </Link>
  );
}
